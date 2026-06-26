import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Log best-effort de custo das integrações pagas. Nunca deve quebrar o
 * fluxo principal da função que chama: qualquer erro aqui é apenas logado
 * no console, nunca propagado.
 *
 * Preços abaixo são estimativas fixas (USD) — ajuste conforme tabela real
 * do provedor. Servem para visibilidade aproximada, não para faturamento.
 */
export const PRICE_TABLE: Record<string, Record<string, number>> = {
  openai_image: {
    // custo aproximado por imagem gerada (gpt-image, quality medium)
    default: 0.04,
  },
  higgsfield: {
    // custo aproximado por geração, varia por modelo/duração
    "text-to-image": 0.02,
    "image-to-video": 0.35,
    "text-to-video": 0.5,
    default: 0.2,
  },
  firecrawl: {
    default: 0.005, // por busca
  },
  postforme: {
    default: 0.02, // por post publicado
  },
  blotato: {
    default: 0.02, // por post publicado
  },
  gemini: {
    // por 1k tokens (input+output combinados, aproximação)
    default: 0.0005,
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
