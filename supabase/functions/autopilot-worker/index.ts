import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  serviceClient,
  isServiceCall,
  runWorker,
  json,
  corsHeaders,
  type HandlerMap,
} from "../_shared/autopilot-engine.ts";
import { generationHandlers } from "../_shared/autopilot-generate.ts";

/**
 * Autopilot Worker — processa a fila de jobs em 2º plano.
 *
 * Invocado pelo autopilot-tick (e, futuramente, imediatamente após criar/aprovar
 * um plano). Reserva jobs prontos e os processa dentro de um orçamento de tempo,
 * com retry/backoff. Chamada interna apenas (Bearer == service role key).
 *
 * Os handlers de cada tipo de job são registrados abaixo:
 *   - gen_image, gen_caption      → Fase 3 (geração)
 *   - schedule_post, confirm_post → Fase 4 (agendamento/publicação)
 */
const handlers: HandlerMap = {
  ...generationHandlers, // gen_image, gen_caption (Fase 3)
  // schedule_post, confirm_post → Fase 4
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isServiceCall(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const sb = serviceClient();
    const result = await runWorker(sb, handlers, { batch: 3, budgetMs: 60_000 });
    return json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[autopilot-worker] Error:", message);
    return json({ error: message }, 502);
  }
});
