/**
 * Autopilot v2 — núcleo do motor (fila de jobs).
 *
 * Roda em 2º plano: o worker reserva jobs prontos (claim atômico via RPC),
 * processa poucos por invocação dentro de um orçamento de tempo (limite da edge
 * function), e aplica retry com backoff. Os handlers de cada tipo de job são
 * injetados (implementados nas Fases 3/4).
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
export type SB = any;

export type JobKind = "gen_image" | "gen_caption" | "schedule_post" | "confirm_post";

export interface Job {
  id: string;
  company_id: string;
  plan_id: string;
  post_id: string | null;
  kind: JobKind;
  status: string;
  attempts: number;
  max_attempts: number;
  payload: Record<string, unknown>;
  last_error: string | null;
}

export type JobHandler = (sb: SB, job: Job) => Promise<void>;
export type HandlerMap = Partial<Record<JobKind, JobHandler>>;

/** Backoff exponencial (segundos): min(60 * 2^attempts, 900). */
export function backoffSeconds(attempts: number): number {
  return Math.min(60 * Math.pow(2, attempts), 900);
}

export function serviceClient(): SB {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** Autoriza chamadas internas (cron → tick → worker): Bearer == service role key. */
export function isServiceCall(req: Request): boolean {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  return !!key && auth === `Bearer ${key}`;
}

/**
 * Autoriza o tick do pg_cron. O cron não consegue ler env vars de Edge Function,
 * então ele envia o token `autopilot_service_key` guardado no Vault. Chamadas
 * internas antigas com service role continuam válidas.
 */
export async function isAutopilotTickCall(req: Request): Promise<boolean> {
  if (isServiceCall(req)) return true;

  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;

  try {
    const sb = serviceClient();
    const { data, error } = await sb.rpc("get_vault_secret", { secret_name: "autopilot_service_key" });
    const cronKey = typeof data === "string" ? data : "";
    return !error && !!cronKey && auth === `Bearer ${cronKey}`;
  } catch {
    return false;
  }
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export interface WorkerResult {
  claimed: number;
  done: number;
  requeued: number;
  failed: number;
  loops: number;
}

export interface WorkerOpts {
  batch?: number; // jobs por claim
  budgetMs?: number; // orçamento de tempo por invocação (fica < limite da edge function)
}

/**
 * Drena a fila enquanto houver jobs prontos E orçamento de tempo. Retorna
 * quando a fila esvazia ou o tempo acaba — o tick reinvoca no próximo minuto.
 */
export async function runWorker(sb: SB, handlers: HandlerMap, opts: WorkerOpts = {}): Promise<WorkerResult> {
  const batch = opts.batch ?? 3;
  const deadline = Date.now() + (opts.budgetMs ?? 60_000);
  const res: WorkerResult = { claimed: 0, done: 0, requeued: 0, failed: 0, loops: 0 };

  while (Date.now() < deadline) {
    res.loops++;
    const { data: jobs, error } = await sb.rpc("autopilot_claim_jobs", { _limit: batch });
    if (error) throw new Error(`claim falhou: ${error.message}`);
    const list = (jobs ?? []) as Job[];
    if (list.length === 0) break; // fila vazia
    res.claimed += list.length;

    for (const job of list) {
      const nowIso = new Date().toISOString();
      try {
        const handler = handlers[job.kind];
        if (!handler) throw new Error(`handler não implementado para kind='${job.kind}'`);
        await handler(sb, job);
        await sb.from("autopilot_jobs")
          .update({ status: "done", last_error: null, updated_at: nowIso })
          .eq("id", job.id);
        res.done++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (job.attempts >= job.max_attempts) {
          await sb.from("autopilot_jobs")
            .update({ status: "failed", last_error: msg, updated_at: nowIso })
            .eq("id", job.id);
          if (job.post_id) {
            await sb.from("autopilot_posts")
              .update({ status: "failed", error: msg, updated_at: nowIso })
              .eq("id", job.post_id);
          }
          res.failed++;
        } else {
          const next = new Date(Date.now() + backoffSeconds(job.attempts) * 1000).toISOString();
          await sb.from("autopilot_jobs")
            .update({ status: "queued", next_attempt_at: next, last_error: msg, updated_at: nowIso })
            .eq("id", job.id);
          res.requeued++;
        }
      }
    }
  }

  return res;
}
