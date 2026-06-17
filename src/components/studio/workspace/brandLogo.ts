/**
 * Logo do escritório/marca como camada do design.
 *
 * Inserida como um El de imagem normal (não rasteriza o post), com
 * role="brand_logo" e locked=true para evitar movimentação acidental.
 * Pode ser ocultada/reaplicada pelo toggle "Logo" no Studio.
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

function makeLogoEl(logoUrl: string, canvasW: number): El {
  // Margens e tamanho proporcionais ao canvas (base 360 do preview).
  const margin = Math.max(16, Math.round(canvasW * 0.067)); // ~24 @360
  const size = Math.max(56, Math.round(canvasW * 0.22));    // ~80 @360
  return {
    id: uid(),
    type: "image",
    role: BRAND_LOGO_ROLE,
    locked: true,
    src: logoUrl,
    x: margin,
    y: margin,
    w: size,
    h: size,
    objectFit: "contain",
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

/** Remove a camada de logo de todos os slides. Não afeta os demais elementos. */
export function removeBrandLogo(doc: StudioDoc): StudioDoc {
  const slides = doc.slides.map((s) => ({
    ...s,
    els: (s.els || []).filter((e) => e.role !== BRAND_LOGO_ROLE),
  }));
  return { ...doc, slides };
}
