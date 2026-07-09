import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

/**
 * Autopilot Plan — painel de ações do plano (Autopilot v2).
 *
 * É o ponto de entrada da UI para tudo que muda o ciclo. Só o que precisa de
 * service_role vive aqui: escrever na fila `autopilot_jobs` (o client só tem
 * SELECT), invocar o worker e desagendar no Post for Me. Ações puramente de
 * linha (editar legenda, remover, ajustar horário) continuam sendo update
 * direto do client via RLS — não passam por aqui.
 *
 * Autenticação: JWT do usuário (requireUser). A pertinência à empresa é
 * garantida pela RLS: as leituras/escritas guardadas usam um client com o JWT
 * do usuário; a fila e o PFM usam o client de serviço.
 *
 * Ações:
 *   create  { plan, rows }   → cria plano + posts(draft) + enfileira geração
 *   approve { plan_id }      → posts ready→approved + enfileira schedule_post
 *   regen   { post_id, kind }→ reenfileira gen_image|gen_caption de 1 post
 *   pause   { plan_id }      → desagenda no PFM, posts→approved, plano→paused
 *   resume  { plan_id }      → reenfileira schedule_post, plano→approved
 *   cancel  { plan_id }      → desagenda no PFM, plano→canceled (não retomável)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

// deno-lint-ignore no-explicit-any
type SB = any;

function serviceClient(): SB {
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

/** Client com o JWT do usuário: a RLS garante que ele só toca dados da empresa dele. */
function userClient(authHeader: string): SB {
  return createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
}

/** Invoca o worker para começar a drenar a fila imediatamente (não espera o tick). */
async function invokeWorker(): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/autopilot-worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
      body: "{}",
    });
  } catch (e) {
    console.error("[autopilot-plan] invokeWorker:", e instanceof Error ? e.message : e);
  }
}

/** Dispara o worker sem bloquear a resposta da ação da UI. O tick periódico segue como fallback. */
function triggerWorker(): void {
  const task = invokeWorker();
  const runtime = globalThis as unknown as { EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void } };
  if (typeof runtime.EdgeRuntime?.waitUntil === "function") {
    runtime.EdgeRuntime.waitUntil(task);
  } else {
    task.catch((e) => console.error("[autopilot-plan] triggerWorker:", e instanceof Error ? e.message : e));
  }
}

/** Chamada interna ao Post for Me (mesma proxy do app). */
async function pfmCall(
  companyId: string,
  userId: string | undefined,
  tool: string,
  args: Record<string, unknown>,
): Promise<void> {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/postforme-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ tool, args, companyId, userId }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error(`[autopilot-plan] pfm ${tool} ${r.status}: ${t.slice(0, 200)}`);
    }
  } catch (e) {
    console.error(`[autopilot-plan] pfm ${tool}:`, e instanceof Error ? e.message : e);
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ─── Ações ──────────────────────────────────────────────────────────

interface CreateRow {
  date?: string | null;
  theme?: string | null;
  category?: string | null;
}

interface CreatePayload {
  company_id?: string;
  brand_id?: string | null;
  name?: string;
  platforms?: string[];
  social_account_ids?: string[];
  timezone?: string;
  requires_approval?: boolean;
}

async function actionCreate(
  sbUser: SB,
  sbSvc: SB,
  userId: string,
  plan: CreatePayload,
  rows: CreateRow[],
): Promise<Response> {
  if (!plan?.company_id) return json({ error: "company_id é obrigatório." }, 400);
  if (!Array.isArray(rows) || rows.length === 0) return json({ error: "Nenhuma linha no plano." }, 400);

  // Toda linha precisa de data válida + tema (a grade da UI garante isso antes).
  const clean = rows.map((r) => ({
    date: typeof r.date === "string" && DATE_RE.test(r.date) ? r.date : null,
    theme: typeof r.theme === "string" ? r.theme.trim() : "",
    category: typeof r.category === "string" && r.category.trim() ? r.category.trim() : null,
  }));
  const invalid = clean.filter((r) => !r.date || !r.theme);
  if (invalid.length > 0) {
    return json({ error: `${invalid.length} linha(s) sem data ou tema. Complete a grade antes de gerar.` }, 400);
  }

  const dates = clean.map((r) => r.date!).sort();
  const periodStart = dates[0];
  const periodEnd = dates[dates.length - 1];

  // 1. Plano (via client do usuário → RLS confere a pertinência à empresa).
  const { data: created, error: planErr } = await sbUser
    .from("autopilot_plans")
    .insert({
      company_id: plan.company_id,
      brand_id: plan.brand_id ?? null,
      created_by: userId,
      name: (plan.name && plan.name.trim()) || `Plano ${periodStart}`,
      platforms: plan.platforms ?? [],
      social_account_ids: plan.social_account_ids ?? [],
      timezone: plan.timezone || "America/Sao_Paulo",
      requires_approval: plan.requires_approval ?? true,
      status: "generating",
      period_start: periodStart,
      period_end: periodEnd,
    })
    .select()
    .single();
  if (planErr || !created) {
    return json({ error: `Não foi possível criar o plano: ${planErr?.message ?? "desconhecido"}` }, 400);
  }

  // 2. Posts (draft) — via client do usuário.
  const postsPayload = clean.map((r) => ({
    plan_id: created.id,
    company_id: plan.company_id,
    post_date: r.date,
    theme: r.theme,
    category: r.category,
    status: "draft",
  }));
  const { data: posts, error: postsErr } = await sbUser
    .from("autopilot_posts")
    .insert(postsPayload)
    .select("id, company_id, plan_id");
  if (postsErr || !posts) {
    // rollback do plano para não deixar lixo órfão
    await sbSvc.from("autopilot_plans").delete().eq("id", created.id);
    return json({ error: `Não foi possível criar os posts: ${postsErr?.message ?? "desconhecido"}` }, 400);
  }

  // 3. Jobs de geração (via service_role — o client não escreve na fila).
  const jobs = posts.flatMap((p: { id: string; company_id: string; plan_id: string }) => [
    { company_id: p.company_id, plan_id: p.plan_id, post_id: p.id, kind: "gen_image", status: "queued" },
    { company_id: p.company_id, plan_id: p.plan_id, post_id: p.id, kind: "gen_caption", status: "queued" },
  ]);
  const { error: jobsErr } = await sbSvc.from("autopilot_jobs").insert(jobs);
  if (jobsErr) {
    await sbSvc.from("autopilot_plans").update({ status: "failed" }).eq("id", created.id);
    return json({ error: `Não foi possível enfileirar a geração: ${jobsErr.message}` }, 500);
  }

  triggerWorker();
  return json({ plan: created, posts_count: posts.length });
}

async function loadPlanGuarded(sbUser: SB, planId: string): Promise<{ plan?: SB; error?: Response }> {
  if (!planId) return { error: json({ error: "plan_id é obrigatório." }, 400) };
  const { data: plan } = await sbUser.from("autopilot_plans").select("*").eq("id", planId).single();
  if (!plan) return { error: json({ error: "Plano não encontrado." }, 404) };
  return { plan };
}

async function actionApprove(sbUser: SB, sbSvc: SB, planId: string): Promise<Response> {
  const { plan, error } = await loadPlanGuarded(sbUser, planId);
  if (error) return error;
  if (plan.status === "canceled") return json({ error: "Plano cancelado não pode ser aprovado." }, 409);

  // ready → approved (só posts prontos entram no ciclo).
  const { error: upErr } = await sbUser
    .from("autopilot_posts")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("plan_id", planId)
    .eq("status", "ready");
  if (upErr) return json({ error: `Falha ao aprovar posts: ${upErr.message}` }, 400);

  // Enfileira schedule_post dos aprovados ainda não agendados (idempotente por pfm_post_id).
  const { data: posts } = await sbUser
    .from("autopilot_posts")
    .select("id, company_id, plan_id")
    .eq("plan_id", planId)
    .eq("status", "approved")
    .is("pfm_post_id", null);
  const list = (posts ?? []) as Array<{ id: string; company_id: string; plan_id: string }>;
  if (list.length === 0) return json({ error: "Nenhum post pronto para aprovar." }, 409);

  const jobs = list.map((p) => ({
    company_id: p.company_id,
    plan_id: p.plan_id,
    post_id: p.id,
    kind: "schedule_post",
    status: "queued",
  }));
  const { error: jobsErr } = await sbSvc.from("autopilot_jobs").insert(jobs);
  if (jobsErr) return json({ error: `Falha ao enfileirar agendamento: ${jobsErr.message}` }, 500);

  await sbUser.from("autopilot_plans").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", planId);
  triggerWorker();
  return json({ ok: true, scheduled_jobs: list.length });
}

async function actionRegen(sbUser: SB, sbSvc: SB, postId: string, kind: string): Promise<Response> {
  if (!postId) return json({ error: "post_id é obrigatório." }, 400);
  const jobKind = kind === "caption" ? "gen_caption" : kind === "image" ? "gen_image" : null;
  if (!jobKind) return json({ error: "kind deve ser 'image' ou 'caption'." }, 400);

  const { data: post } = await sbUser
    .from("autopilot_posts")
    .select("id, company_id, plan_id, status")
    .eq("id", postId)
    .single();
  if (!post) return json({ error: "Post não encontrado." }, 404);
  if (post.status === "removed") return json({ error: "Post removido não pode ser regenerado." }, 409);

  // Volta o post a 'generating' para a UI refletir; promoteIfReady o repromove.
  await sbUser
    .from("autopilot_posts")
    .update({ status: "generating", error: null, updated_at: new Date().toISOString() })
    .eq("id", postId);

  const { error: jobErr } = await sbSvc.from("autopilot_jobs").insert({
    company_id: post.company_id,
    plan_id: post.plan_id,
    post_id: post.id,
    kind: jobKind,
    status: "queued",
  });
  if (jobErr) return json({ error: `Falha ao enfileirar regeneração: ${jobErr.message}` }, 500);

  triggerWorker();
  return json({ ok: true });
}

/** Desagenda no PFM todos os posts 'scheduled' do plano e os devolve a 'approved'. */
async function unschedulePlan(sbUser: SB, plan: SB): Promise<number> {
  const { data: posts } = await sbUser
    .from("autopilot_posts")
    .select("id, pfm_post_id, time_locked")
    .eq("plan_id", plan.id)
    .eq("status", "scheduled");
  const list = (posts ?? []) as Array<{ id: string; pfm_post_id: string | null; time_locked: boolean }>;
  for (const p of list) {
    if (p.pfm_post_id) await pfmCall(plan.company_id, plan.created_by, "pfm_delete_post", { id: p.pfm_post_id });
    await sbUser
      .from("autopilot_posts")
      .update({
        status: "approved",
        pfm_post_id: null,
        scheduled_at: p.time_locked ? undefined : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
  }
  return list.length;
}

/** Cancela jobs pendentes (queued) do plano — evita consumir crédito de IA depois de pausar/cancelar. */
async function cancelPendingJobs(sbSvc: SB, planId: string, reason: string): Promise<number> {
  const { data } = await sbSvc
    .from("autopilot_jobs")
    .update({ status: "failed", last_error: reason, updated_at: new Date().toISOString() })
    .eq("plan_id", planId)
    .eq("status", "queued")
    .select("id");
  return Array.isArray(data) ? data.length : 0;
}

async function actionPause(sbUser: SB, sbSvc: SB, planId: string): Promise<Response> {
  const { plan, error } = await loadPlanGuarded(sbUser, planId);
  if (error) return error;
  if (!["active", "approved", "generating"].includes(plan.status)) {
    return json({ error: "Só é possível pausar um plano em execução." }, 409);
  }
  const unscheduled = await unschedulePlan(sbUser, plan);
  const jobsCanceled = await cancelPendingJobs(sbSvc, planId, "plano pausado");
  await sbUser.from("autopilot_plans").update({ status: "paused", updated_at: new Date().toISOString() }).eq("id", planId);
  return json({ ok: true, unscheduled, jobs_canceled: jobsCanceled });
}

async function actionResume(sbUser: SB, sbSvc: SB, planId: string): Promise<Response> {
  const { plan, error } = await loadPlanGuarded(sbUser, planId);
  if (error) return error;
  if (plan.status !== "paused") return json({ error: "Só é possível retomar um plano pausado." }, 409);

  const { data: posts } = await sbUser
    .from("autopilot_posts")
    .select("id, company_id, plan_id")
    .eq("plan_id", planId)
    .eq("status", "approved")
    .is("pfm_post_id", null);
  const list = (posts ?? []) as Array<{ id: string; company_id: string; plan_id: string }>;
  if (list.length > 0) {
    const jobs = list.map((p) => ({
      company_id: p.company_id,
      plan_id: p.plan_id,
      post_id: p.id,
      kind: "schedule_post",
      status: "queued",
    }));
    const { error: jobsErr } = await sbSvc.from("autopilot_jobs").insert(jobs);
    if (jobsErr) return json({ error: `Falha ao reenfileirar: ${jobsErr.message}` }, 500);
  }
  await sbUser.from("autopilot_plans").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", planId);
  triggerWorker();
  return json({ ok: true, rescheduled: list.length });
}

async function actionCancel(sbUser: SB, sbSvc: SB, planId: string): Promise<Response> {
  const { plan, error } = await loadPlanGuarded(sbUser, planId);
  if (error) return error;
  if (plan.status === "completed" || plan.status === "canceled") {
    return json({ error: "Plano já encerrado." }, 409);
  }
  const unscheduled = await unschedulePlan(sbUser, plan);
  const jobsCanceled = await cancelPendingJobs(sbSvc, planId, "plano cancelado");
  await sbUser.from("autopilot_plans").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("id", planId);
  return json({ ok: true, unscheduled, jobs_canceled: jobsCanceled });
}

async function actionDelete(sbUser: SB, sbSvc: SB, planId: string): Promise<Response> {
  const { plan, error } = await loadPlanGuarded(sbUser, planId);
  if (error) return error;
  const deletable = ["draft", "review", "completed", "canceled", "failed"];
  if (!deletable.includes(plan.status)) {
    return json({ error: "Cancele o plano antes de excluir (ele ainda está em execução)." }, 409);
  }
  // Best-effort: garante que nada fica na fila (jobs/posts vão em cascata pelas FKs, mas defensivo).
  await sbSvc.from("autopilot_jobs").delete().eq("plan_id", planId);
  await sbSvc.from("autopilot_posts").delete().eq("plan_id", planId);
  const { error: delErr } = await sbUser.from("autopilot_plans").delete().eq("id", planId);
  if (delErr) return json({ error: `Falha ao excluir: ${delErr.message}` }, 500);
  return json({ ok: true, deleted: true });
}

// ─── Handler ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user, authHeader } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corpo inválido." }, 400);
  }

  const action = String(body.action || "");
  const sbUser = userClient(authHeader);
  const sbSvc = serviceClient();

  try {
    switch (action) {
      case "create":
        return await actionCreate(sbUser, sbSvc, user.id, body.plan as CreatePayload, (body.rows as CreateRow[]) || []);
      case "approve":
        return await actionApprove(sbUser, sbSvc, String(body.plan_id || ""));
      case "regen":
        return await actionRegen(sbUser, sbSvc, String(body.post_id || ""), String(body.kind || ""));
      case "pause":
        return await actionPause(sbUser, sbSvc, String(body.plan_id || ""));
      case "resume":
        return await actionResume(sbUser, sbSvc, String(body.plan_id || ""));
      case "cancel":
        return await actionCancel(sbUser, sbSvc, String(body.plan_id || ""));
      case "delete":
        return await actionDelete(sbUser, sbSvc, String(body.plan_id || ""));
      default:
        return json({ error: `Ação desconhecida: ${action}` }, 400);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[autopilot-plan] Error:", message);
    return json({ error: message }, 502);
  }
});
