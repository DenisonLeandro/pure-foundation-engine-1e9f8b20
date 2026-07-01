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
import { drawFromBag } from "./creativeRotation";
import type { BrandProfile } from "@/lib/brand";

const READABILITY_PREFIX = "rb-bg-";
const AESTHETIC_PREFIX = "rb-aes-";
const META_PREFIX = "rb-meta-";

export type StylePreset =
  | "auto"
  | "editorial"
  | "minimal"
  | "institutional"
  | "modern"
  | "translucent"
  | "sidebar"
  | "fullscreen"
  | "energetic";

export const STYLE_PRESETS: { value: StylePreset; label: string; hint: string }[] = [
  { value: "auto", label: "Automático", hint: "A IA escolhe o estilo pelo tom do conteúdo" },
  { value: "editorial", label: "Editorial Premium", hint: "Serifada elegante + faixa de acento" },
  { value: "minimal", label: "Minimalista Elegante", hint: "Overlay leve, muito respiro" },
  { value: "institutional", label: "Institucional/Jurídico", hint: "Barra lateral + tipografia sóbria" },
  { value: "modern", label: "Moderno com Gradiente", hint: "Gradiente nas cores da marca" },
  { value: "energetic", label: "Animado/Esportivo", hint: "Tipografia bold em caixa alta, tom vibrante" },
  { value: "translucent", label: "Card Translúcido", hint: "Card com bordas arredondadas e blur sutil" },
  { value: "sidebar", label: "Faixa lateral", hint: "Faixa colorida fina à esquerda" },
  { value: "fullscreen", label: "Imagem fullscreen + overlay suave", hint: "Mínima intervenção sobre a foto" },
];

/**
 * Tipografia por preset — cada "mood" usa fonte/peso/tracking diferentes pra
 * não cair sempre na mesma fonte padrão (o que fazia tudo parecer igual,
 * independente do tema ser sério ou leve). Fontes carregadas em index.html.
 */
export interface PresetTypography {
  fontFamily: string;
  weight: number;
  letterSpacing: number;
  uppercase?: boolean;
  kickerFontFamily?: string;
}

export const PRESET_TYPOGRAPHY: Record<StylePreset, PresetTypography> = {
  auto: { fontFamily: "'Poppins', sans-serif", weight: 800, letterSpacing: -0.3 },
  editorial: { fontFamily: "'Playfair Display', serif", weight: 800, letterSpacing: -0.2 },
  minimal: { fontFamily: "'Poppins', sans-serif", weight: 600, letterSpacing: -0.1 },
  institutional: { fontFamily: "'Source Serif 4', serif", weight: 700, letterSpacing: 0 },
  modern: { fontFamily: "'Space Grotesk', sans-serif", weight: 700, letterSpacing: -0.4 },
  energetic: { fontFamily: "'Bebas Neue', sans-serif", weight: 400, letterSpacing: 0.5, uppercase: true, kickerFontFamily: "'Space Grotesk', sans-serif" },
  translucent: { fontFamily: "'Poppins', sans-serif", weight: 700, letterSpacing: -0.2 },
  sidebar: { fontFamily: "'Space Grotesk', sans-serif", weight: 700, letterSpacing: -0.2 },
  fullscreen: { fontFamily: "'Poppins', sans-serif", weight: 800, letterSpacing: -0.3 },
};

export function getPresetTypography(preset: StylePreset): PresetTypography {
  return PRESET_TYPOGRAPHY[preset] || PRESET_TYPOGRAPHY.editorial;
}

export function getBrandTypography(brand: BrandProfile | null | undefined, preset: StylePreset): PresetTypography {
  const base = getPresetTypography(preset);
  if (!brand) return base;
  const override: PresetTypography = { ...base };
  if (brand.font_title) override.fontFamily = brand.font_title;
  if (brand.font_body) override.fontFamily = brand.font_body;
  return override;
}

interface BrandPalette { colors?: string[] }

/** Filtra as cores da marca que têm boa presença visual para acento (nem muito claras nem muito escuras). */
export function getUsableBrandColors(colors: string[] = []): string[] {
  const valid = colors.filter((c) => parseHex(c));
  const wellBalanced = valid.filter((c) => {
    const l = getRelativeLuminance(c);
    return l > 0.12 && l < 0.78;
  });
  return wellBalanced.length ? wellBalanced : valid;
}

/** Escolhe a cor da marca com melhor presença para usar como ACENTO (não cinza). Determinístico — sempre a mesma para a mesma marca. */
function pickAccent(palette: BrandPalette): string {
  const usable = getUsableBrandColors(palette.colors);
  return usable[0] || "#f59e0b";
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
  // Halos pré-definidos como discretos (id `rb-bg-halo-*` ou opacidade muito
  // baixa): mantém como está, não troca cor nem aplica preset.
  if (e.id.startsWith("rb-bg-halo-")) return e;

  // Regra geral: NUNCA tarja chapada grande E NUNCA gradiente — fica feio e
  // datado. Se o overlay for grande/largura inteira, vira um tom uniforme e
  // sutil atrás do texto (sem degradê).
  if (isLargeOverlay(e) || isFullWidth(e)) {
    const fromBottom = e.y + e.h / 2 > CANVAS_H / 2;
    const stretched = stretchToBand(e, fromBottom ? "bottom" : "top");
    const tint = preset === "modern" ? withAlpha(accent, 0.3) : "rgba(8,10,20,0.5)";
    return {
      ...stretched,
      radius: 0,
      opacity: 1,
      bg: tint,
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
      return { ...e, radius: 22, opacity: 1, bg: withAlpha(accent, 0.28) };
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

/** Topo do bloco de texto do slide (menor `y` entre os elementos de texto). */
function textBlockTop(slide: Slide): number | null {
  // ignora contador ("3/7") e handle da marca — são metadados no topo/rodapé,
  // não o título; se entrassem no cálculo, a barra de acento "subiria" pro
  // canto superior e colidiria com o selo da logo.
  const ys = slide.els
    .filter((e) => e.type === "text" && !e.id.startsWith(META_PREFIX))
    .map((e) => e.y);
  return ys.length ? Math.min(...ys) : null;
}

function buildAccents(slide: Slide, preset: StylePreset, accent: string): El[] {
  // só adiciona acentos quando há textos no slide
  const top = textBlockTop(slide);
  if (top === null) return [];

  // Ancora a barra IMEDIATAMENTE ACIMA do bloco de texto real do slide —
  // nunca numa coordenada fixa, senão ela "flutua" sozinha quando o
  // template põe o texto no topo/centro em vez do rodapé.
  const gap = 10;
  const barH = 2;
  const y = Math.max(0, top - gap - barH);

  switch (preset) {
    case "sidebar":
    case "institutional":
      return [accentBar({ x: 0, y: 0, w: 6, h: CANVAS_H, color: accent })];
    case "editorial":
    case "auto":
      return [accentBar({ x: 24, y, w: 28, h: barH, color: accent })];
    case "modern":
    case "energetic":
      return [accentBar({ x: 24, y, w: 44, h: barH, color: accent })];
    default:
      return [];
  }
}

function withAlpha(hex: string, a: number): string {
  const c = parseHex(hex);
  if (!c) return `rgba(245,158,11,${a})`;
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

/** Retorna lista de presets "seguros" para rotação automática (exclui "auto"). */
export function getCompatiblePresets(): StylePreset[] {
  return [
    "editorial",
    "minimal",
    "modern",
    "translucent",
    "sidebar",
    "institutional",
    "fullscreen",
    "energetic",
  ];
}

/**
 * Escolhe o próximo preset visual via baralho sem repetição (todas as opções
 * aparecem antes de qualquer repetição). `brandArtStyle` é tratado como
 * PREFERÊNCIA (assinatura da marca): tem mais chance de vir primeiro em cada
 * ciclo novo do baralho, mas nunca trava a frequência de longo prazo.
 */
export function pickNextPreset(
  brandArtStyle: string | undefined,
  lastUsed: StylePreset | undefined,
  bag: StylePreset[] | undefined,
): { picked: StylePreset; bag: StylePreset[] } {
  const compatible = getCompatiblePresets();
  const preferred = brandArtStyle && compatible.includes(brandArtStyle as StylePreset)
    ? (brandArtStyle as StylePreset)
    : undefined;
  return drawFromBag(compatible, bag, lastUsed, preferred);
}

/**
 * API pública. Aplique sempre DEPOIS de `ensureReadableTextLayers`.
 */
export function refineDesignAesthetics(
  doc: StudioDoc,
  brand: BrandPalette = {},
  preset: StylePreset = "auto",
  accentOverride?: string,
): StudioDoc {
  const accent = accentOverride || pickAccent(brand);
  const slides = doc.slides.map((s) => refineSlide(s, preset, accent));
  return { ...doc, slides };
}
