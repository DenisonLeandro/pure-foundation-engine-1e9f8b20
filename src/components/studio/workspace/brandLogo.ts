/**
 * Logo do escritório/marca como camada do design.
 *
 * Inserida como um El de imagem normal (não rasteriza o post), com
 * role="brand_logo" e locked=true para evitar movimentação acidental.
 * A arte é sempre posicionada como selo discreto no topo esquerdo, sem
 * acrescentar pill/caixa/fundo pelo app.
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
  // Referência aprovada: selo pequeno no topo esquerdo (~11% da largura),
  // com limite máximo para não crescer em canvases maiores.
  return {
    margin: clamp(Math.round(canvasW * 0.04), 14, 24),
    size: clamp(Math.round(canvasW * 0.11), 36, 48),
  };
}

function makeLogoEl(renderedLogoUrl: string, canvasW: number, sourceLogoUrl = renderedLogoUrl): El {
  const { margin, size } = logoLayout(canvasW);
  return {
    id: uid(),
    type: "image",
    role: BRAND_LOGO_ROLE,
    locked: true,
    src: renderedLogoUrl,
    assetSourceUrl: sourceLogoUrl,
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
export function applyBrandLogo(doc: StudioDoc, logoUrl: string, renderedLogoUrl = logoUrl): StudioDoc {
  if (!logoUrl) return doc;
  const { width } = getCanvasSize(doc);
  const slides = doc.slides.map((s) => {
    const els = (s.els || []).filter((e) => e.role !== BRAND_LOGO_ROLE);
    els.push(makeLogoEl(renderedLogoUrl, width, logoUrl));
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
      && logo.x === margin
      && logo.y === margin
      && logo.w === size
      && logo.h === size
      && logo.objectFit === "contain"
      && (logo.radius ?? 0) === 0
      && (logo.opacity ?? 1) === 1;
  });
}

const preparedLogoCache = new Map<string, Promise<string>>();

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function isDarkBackgroundPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 24) return false;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 58 && saturation(r, g, b) < 0.55;
}

async function stripDarkLogoBackground(logoUrl: string): Promise<string> {
  if (typeof document === "undefined") return logoUrl;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = logoUrl;
  });

  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  if (!naturalW || !naturalH) return logoUrl;

  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(naturalW, naturalH));
  const w = Math.max(1, Math.round(naturalW * scale));
  const h = Math.max(1, Math.round(naturalH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return logoUrl;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  let edge = 0;
  let darkEdge = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x > 3 && y > 3 && x < w - 4 && y < h - 4) continue;
      const i = (y * w + x) * 4;
      edge++;
      if (isDarkBackgroundPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) darkEdge++;
    }
  }

  // Só remove fundo quando o arquivo realmente parece ter borda/fundo escuro.
  // Logos já transparentes ou sem fundo ficam intactas.
  if (!edge || darkEdge / edge < 0.28) return logoUrl;

  for (let i = 0; i < data.length; i += 4) {
    if (isDarkBackgroundPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function prepareBrandLogoUrl(logoUrl: string): Promise<string> {
  if (!logoUrl) return logoUrl;
  if (!preparedLogoCache.has(logoUrl)) {
    preparedLogoCache.set(logoUrl, stripDarkLogoBackground(logoUrl).catch(() => logoUrl));
  }
  return preparedLogoCache.get(logoUrl)!;
}

/** Aplica a logo já limpando fundo preto embutido quando detectável. */
export async function applyPreparedBrandLogo(doc: StudioDoc, logoUrl: string): Promise<StudioDoc> {
  if (!logoUrl) return doc;
  const prepared = await prepareBrandLogoUrl(logoUrl);
  return applyBrandLogo(doc, logoUrl, prepared);
}

/** Remove a camada de logo de todos os slides. Não afeta os demais elementos. */
export function removeBrandLogo(doc: StudioDoc): StudioDoc {
  const slides = doc.slides.map((s) => ({
    ...s,
    els: (s.els || []).filter((e) => e.role !== BRAND_LOGO_ROLE),
  }));
  return { ...doc, slides };
}
