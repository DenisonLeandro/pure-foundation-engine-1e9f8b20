import type { Platform } from "@/types";

export type StudioFormat = "post" | "carousel" | "image" | "video" | "card";

export type ElType = "text" | "image" | "shape";

export interface El {
  id: string;
  type: ElType;
  x: number; y: number; w: number; h: number;
  // text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  weight?: number;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
  shadow?: string;
  shadowPreset?: "auto" | "discrete" | "medium" | "strong" | "custom";
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  zIndex?: number;
  // image
  src?: string;
  radius?: number;
  objectFit?: "cover" | "contain";
  // shape
  bg?: string;
  // metadata opcional — usado p/ camadas semânticas (ex.: "brand_logo")
  // e para travar movimentação acidental.
  role?: string;
  locked?: boolean;
  assetSourceUrl?: string;
}

export interface Slide {
  bg: string;          // cor sólida ou gradiente CSS
  bgImage?: string;    // url/data url de fundo
  bgFit?: "cover" | "contain";
  els: El[];
}

export interface StudioDoc {
  format: StudioFormat;
  brandId: string | null;
  slides: Slide[];          // 1 p/ image/post; N p/ carrossel
  videoUrl?: string;        // formato vídeo (resultado Higgsfield)
  caption: string;
  captionsByPlatform?: Record<string, string>;
  hashtags: string[];
  platforms: Platform[];
  schedule: { when: "now" | "schedule"; at?: string };
  canvas?: { width: number; height: number; aspectRatio?: number; source?: "finalImage" | "designDoc" | "fallback" };
  /** Canvas em que os elementos foram originalmente posicionados/dimensionados. Usado para reescalar ao reabrir. */
  authoredCanvas?: { width: number; height: number };
  /** true = a logo da marca já está pintada dentro das imagens/bgImage; Studio não deve sobrepor camada de logo. */
  logoBaked?: boolean;
}

// Canvas 4:5 (1080×1350) — padrão Instagram 2026.
// Preview em 360×450 (escala 3x no export = 1080×1350).
export const CANVAS_W = 360;
export const CANVAS_H = 450;
export const CANVAS_PX = CANVAS_W; // compat (largura)
export const EXPORT_SCALE = 3;
export const EXPORT_W = 1080;
export const EXPORT_H = 1350;

export function getCanvasSize(doc?: Pick<StudioDoc, "canvas"> | null): { width: number; height: number } {
  const width = Math.round(Number(doc?.canvas?.width) || CANVAS_W);
  const height = Math.round(Number(doc?.canvas?.height) || CANVAS_H);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 180 || height < 180) {
    return { width: CANVAS_W, height: CANVAS_H };
  }
  return { width, height };
}

export function getExportSize(doc?: Pick<StudioDoc, "canvas"> | null): { width: number; height: number; scale: number } {
  const size = getCanvasSize(doc);
  return { width: size.width * EXPORT_SCALE, height: size.height * EXPORT_SCALE, scale: EXPORT_SCALE };
}

// 4:5 nativo do gpt-image-2 (Instagram feed). 1024×1280 = 4:5 exato e válido
// (ambos múltiplos de 16). 1080×1350 seria o ideal, mas 1080 não é múltiplo
// de 16, então o modelo rejeita; o export reescala 1024×1280 → 1080×1350.
export const IMAGE_SIZE = "1024x1280" as const;

export const uid = () => Math.random().toString(36).slice(2, 9);
