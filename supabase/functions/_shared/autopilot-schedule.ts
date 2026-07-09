/**
 * Autopilot v2 — agendamento e publicação.
 *
 * - schedule_post (handler da fila): calcula o melhor horário (camada de padrões,
 *   timezone-aware) e agenda o post no Post for Me (idempotente por pfm_post_id).
 * - confirmDuePosts (chamado pelo tick): confirma publicação real (scheduled →
 *   published) consultando o PFM.
 * - finalizePlans (chamado pelo tick): marca planos concluídos.
 *
 * Reusa a postforme-proxy (mesma função do app) via chamada interna de serviço.
 */

import type { Job, SB, HandlerMap } from "./autopilot-engine.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

function internalHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${SERVICE_KEY}` };
}

// ─── Melhor horário — camada de PADRÕES (fallback sempre disponível) ─
// A camada baseada em histórico do Apify (N=5) é um ponto de extensão futuro;
// esta camada padrão garante "sempre tem resposta" (contas novas, sem histórico).
const DEFAULT_HOURS: Record<string, number[]> = {
  instagram: [12, 19],
  facebook: [13, 20],
  linkedin: [8, 12],
  tiktok: [12, 21],
  twitter: [9, 18],
  youtube: [17, 20],
  pinterest: [11, 20],
  threads: [12, 19],
  bluesky: [9, 18],
};

/** Offset (minutos, zona − UTC) da timezone IANA no instante `at`. */
function tzOffsetMinutes(tz: string, at: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const m: Record<string, string> = {};
    for (const p of dtf.formatToParts(at)) if (p.type !== "literal") m[p.type] = p.value;
    const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch {
    return -180; // fallback America/Sao_Paulo (UTC-3)
  }
}

/** Converte (data local + hora) na timezone IANA para o instante UTC. */
function zonedToUtc(dateStr: string, hour: number, minute: number, tz: string): Date {
  const naive = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);
  const off = tzOffsetMinutes(tz, naive);
  return new Date(naive.getTime() - off * 60000);
}

/** Calcula scheduled_at (UTC ISO) para um post: dia do plano + melhor hora na tz. */
// deno-lint-ignore no-explicit-any
async function computeScheduledAt(sb: SB, post: any, plan: any): Promise<string> {
  if (post.time_locked && post.scheduled_at) return post.scheduled_at; // respeita override
  const tz = plan.timezone || "America/Sao_Paulo";
  const platform = (Array.isArray(plan.platforms) && plan.platforms[0]) || "instagram";
  const hours = DEFAULT_HOURS[platform] || [12, 18];

  // Evita colisão quando há mais de um post no mesmo dia do plano: usa o rank
  // do post entre os do mesmo dia para escolher horários diferentes.
  const { data: sameDay } = await sb
    .from("autopilot_posts")
    .select("id")
    .eq("plan_id", plan.id)
    .eq("post_date", post.post_date)
    .order("created_at", { ascending: true });
  const rank = Math.max(0, (sameDay ?? []).findIndex((r: { id: string }) => r.id === post.id));
  const hour = hours[rank % hours.length] + Math.floor(rank / hours.length); // desloca 1h se estourar

  return zonedToUtc(post.post_date, Math.min(23, hour), 0, tz).toISOString();
}

// ─── Chamada interna ao Post for Me ─────────────────────────────────
async function pfmCall(
  companyId: string,
  userId: string | undefined,
  tool: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/postforme-proxy`, {
    method: "POST",
    headers: internalHeaders(),
    body: JSON.stringify({ tool, args, companyId, userId }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`postforme ${tool} ${r.status}: ${JSON.stringify(data).slice(0, 200)}`);
  return data as Record<string, unknown>;
}

function buildCaption(post: { caption?: string | null; hashtags?: unknown }): string {
  const tags = Array.isArray(post.hashtags) && post.hashtags.length
    ? "\n\n" + post.hashtags.map((h) => `#${String(h).replace(/^#/, "")}`).join(" ")
    : "";
  return `${post.caption || ""}${tags}`.trim();
}

// ─── Handler: schedule_post ─────────────────────────────────────────
async function schedulePost(sb: SB, job: Job): Promise<void> {
  if (!job.post_id) throw new Error("schedule_post sem post_id");
  const { data: post, error } = await sb.from("autopilot_posts").select("*").eq("id", job.post_id).single();
  if (error || !post) throw new Error(`post não encontrado: ${error?.message ?? job.post_id}`);
  if (post.status === "removed") return; // ignorado na revisão

  // Idempotência: se já foi agendado no PFM, não duplica.
  if (post.pfm_post_id) {
    if (post.status !== "scheduled" && post.status !== "published") {
      await sb.from("autopilot_posts").update({ status: "scheduled", updated_at: new Date().toISOString() }).eq("id", post.id);
    }
    return;
  }

  const { data: plan, error: planErr } = await sb.from("autopilot_plans").select("*").eq("id", post.plan_id).single();
  if (planErr || !plan) throw new Error(`plano não encontrado: ${planErr?.message ?? post.plan_id}`);

  const scheduledAt = await computeScheduledAt(sb, post, plan);
  const media = post.image_url ? [post.image_url] : [];

  const res = await pfmCall(post.company_id, plan.created_by, "pfm_create_post", {
    caption: buildCaption(post),
    social_accounts: plan.social_account_ids || [],
    media,
    scheduled_at: scheduledAt,
    external_id: post.id,
  });

  // deno-lint-ignore no-explicit-any
  const pfmId = (res as any)?.data?.id || (res as any)?.id || null;
  if (!pfmId) throw new Error("Post for Me não retornou id do post agendado");

  await sb.from("autopilot_posts").update({
    status: "scheduled",
    scheduled_at: scheduledAt,
    pfm_post_id: pfmId,
    error: null,
    updated_at: new Date().toISOString(),
  }).eq("id", post.id);
}

export const scheduleHandlers: HandlerMap = {
  schedule_post: schedulePost,
};

// ─── Tick: confirmação de publicação (scheduled → published) ────────
export async function confirmDuePosts(sb: SB): Promise<number> {
  const nowIso = new Date().toISOString();
  const { data: posts } = await sb
    .from("autopilot_posts")
    .select("id, company_id, plan_id, pfm_post_id")
    .eq("status", "scheduled")
    .not("pfm_post_id", "is", null)
    .lte("scheduled_at", nowIso)
    .limit(40);
  if (!posts?.length) return 0;

  let confirmed = 0;
  for (const post of posts) {
    try {
      const res = await pfmCall(post.company_id, undefined, "pfm_get_post", { id: post.pfm_post_id });
      // deno-lint-ignore no-explicit-any
      const p: any = (res as any)?.data ?? res;
      const status = p?.status;
      if (status === "processed") {
        const url = p?.platform_url || p?.results?.[0]?.platform_url || null;
        const engagement = p?.results?.[0]?.engagement ?? null;
        await sb.from("autopilot_posts").update({
          status: "published",
          published_url: url,
          engagement,
          updated_at: new Date().toISOString(),
        }).eq("id", post.id);
        confirmed++;
      } else if (status === "error" || status === "failed") {
        await sb.from("autopilot_posts").update({
          status: "failed",
          error: "Publicação falhou no Post for Me",
          updated_at: new Date().toISOString(),
        }).eq("id", post.id);
      }
      // Outros estados (scheduled/processing) → nada; o próximo tick reconfere.
    } catch (e) {
      console.error("[autopilot] confirm post", post.id, e instanceof Error ? e.message : e);
    }
  }
  return confirmed;
}

// ─── Tick: conclusão de planos ──────────────────────────────────────
export async function finalizePlans(sb: SB): Promise<number> {
  const { data: plans } = await sb
    .from("autopilot_plans")
    .select("id, period_end")
    .eq("status", "active")
    .limit(100);
  if (!plans?.length) return 0;

  const today = new Date().toISOString().slice(0, 10);
  let done = 0;
  for (const plan of plans) {
    const { count } = await sb
      .from("autopilot_posts")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", plan.id)
      .not("status", "in", "(published,failed,removed)");
    const allTerminal = (count ?? 0) === 0;
    const pastEnd = !!plan.period_end && plan.period_end < today;
    if (allTerminal || pastEnd) {
      await sb.from("autopilot_plans")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", plan.id)
        .eq("status", "active");
      done++;
    }
  }
  return done;
}
