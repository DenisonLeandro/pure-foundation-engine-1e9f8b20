import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Registro de custo das integrações pagas — fonte da verdade do painel oculto
 * de custos (/painel-custos-interno). Nunca deve quebrar o fluxo principal da
 * função que chama: qualquer erro aqui é apenas logado no console.
 *
 * IMPORTANTE — o que este custo significa nesta versão (Lovable):
 * A IA passa pelo Lovable AI Gateway (ai.gateway.lovable.dev), que cobra em
 * CRÉDITOS do Lovable e NÃO publica quantos créditos cada chamada consome nem
 * se aplica markup. Portanto NÃO dá para calcular automaticamente o valor real
 * debitado pelo Lovable. O que registramos aqui é o **custo-equivalente ao
 * preço de tabela do provedor** (Google/OpenAI): tokens reais × preço oficial.
 * É preciso e comparável ao painel do app direto — mas é o preço "de custo" do
 * provedor, não o que o Lovable te cobra. O markup real só sai comparando este
 * número com o débito de créditos no billing do Lovable (campo de calibração no
 * painel). Todo registro de IA é marcado `provider_equivalent: true`.
 *
 * Preços conferidos nas tabelas oficiais em 20/07/2026 (PRICING_VERSION).
 */

export const PRICING_VERSION = "2026-07-20";

/** Valor do crédito Lovable (USD) — para a calibração de markup no painel. */
export const LOVABLE_CREDIT_USD = { pro: 0.25, business: 0.5 };

/**
 * Preço de tabela OFICIAL do Google por modelo — USD por 1M de tokens.
 * Fonte: ai.google.dev/gemini-api/docs/pricing (20/07/2026).
 */
const GEMINI_TEXT_PRICING: Array<{ match: RegExp; inPerM: number; outPerM: number }> = [
  { match: /gemini-3-flash/i, inPerM: 0.5, outPerM: 3.0 },
  { match: /gemini-2\.5-flash/i, inPerM: 0.3, outPerM: 2.5 },
];
const GEMINI_TEXT_FALLBACK = { inPerM: 0.5, outPerM: 3.0 };

function geminiRates(model: string): { inPerM: number; outPerM: number } {
  return GEMINI_TEXT_PRICING.find((r) => r.match.test(model)) ?? GEMINI_TEXT_FALLBACK;
}

/** Imagem via gateway — USD por imagem (preço de tabela do provedor). */
export const IMAGE_PRICING = {
  // google/gemini-2.5-flash-image ("nano banana"): ~$0.039/imagem 1024x1024.
  geminiImage: 0.039,
  // openai/gpt-image-2 por qualidade (1024x1280 não é tabelado → estimado).
  gptImage: { low: 0.006, medium: 0.048, high: 0.19 },
};

// ─── Custo exato a partir do `usage` do gateway (formato OpenAI) ─────

interface GatewayUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

/**
 * Custo de uma chamada de chat pelo gateway, ao preço de tabela do Google.
 * Se a resposta trouxer o split prompt/completion → custo EXATO. Se só vier
 * total_tokens → blended (marcado estimated).
 */
export function geminiChatCost(usage: GatewayUsage | undefined | null, model: string): {
  costUsd: number;
  tokensIn: number;
  tokensOut: number;
  exact: boolean;
} | null {
  if (!usage) return null;
  const rates = geminiRates(model);
  const hasSplit = typeof usage.prompt_tokens === "number" && typeof usage.completion_tokens === "number";
  if (hasSplit) {
    const tokensIn = usage.prompt_tokens ?? 0;
    const tokensOut = usage.completion_tokens ?? 0;
    const costUsd = (tokensIn * rates.inPerM + tokensOut * rates.outPerM) / 1_000_000;
    return { costUsd: round6(costUsd), tokensIn, tokensOut, exact: true };
  }
  if (typeof usage.total_tokens === "number") {
    // Sem split: assume 35% entrada / 65% saída (chamadas do app geram mais
    // saída que entrada). Aproximação — marcado estimated.
    const total = usage.total_tokens;
    const tokensIn = Math.round(total * 0.35);
    const tokensOut = total - tokensIn;
    const costUsd = (tokensIn * rates.inPerM + tokensOut * rates.outPerM) / 1_000_000;
    return { costUsd: round6(costUsd), tokensIn, tokensOut, exact: false };
  }
  return null;
}

/** Custo de uma imagem via gateway, ao preço de tabela do provedor. */
export function imageCost(model: string, quality: string | undefined): number {
  if (/gemini.*image/i.test(model)) return IMAGE_PRICING.geminiImage;
  const q = (quality || "medium").toLowerCase();
  return IMAGE_PRICING.gptImage[q as keyof typeof IMAGE_PRICING.gptImage] ?? IMAGE_PRICING.gptImage.medium;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

// ─── Tabela de fallback (compat) ────────────────────────────────────
export const PRICE_TABLE: Record<string, Record<string, number>> = {
  openai_image: { default: 0.048, edit: 0.048 },
  gemini: { default: 0.0017, image: 0.039 },
  higgsfield: { "text-to-image": 0.05, "image-to-video": 0.5, "text-to-video": 0.4, default: 0.4 },
  firecrawl: { default: 0.00166 },
  postforme: { default: 0.01 },
  apify: { default: 0.0023 },
  pexels: { default: 0 },
  blotato: { default: 0.02 },
};

export function estimateCost(service: string, operation: string, units: number): number {
  const table = PRICE_TABLE[service];
  if (!table) return 0;
  const unitPrice = table[operation] ?? table.default ?? 0;
  return round6(unitPrice * units);
}

// ─── Registro ───────────────────────────────────────────────────────

export type Exactness = "exact" | "estimated";

interface LogUsageParams {
  companyId?: string | null;
  userId?: string | null;
  service: string;
  operation: string;
  units: number;
  unitType: string;
  costUsd?: number;
  exactness?: Exactness;
  /** true quando o custo é o preço de tabela do provedor, não a cobrança Lovable. */
  providerEquivalent?: boolean;
  tokens?: { in?: number; out?: number };
  metadata?: Record<string, unknown>;
}

export async function logApiUsage(params: LogUsageParams): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;

    const hasRealCost = typeof params.costUsd === "number";
    const cost = hasRealCost
      ? round6(params.costUsd as number)
      : estimateCost(params.service, params.operation, params.units);
    const exactness: Exactness = params.exactness ?? (hasRealCost ? "exact" : "estimated");

    const metadata: Record<string, unknown> = {
      ...(params.metadata ?? {}),
      exactness,
      pricing_version: PRICING_VERSION,
    };
    if (params.providerEquivalent) metadata.provider_equivalent = true;
    if (params.tokens) {
      if (typeof params.tokens.in === "number") metadata.tokens_in = params.tokens.in;
      if (typeof params.tokens.out === "number") metadata.tokens_out = params.tokens.out;
    }

    const admin = createClient(url, key);
    await admin.from("api_usage_logs").insert({
      company_id: params.companyId ?? null,
      user_id: params.userId ?? null,
      service: params.service,
      operation: params.operation,
      units: params.units,
      unit_type: params.unitType,
      cost_usd: cost,
      metadata,
    });
  } catch (e) {
    console.error("[usage-log] failed to record usage:", e instanceof Error ? e.message : e);
  }
}

/**
 * Atalho para chamadas de texto pelo gateway: registra custo (preço de tabela
 * do Google) a partir do `data.usage`. Uma linha por call site.
 */
// deno-lint-ignore no-explicit-any
export async function logGatewayChat(data: any, meta: {
  feature: string;
  model: string;
  companyId?: string | null;
  userId?: string | null;
}): Promise<void> {
  const c = geminiChatCost(data?.usage, meta.model);
  await logApiUsage({
    companyId: meta.companyId ?? null,
    userId: meta.userId ?? null,
    service: "gemini",
    operation: meta.feature,
    units: c ? c.tokensIn + c.tokensOut : 1,
    unitType: "token",
    costUsd: c?.costUsd,
    exactness: c?.exact ? "exact" : "estimated",
    providerEquivalent: true,
    tokens: c ? { in: c.tokensIn, out: c.tokensOut } : undefined,
    metadata: { model: meta.model },
  });
}
