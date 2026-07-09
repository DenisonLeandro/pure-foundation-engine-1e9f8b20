/**
 * Núcleo de arte do Studio "A IA cria tudo" — FONTE ÚNICA compartilhada.
 *
 * `buildArtPrompt` / `buildEditPrompt` e a geometria da composição de logo
 * vivem aqui para que o Studio (client) e o Autopilot (worker/backend) gerem
 * arte IDÊNTICA — mesmo prompt, mesma geometria de logo.
 *
 * Espelho para edge functions (Deno): `supabase/functions/_shared/studio-art.ts`.
 * As duas cópias das funções puras + constantes DEVEM ficar em sincronia.
 */

// gpt-image-2 aceita dims custom múltiplas de 16; 1024×1280 é 4:5 exato (feed IG).
export const IMG_SIZE = "1024x1280" as const;
export const IMG_QUALITY = "high" as const;

// Geometria da logo carimbada (fração da largura da arte). Client e server usam
// os MESMOS números para o resultado bater pixel a pixel.
export const LOGO_BOX_RATIO = 0.11; // caixa da logo ~11% da largura
export const LOGO_MARGIN_RATIO = 0.04; // margem ~4% da largura
export const LOGO_BOX_MIN = 48;
export const LOGO_MARGIN_MIN = 14;
export const LOGO_MARGIN_MAX = 48;

/** Subconjunto da marca de que a arte precisa (compatível com BrandProfile e BrandRow). */
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

/**
 * Prompt de EDIÇÃO. Ancora o tema original (senão a IA troca o assunto ao
 * repintar) e carrega as restrições (paleta + canto sup. esq. livre p/ logo).
 */
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

/** Calcula posição/tamanho da logo para uma arte de largura `w`. Compartilhado client/server. */
export function logoPlacement(w: number, logoW: number, logoH: number) {
  const box = Math.max(LOGO_BOX_MIN, Math.round(w * LOGO_BOX_RATIO));
  const margin = clamp(Math.round(w * LOGO_MARGIN_RATIO), LOGO_MARGIN_MIN, LOGO_MARGIN_MAX);
  const scale = Math.min(box / logoW, box / logoH);
  const lw = logoW * scale;
  const lh = logoH * scale;
  return { x: margin + (box - lw) / 2, y: margin + (box - lh) / 2, w: lw, h: lh };
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * (Navegador) Sobrepõe a logo real da marca sobre a arte, em resolução nativa,
 * via canvas 2D direto. A arte é desenhada 1:1 (sem reescala) e só a logo é
 * carimbada no canto sup. esq. O espelho server-side (worker Deno) usa
 * `logoPlacement` com os mesmos números.
 */
export async function composeImageWithLogo(artUrl: string, logoUrl?: string | null): Promise<string> {
  const art = await loadImg(artUrl);
  const w = art.naturalWidth || 1024;
  const h = art.naturalHeight || 1280;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return artUrl;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(art, 0, 0, w, h);
  if (logoUrl) {
    try {
      const logo = await loadImg(logoUrl);
      const p = logoPlacement(w, logo.naturalWidth || 1, logo.naturalHeight || 1);
      ctx.drawImage(logo, p.x, p.y, p.w, p.h);
    } catch {
      /* logo é opcional — segue só com a arte */
    }
  }
  return canvas.toDataURL("image/png");
}
