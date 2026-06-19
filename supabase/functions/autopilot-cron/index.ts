import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Autopilot Cron — Disparado periodicamente (pg_cron ou externo)
 *
 * 1. Verifica configs ativas com next_run_at <= agora → dispara "generate"
 * 2. Verifica calendários aprovados com posts pendentes → dispara "schedule"
 * 3. Verifica posts com visuais pendentes → dispara "check_visuals"
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

async function callAutopilotRun(payload: Record<string, unknown>) {
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const res = await fetch(`${SUPABASE_URL}/functions/v1/autopilot-run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      // Use shared cron secret so autopilot-run can authenticate the call
      // without falling back to anonymous service-role access.
      "x-cron-secret": cronSecret,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, status: res.status };
}


Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Cron-only endpoint: require shared secret. The scheduled pg_cron job must
  // send header "x-cron-secret: <CRON_SECRET>" matching the env var.
  const expectedSecret = Deno.env.get("CRON_SECRET");
  const providedSecret =
    req.headers.get("x-cron-secret") || req.headers.get("X-Cron-Secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {

    const sb = supabaseAdmin();
    const now = new Date().toISOString();
    const results = { generated: 0, curated: 0, scheduled: 0, visuals_checked: 0, confirmed: 0 };

    // 1. Configs que precisam gerar novo ciclo
    const { data: dueConfigs } = await sb
      .from("autopilot_configs")
      .select("id")
      .eq("is_active", true)
      .lte("next_run_at", now);

    if (dueConfigs?.length) {
      console.log(`[autopilot-cron] ${dueConfigs.length} configs due for generation`);
      for (const config of dueConfigs) {
        const res = await callAutopilotRun({ action: "generate", config_id: config.id });
        if (res.ok) results.generated++;
        else console.error(`[autopilot-cron] Generate failed for ${config.id}: ${res.status}`);
      }
    }

    // 2. Calendários draft → curadoria automática por IA (curate)
    const { data: draftCalendars } = await sb
      .from("autopilot_calendars")
      .select("id")
      .eq("status", "draft");

    if (draftCalendars?.length) {
      console.log(`[autopilot-cron] ${draftCalendars.length} calendars to curate`);
      for (const cal of draftCalendars) {
        const res = await callAutopilotRun({ action: "curate", calendar_id: cal.id });
        if (res.ok) results.curated++;
      }
    }

    // 3. Calendários aprovados com posts pending schedule
    const { data: approvedCalendars } = await sb
      .from("autopilot_calendars")
      .select("id")
      .eq("status", "approved");

    if (approvedCalendars?.length) {
      console.log(`[autopilot-cron] ${approvedCalendars.length} calendars to schedule`);
      for (const cal of approvedCalendars) {
        const res = await callAutopilotRun({ action: "schedule", calendar_id: cal.id });
        if (res.ok) results.scheduled++;
      }
    }

    // 3. Calendários com visuais pendentes
    const { data: visualCalendars } = await sb
      .from("autopilot_calendars")
      .select("id")
      .eq("status", "scheduling");

    if (visualCalendars?.length) {
      console.log(`[autopilot-cron] ${visualCalendars.length} calendars with pending visuals`);
      for (const cal of visualCalendars) {
        const res = await callAutopilotRun({ action: "check_visuals", calendar_id: cal.id });
        if (res.ok) results.visuals_checked++;
      }
    }

    // 5. Calendários "active" → confirma publicação real no PFM
    const { data: activeCalendars } = await sb
      .from("autopilot_calendars")
      .select("id")
      .eq("status", "active");

    if (activeCalendars?.length) {
      console.log(`[autopilot-cron] ${activeCalendars.length} calendars to confirm publication`);
      for (const cal of activeCalendars) {
        const res = await callAutopilotRun({ action: "confirm", calendar_id: cal.id });
        if (res.ok) results.confirmed++;
      }
    }

    // 6. Publica artigos automaticamente quando seus posts associados são publicados
    const { data: draftArticles } = await sb
      .from("articles")
      .select("id, linked_creation_id")
      .eq("status", "draft")
      .not("linked_creation_id", "is", null);

    if (draftArticles?.length) {
      console.log(`[autopilot-cron] ${draftArticles.length} draft articles with linked posts`);

      for (const article of draftArticles) {
        if (!article.linked_creation_id) continue;

        // Verifica se o post associado foi publicado nos últimos 5 minutos
        const { data: creation } = await sb
          .from("creations")
          .select("id, created_at")
          .eq("id", article.linked_creation_id)
          .single();

        if (!creation) continue;

        // Se o post foi criado/atualizado recentemente, publica o artigo
        const createdAt = new Date(creation.created_at);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        if (createdAt > fiveMinutesAgo) {
          const { error: updateError } = await sb
            .from("articles")
            .update({
              status: "published",
              published_at: now,
              updated_at: now,
            })
            .eq("id", article.id);

          if (!updateError) {
            results.articles_published = (results.articles_published ?? 0) + 1;
            console.log(`[autopilot-cron] Published article ${article.id} linked to post ${article.linked_creation_id}`);
          } else {
            console.error(`[autopilot-cron] Failed to publish article ${article.id}:`, updateError);
          }
        }
      }
    }

    console.log("[autopilot-cron] Done:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[autopilot-cron] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
