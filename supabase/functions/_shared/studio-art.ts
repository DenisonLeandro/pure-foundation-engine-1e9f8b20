/**
 * Núcleo de arte do Studio "A IA cria tudo" — espelho Deno de `src/lib/studio-art.ts`.
 *
 * Mantém `buildArtPrompt` / `buildEditPrompt` e a geometria da logo IDÊNTICOS ao
 * client, para que o Autopilot (worker) gere arte igual à do Studio.
 * As duas cópias DEVEM ficar em sincronia.
 *
 * Aqui NÃO há composição de canvas (é backend). A composição server-side da logo
 * usa `logoPlacement()` com estes mesmos números, via lib de imagem do Deno.
 */

export const IMG_SIZE = "1024x1280" as const;
export const IMG_QUALITY = "high" as const;

export const LOGO_BOX_RATIO = 0.11;
export const LOGO_MARGIN_RATIO = 0.04;
export const LOGO_BOX_MIN = 48;
export const LOGO_MARGIN_MIN = 14;
export const LOGO_MARGIN_MAX = 48;

export interface ArtBrandLike {
  colors?: string[];
  logo_url?: string | null;
}

/** Monta o prompt do Modo 1 ("IA cria tudo"): descrição + só as cores da marca. */
export function buildArtPrompt(userText: string, brand: ArtBrandLike | null): string {
  const colors = (brand?.colors || []).filter(Boolean);
  const colorLine = colors.length
    ? `Paleta da marca (use como base das cores da arte): ${colors.join(", ")}.`
    : "";
  const logoHint = brand?.logo_url
    ? "Deixe o canto superior esquerdo relativamente livre — a logo da marca será sobreposta ali."
    : "";
  return [
    userText.trim(),
    colorLine,
    logoHint,
    "Crie a arte final e completa de um post para redes sociais em formato vertical, com o texto já embutido na imagem em português brasileiro, tipografia legível e bem posicionada, e acabamento profissional. A imagem deve ser final, pronta para publicar (sem espaços reservados).",
  ].filter(Boolean).join("\n\n");
}

/** Prompt de EDIÇÃO — ancora o tema original + restrições (paleta, canto livre p/ logo). */
export function buildEditPrompt(
  instruction: string,
  brand: ArtBrandLike | null,
  originalTopic: string,
): string {
  const colors = (brand?.colors || []).filter(Boolean);
  const colorLine = colors.length ? `Mantenha a paleta da marca: ${colors.join(", ")}.` : "";
  const logoHint = brand?.logo_url
    ? "Deixe o canto superior esquerdo relativamente livre (sem título, texto nem elementos importantes ali) — a logo da marca fica sobreposta nesse canto."
    : "";
  const topic = originalTopic.trim();
  const topicLine = topic
    ? `IMPORTANTE: esta arte é um post sobre "${topic}". Mantenha EXATAMENTE o mesmo tema, mensagem e textos — não invente outro assunto.`
    : "";
  return [
    topicLine,
    `Alteração pedida: ${instruction.trim()}. Aplique SOMENTE essa mudança e preserve todo o resto da arte.`,
    colorLine,
    logoHint,
    "Mantenha a imagem como um post final e completo para redes sociais, com o texto embutido em português brasileiro e acabamento profissional.",
  ].filter(Boolean).join("\n\n");
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Posição/tamanho da logo carimbada para uma arte de largura `w` (idêntico ao client). */
export function logoPlacement(w: number, logoW: number, logoH: number) {
  const box = Math.max(LOGO_BOX_MIN, Math.round(w * LOGO_BOX_RATIO));
  const margin = clamp(Math.round(w * LOGO_MARGIN_RATIO), LOGO_MARGIN_MIN, LOGO_MARGIN_MAX);
  const scale = Math.min(box / logoW, box / logoH);
  const lw = logoW * scale;
  const lh = logoH * scale;
  return { x: margin + (box - lw) / 2, y: margin + (box - lh) / 2, w: lw, h: lh };
}
