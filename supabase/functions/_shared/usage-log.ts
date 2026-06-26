import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Log best-effort de custo das integrações pagas. Nunca deve quebrar o
 * fluxo principal da função que chama: qualquer erro aqui é apenas logado
 * no console, nunca propagado.
 *
 * Preços abaixo são estimativas (USD) com base em pesquisa de tabelas
 * públicas dos provedores (jun/2026). Ainda são aproximações — provedores
 * mudam preço sem aviso e alguns cobram por assinatura/crédito, não por
 * chamada. Servem para visibilidade de custo, não para faturamento exato.
 */
export const PRICE_TABLE: Record<string, Record<string, number>> = {
  openai_image: {
    // gpt-image-1.5, 1024x1024, quality medium (a função rebaixa "high" p/
    // "medium" no servidor por limite de tempo da edge function)
    default: 0.034,
  },
  higgsfield: {
    // Estimativas via preços públicos de revendedores (Segmind), variam
    // bastante por modelo/duração — tratar como aproximação grosseira.
    "text-to-image": 0.15,
    "image-to-video": 0.35,
    "text-to-video": 0.86, // ex: speech-to-video / modelos premium
    default: 0.3,
  },
  firecrawl: {
    // Search: 2 créditos por 10 resultados; plano Standard ~$0.00083/crédito
    default: 0.002,
  },
  postforme: {
    // Plano de entrada: $10/mês por 1.000 posts publicados com sucesso
    default: 0.01,
  },
  blotato: {
    // Sem cobrança por post na API (incluída na assinatura, a partir de
    // $29/mês); valor abaixo é só uma fração estimada de uso típico.
    default: 0.02,
  },
  gemini: {
    // Texto (generate-content), modelo gemini-3-flash-preview:
    // $0.50/1M tokens de entrada, $3.00/1M de saída. Como só temos o total
    // combinado, usamos uma média ponderada (~mais saída que entrada).
    default: 0.0017,
    // Imagem (fallback Lovable AI Gateway), gemini-2.5-flash-image
    // ("nano banana"): ~$0.039 por imagem 1024x1024.
    image: 0.039,
  },
};

export function estimateCost(service: string, operation: string, units: number): number {
  const table = PRICE_TABLE[service];
  if (!table) return 0;
  const unitPrice = table[operation] ?? table.default ?? 0;
  return Math.round(unitPrice * units * 1_000_000) / 1_000_000;
}

interface LogUsageParams {
  companyId?: string | null;
  userId?: string | null;
  service: string;
  operation: string;
  units: number;
  unitType: string;
  costUsd?: number;
  metadata?: Record<string, unknown>;
}

export async function logApiUsage(params: LogUsageParams): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;

    const cost = params.costUsd ?? estimateCost(params.service, params.operation, params.units);
    const admin = createClient(url, key);
    await admin.from("api_usage_logs").insert({
      company_id: params.companyId ?? null,
      user_id: params.userId ?? null,
      service: params.service,
      operation: params.operation,
      units: params.units,
      unit_type: params.unitType,
      cost_usd: cost,
      metadata: params.metadata ?? {},
    });
  } catch (e) {
    console.error("[usage-log] failed to record usage:", e instanceof Error ? e.message : e);
  }
}
