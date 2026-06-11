/**
 * Refinamento estético do StudioDoc.
 *
 * Roda DEPOIS de `ensureReadableTextLayers` e SUBSTITUI retângulos duros
 * (criados como overlays de legibilidade com id `rb-bg-*`) por composições
 * mais elegantes baseadas em um preset visual:
 *  - bordas arredondadas
 *  - faixas em gradiente (em vez de bloco escuro chapado)
 *  - cards translúcidos
 *  - barra lateral fina com cor de acento da marca
 *  - margens/respiro consistentes
 *
 * É idempotente: remove acentos antigos (prefixo `rb-aes-`) antes de
 * re-aplicar, e re-estiliza overlays `rb-bg-*` em cada passada. Não rasteriza
 * nada, não toca em textos, mantém todos os elementos editáveis.
 */

import type { El, Slide, StudioDoc } from "./types";
import { uid, CANVAS_W, CANVAS_H } from "./types";
import { parseHex, getRelativeLuminance } from "./designReadability";

const READABILITY_PREFIX = "rb-bg-";
const AESTHETIC_PREFIX = "rb-aes-";

export type StylePreset =
  | "auto"
  | "editorial"
  | "minimal"
  | "institutional"
  | "modern"
  | "translucent"
  | "sidebar"
  | "fullscreen";

export const STYLE_PRESETS: { value: StylePreset; label: string; hint: string }[] = [
  { value: "auto", label: "Automático", hint: "A IA escolhe a melhor composição" },
  { value: "editorial", label: "Editorial Premium", hint: "Gradiente sutil + faixa de acento" },
  { value: "minimal", label: "Minimalista Elegante", hint: "Overlay leve, muito respiro" },
  { value: "institutional", label: "Jurídico Institucional", hint: "Barra lateral + tipografia sóbria" },
  { value: "modern", label: "Moderno com Gradiente", hint: "Gradiente nas cores da marca" },
  { value: "translucent", label: "Card Translúcido", hint: "Card com bordas arredondadas e blur sutil" },
  { value: "sidebar", label: "Faixa lateral", hint: "Faixa colorida fina à esquerda" },
  { value: "fullscreen", label: "Imagem fullscreen + overlay suave", hint: "Mínima intervenção sobre a foto" },
];

interface BrandPalette { colors?: string[] }

/** Escolhe a cor da marca com melhor presença para usar como ACENTO (não cinza). */
function pickAccent(palette: BrandPalette): string {
  const colors = (palette.colors || []).filter((c) => parseHex(c));
  if (!colors.length) return "#f59e0b";
  // prefere a primeira cor que não seja muito clara nem muito escura
  for (const c of colors) {
    const l = getRelativeLuminance(c);
    if (l > 0.12 && l < 0.78) return c;
  }
  return colors[0];
}

/** Heurística: o overlay é "grande" se cobre >45% da área do canvas. */
function isLargeOverlay(el: El): boolean {
  const area = (el.w * el.h) / (CANVAS_W * CANVAS_H);
  return area > 0.45;
}

/** Overlay cobre quase a largura inteira (vira tarja). */
function isFullWidth(el: El): boolean {
  return el.w / CANVAS_W > 0.85;
}

/** Estende um overlay para até as bordas (banda de rodapé/topo). */
function stretchToBand(el: El, position: "bottom" | "top"): El {
  const bandH = Math.max(el.h, Math.round(CANVAS_H * 0.42));
  return {
    ...el,
    x: 0,
    w: CANVAS_W,
    h: bandH,
    y: position === "bottom" ? CANVAS_H - bandH : 0,
  };
}

/** Adiciona uma barra fina de acento. */
function accentBar(opts: { x: number; y: number; w: number; h: number; color: string; vertical?: boolean }): El {
  return {
    id: AESTHETIC_PREFIX + uid(),
    type: "shape",
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    bg: opts.color, opacity: 1, radius: 999,
  };
}

function refineSlide(slide: Slide, preset: StylePreset, accent: string): Slide {
  // 1) limpa acentos antigos (mantém readability shapes pra reformatar)
  let els = slide.els.filter((e) => !e.id.startsWith(AESTHETIC_PREFIX));

  // 2) trata cada overlay de legibilidade conforme preset
  const newEls: El[] = [];
  for (const e of els) {
    const isAutoBg = e.id.startsWith(READABILITY_PREFIX) && e.type === "shape";
    if (!isAutoBg) { newEls.push(e); continue; }
    newEls.push(restyleOverlay(e, preset, accent));
  }
  els = newEls;

  // 3) adiciona acentos baseados no preset
  const accents = buildAccents(slide, preset, accent);
  // acentos vão ANTES dos textos pra ficarem atrás visualmente
  // (mantemos ordem: overlays/acentos primeiro, depois textos/elementos)
  const textsAndImages = els.filter((e) => e.type === "text" || e.type === "image");
  const shapes = els.filter((e) => e.type === "shape");
  const finalEls = [...shapes, ...accents, ...textsAndImages];

  return { ...slide, els: finalEls };
}

function restyleOverlay(e: El, preset: StylePreset, accent: string): El {
  // Regra geral: NUNCA tarja chapada grande. Se o overlay for grande OU ocupar
  // a largura inteira, convertemos em GRADIENTE vertical vindo da base/topo.
  if (isLargeOverlay(e) || isFullWidth(e)) {
    const fromBottom = e.y + e.h / 2 > CANVAS_H / 2;
    const stretched = stretchToBand(e, fromBottom ? "bottom" : "top");
    const dir = fromBottom ? "0deg" : "180deg";
    const tint = preset === "modern" ? withAlpha(accent, 0.25) : "rgba(8,10,20,0.78)";
    return {
      ...stretched,
      radius: 0,
      opacity: 1,
      // gradiente: transparente em cima → leve → escuro na base (e vice-versa)
      bg: `linear-gradient(${dir}, rgba(8,10,20,0) 0%, rgba(8,10,20,0.18) 35%, rgba(8,10,20,0.55) 75%, ${tint} 100%)`,
    };
  }

  // Overlays pequenos (cards de texto): SEMPRE arredondados, opacidade baixa.
  switch (preset) {
    case "fullscreen":
      // mínima intervenção — card quase invisível
      return { ...e, radius: 18, opacity: 1, bg: "rgba(10,15,30,0.22)" };
    case "minimal":
      return { ...e, radius: 20, opacity: 1, bg: "rgba(10,15,30,0.26)" };
    case "translucent":
      return { ...e, radius: 24, opacity: 1, bg: "rgba(15,20,35,0.32)" };
    case "modern":
      return {
        ...e,
        radius: 22,
        opacity: 1,
        bg: `linear-gradient(180deg, rgba(10,12,24,0.22) 0%, ${withAlpha(accent, 0.32)} 100%)`,
      };
    case "institutional":
      // card sóbrio mas não pesado
      return { ...e, radius: 12, opacity: 1, bg: "rgba(8,12,24,0.42)" };
    case "sidebar":
      return { ...e, radius: 16, opacity: 1, bg: "rgba(10,15,30,0.28)" };
    case "editorial":
    case "auto":
    default:
      // card discreto editorial
      return { ...e, radius: 18, opacity: 1, bg: "rgba(10,12,24,0.34)" };
  }
}

function buildAccents(slide: Slide, preset: StylePreset, accent: string): El[] {
  // só adiciona acentos quando há textos no slide
  const hasText = slide.els.some((e) => e.type === "text");
  if (!hasText) return [];

  switch (preset) {
    case "sidebar":
    case "institutional":
      return [accentBar({ x: 0, y: 0, w: 6, h: CANVAS_H, color: accent })];
    case "editorial":
    case "auto": {
      // pequena marca de acento no canto inferior esquerdo
      return [accentBar({ x: 24, y: CANVAS_H - 28, w: 36, h: 3, color: accent })];
    }
    case "modern":
      return [accentBar({ x: 24, y: CANVAS_H - 28, w: 56, h: 3, color: accent })];
    default:
      return [];
  }
}

function withAlpha(hex: string, a: number): string {
  const c = parseHex(hex);
  if (!c) return `rgba(245,158,11,${a})`;
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

/**
 * API pública. Aplique sempre DEPOIS de `ensureReadableTextLayers`.
 */
export function refineDesignAesthetics(
  doc: StudioDoc,
  brand: BrandPalette = {},
  preset: StylePreset = "auto",
): StudioDoc {
  const accent = pickAccent(brand);
  const slides = doc.slides.map((s) => refineSlide(s, preset, accent));
  return { ...doc, slides };
}
