/**
 * Logo do escritório/marca como camada do design.
 *
 * Inserida como um El de imagem normal (não rasteriza o post), com
 * role="brand_logo" e locked=true para evitar movimentação acidental.
 * A arte é sempre posicionada como selo discreto no topo esquerdo, sem
 * acrescentar pill/caixa/fundo pelo app e SEM reprocessar o PNG original
 * (para não degradar nitidez/transparência).
 */

import type { El, Slide, StudioDoc } from "./types";
import { uid, getCanvasSize } from "./types";

export const BRAND_LOGO_ROLE = "brand_logo";

function slideHasLogo(s: Slide): boolean {
  return (s.els || []).some((e) => e.role === BRAND_LOGO_ROLE);
}

export function docHasBrandLogo(doc: StudioDoc): boolean {
  return doc.slides.some(slideHasLogo);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function logoLayout(canvasW: number): { margin: number; size: number } {
  // Selo pequeno no topo esquerdo, ~11% da largura do canvas.
  // Sem teto: em canvases maiores (~1080px) a logo é desenhada em resolução
  // nativa e o export não precisa fazer upscale (evita aspecto pixelado).
  const margin = clamp(Math.round(canvasW * 0.04), 14, 48);
  const size = Math.max(48, Math.round(canvasW * 0.11));
  return { margin, size };
}

function makeLogoEl(logoUrl: string, canvasW: number): El {
  const { margin, size } = logoLayout(canvasW);
  return {
    id: uid(),
    type: "image",
    role: BRAND_LOGO_ROLE,
    locked: true,
    src: logoUrl,
    assetSourceUrl: logoUrl,
    x: margin,
    y: margin,
    w: size,
    h: size,
    objectFit: "contain",
    radius: 0,
    opacity: 1,
    zIndex: 50,
  };
}

/** Aplica/atualiza a camada de logo em TODOS os slides. */
export function applyBrandLogo(doc: StudioDoc, logoUrl: string): StudioDoc {
  if (!logoUrl) return doc;
  const { width } = getCanvasSize(doc);
  const slides = doc.slides.map((s) => {
    const els = (s.els || []).filter((e) => e.role !== BRAND_LOGO_ROLE);
    els.push(makeLogoEl(logoUrl, width));
    return { ...s, els };
  });
  return { ...doc, slides };
}

export function docHasCurrentBrandLogo(doc: StudioDoc, logoUrl: string): boolean {
  if (!logoUrl) return false;
  const { width } = getCanvasSize(doc);
  const { margin, size } = logoLayout(width);
  return doc.slides.every((s) => {
    const logos = (s.els || []).filter((e) => e.role === BRAND_LOGO_ROLE);
    if (logos.length !== 1) return false;
    const logo = logos[0];
    const source = logo.assetSourceUrl || logo.src;
    return source === logoUrl
      && logo.src === logoUrl // garante que não é um data URL degradado do cache antigo
      && logo.x === margin
      && logo.y === margin
      && logo.w === size
      && logo.h === size
      && logo.objectFit === "contain"
      && (logo.radius ?? 0) === 0
      && (logo.opacity ?? 1) === 1;
  });
}

/**
 * Aplica a logo usando a URL original do storage, sem reprocessamento.
 * Mantido como async por compatibilidade com os call sites existentes.
 */
export async function applyPreparedBrandLogo(doc: StudioDoc, logoUrl: string): Promise<StudioDoc> {
  if (!logoUrl) return doc;
  return applyBrandLogo(doc, logoUrl);
}

/** No-op mantido para compatibilidade — não reprocessa mais a logo. */
export async function prepareBrandLogoUrl(logoUrl: string): Promise<string> {
  return logoUrl;
}

/** Remove a camada de logo de todos os slides. Não afeta os demais elementos. */
export function removeBrandLogo(doc: StudioDoc): StudioDoc {
  const slides = doc.slides.map((s) => ({
    ...s,
    els: (s.els || []).filter((e) => e.role !== BRAND_LOGO_ROLE),
  }));
  return { ...doc, slides };
}
