/**
 * Marca como RAIZ de toda criação.
 *
 * Forma única do perfil de marca (espelha a tabela brand_profiles) + helpers
 * que transformam a marca em contexto para a IA — tanto para geração de TEXTO
 * (generate-content) quanto de IMAGEM (openai-image). Use sempre que gerar
 * qualquer conteúdo para que logo/nome/handle/paleta/tom/valores sejam a base.
 */

import type { BrandProfileForAI } from "@/lib/api";

export interface BrandProfile {
  id: string;
  name: string;
  description?: string;
  tone: string;
  target_audience?: string;
  industry?: string;
  keywords: string[];
  avoid_words: string[];
  example_posts: string[];
  system_prompt?: string;
  logo_url?: string;
  colors: string[];
  is_default: boolean;
  handle?: string;
  profile_photo_url?: string;
  website?: string;
  social_links?: Record<string, string>;
  values?: string;
}

/** Normaliza uma linha crua de brand_profiles para o tipo BrandProfile. */
export function normalizeBrand(row: Record<string, unknown>): BrandProfile {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    description: (row.description as string) ?? "",
    tone: (row.tone as string) ?? "",
    target_audience: (row.target_audience as string) ?? "",
    industry: (row.industry as string) ?? "",
    keywords: (row.keywords as string[]) ?? [],
    avoid_words: (row.avoid_words as string[]) ?? [],
    example_posts: (row.example_posts as string[]) ?? [],
    system_prompt: (row.system_prompt as string) ?? "",
    logo_url: (row.logo_url as string) ?? "",
    colors: (row.colors as string[]) ?? [],
    is_default: Boolean(row.is_default),
    handle: (row.handle as string) ?? "",
    profile_photo_url: (row.profile_photo_url as string) ?? "",
    website: (row.website as string) ?? "",
    social_links: (row.social_links as Record<string, string>) ?? {},
    values: (row.values as string) ?? "",
  };
}

/** Converte a marca no formato que generate-content (IA de texto) espera. */
export function brandTextProfile(b?: BrandProfile | null): BrandProfileForAI | undefined {
  if (!b?.name) return undefined;
  return {
    name: b.name,
    description: b.description || undefined,
    tone: b.tone || "profissional",
    targetAudience: b.target_audience || undefined,
    industry: b.industry || undefined,
    keywords: b.keywords?.length ? b.keywords : undefined,
    avoidWords: b.avoid_words?.length ? b.avoid_words : undefined,
    examplePosts: b.example_posts?.length ? b.example_posts : undefined,
    systemPrompt: b.system_prompt || undefined,
  };
}

/**
 * Diretiva de estilo visual para prompts de IMAGEM (gpt-image-*).
 * A marca vira a base estética: paleta, tom e valores guiam o visual.
 * Por padrão evita renderizar texto/logo (modelos erram logotipos) — o logo
 * real é sobreposto depois, fora da geração.
 */
export function brandImageDirective(b?: BrandProfile | null): string {
  if (!b?.name) return "";
  const parts: string[] = [];
  if (b.colors?.length) {
    const named = b.colors.map((c) => `${c} (${hexToColorName(c)})`).join(", ");
    parts.push(`paleta exclusiva e dominante: ${named} — use ESTAS cores, nunca substitua por gradientes roxos/azuis genéricos`);
  }
  if (b.tone) parts.push(`estética alinhada ao tom "${b.tone}"`);
  if (b.industry) parts.push(`contexto do setor de ${b.industry}`);
  if (b.values) parts.push(`refletindo os valores: ${b.values}`);
  const style = parts.length ? `Identidade visual OBRIGATÓRIA da marca ${b.name}: ${parts.join("; ")}.` : "";
  const antipattern = `Evite estética genérica de IA: nada de gradientes roxo→rosa padrão, nada de fundos de stock photo banais, nada de bokeh aleatório sem propósito.`;
  return `${style} ${antipattern} Não renderize texto, palavras nem logotipos na imagem, a menos que explicitamente pedido.`.trim();
}

/** Converte hex em um nome de cor aproximado em pt-BR para ajudar o modelo a entender a paleta. */
function hexToColorName(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "cor";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  if (max - min < 18) {
    if (l < 0.1) return "preto";
    if (l < 0.3) return "cinza escuro";
    if (l < 0.65) return "cinza";
    if (l < 0.9) return "cinza claro";
    return "branco";
  }
  let h = 0;
  const d = max - min;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60); if (h < 0) h += 360;
  const tone = l < 0.35 ? "escuro" : l > 0.7 ? "claro" : "";
  let base = "cor";
  if (h < 15 || h >= 345) base = "vermelho";
  else if (h < 40) base = "laranja";
  else if (h < 65) base = "amarelo";
  else if (h < 95) base = "verde-limão";
  else if (h < 160) base = "verde";
  else if (h < 200) base = "ciano";
  else if (h < 240) base = "azul";
  else if (h < 280) base = "violeta";
  else if (h < 320) base = "magenta";
  else base = "rosa";
  return tone ? `${base} ${tone}` : base;
}

/** Linha de assinatura/handle para legendas e carrosséis (a marca como raiz textual). */
export function brandSignature(b?: BrandProfile | null): string {
  if (!b) return "";
  return b.handle || b.name || "";
}

/**
 * Contexto curto da marca para system prompts de IA de TEXTO (aiAssist):
 * nome, handle, tom, público, valores e palavras a evitar.
 */
export function brandTextHint(b?: BrandProfile | null): string {
  if (!b?.name) return "";
  const p: string[] = [`Marca: ${b.name}${b.handle ? ` (${b.handle})` : ""}.`];
  if (b.tone) p.push(`Tom de voz: ${b.tone}.`);
  if (b.target_audience) p.push(`Público-alvo: ${b.target_audience}.`);
  if (b.values) p.push(`Valores: ${b.values}.`);
  if (b.avoid_words?.length) p.push(`Evite as palavras: ${b.avoid_words.join(", ")}.`);
  if (b.system_prompt) p.push(b.system_prompt);
  return p.join(" ");
}
