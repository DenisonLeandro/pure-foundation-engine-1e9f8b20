import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  serviceClient,
  isServiceCall,
  json,
  corsHeaders,
} from "../_shared/autopilot-engine.ts";

/**
 * Autopilot Tick — batida periódica do motor (substitui autopilot-cron).
 *
 * Agendado por pg_cron (1/min). Sem regra de negócio pesada: apenas detecta
 * transições e dispara o worker. Chamada interna apenas (Bearer == service key).
 *
 * Responsabilidades:
 *   1. Reenfileirar jobs "presos" (worker interrompido).
 *   2. [Fase 4] Enfileirar confirm_post de posts agendados cuja hora passou.
 *   3. [Fase 4] Marcar planos concluídos + aviso "7 dias antes do fim".
 *   4. Invocar o worker para drenar a fila.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isServiceCall(req)) return json({ error: "Unauthorized" }, 401);

  const out: Record<string, unknown> = {};
  try {
    const sb = serviceClient();

    // 1. Reaper de jobs presos (running há muito tempo).
    const { data: requeued, error: reapErr } = await sb.rpc(
      "autopilot_requeue_stuck_jobs",
      { _stuck_seconds: 300 },
    );
    if (reapErr) console.error("[autopilot-tick] reaper error:", reapErr.message);
    out.stuck_requeued = requeued ?? 0;

    // 2–3. [Fase 4] confirmação / conclusão / aviso de fim de ciclo. TODO.

    // 4. Invoca o worker para processar a fila (chamada interna com a service key).
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/autopilot-worker`;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: "{}",
      });
      out.worker = { ok: r.ok, status: r.status, result: await r.json().catch(() => null) };
    } catch (e) {
      out.worker = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }

    return json({ ok: true, ...out });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[autopilot-tick] Error:", message);
    return json({ error: message }, 502);
  }
});
