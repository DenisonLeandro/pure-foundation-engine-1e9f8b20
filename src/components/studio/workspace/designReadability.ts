/**
 * Garantia de legibilidade dos textos do StudioDoc.
 *
 * Não rasteriza nada — apenas ajusta cores de texto (preferindo a paleta da marca)
 * e insere/atualiza um shape semitransparente atrás de textos quando o fundo for
 * uma imagem ou quando nenhuma cor da paleta atinja contraste suficiente.
 *
 * Os shapes auto-inseridos recebem id com prefixo "rb-" para que passes futuros
 * removam-nos antes de reavaliar (idempotente).
 */

import type { El, Slide, StudioDoc } from "./types";
import { uid } from "./types";

const AUTO_BG_PREFIX = "rb-bg-";

// ─── Cor utils ─────────────────────────────────────────────────────

export function parseHex(input?: string | null): { r: number; g: number; b: number; a: number } | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  // rgba(r,g,b,a) / rgb(r,g,b)
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(s);
  if (rgb) {
    return {
      r: clamp(+rgb[1], 0, 255),
      g: clamp(+rgb[2], 0, 255),
      b: clamp(+rgb[3], 0, 255),
      a: rgb[4] != null ? clamp(+rgb[4], 0, 1) : 1,
    };
  }
  // #rgb / #rrggbb / #rrggbbaa
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

export function getRelativeLuminance(hex: string): number {
  const c = parseHex(hex);
  if (!c) return 0.5;
  const lin = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

export function getContrastRatio(a: string, b: string): number {
  const la = getRelativeLuminance(a);
  const lb = getRelativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function isReadableTextColor(textColor: string, backgroundColor: string, min = 4.5): boolean {
  return getContrastRatio(textColor, backgroundColor) >= min;
}

/** Retorna a melhor cor de uma lista de candidatas para um dado fundo. */
export function chooseReadableTextColor(preferredColors: string[], backgroundColor: string): string | null {
  let best: { color: string; ratio: number } | null = null;
  for (const c of preferredColors) {
    if (!parseHex(c)) continue;
    const r = getContrastRatio(c, backgroundColor);
    if (!best || r > best.ratio) best = { color: c, ratio: r };
  }
  return best && best.ratio >= 4.5 ? best.color : null;
}

// ─── Slide background extraction ───────────────────────────────────

/** Extrai uma cor sólida aproximada do `slide.bg` (gradiente ou cor). */
function extractSlideSolidBg(bg?: string): string | null {
  if (!bg) return null;
  const s = bg.trim();
  if (parseHex(s)) return s;
  // gradiente: pega o primeiro hex/rgb que encontrar
  const hex = /#([0-9a-f]{3,8})/i.exec(s);
  if (hex) return `#${hex[1]}`;
  const rgb = /rgba?\([^)]+\)/i.exec(s);
  if (rgb) return rgb[0];
  return null;
}

/**
 * Determina o fundo "efetivo" sob um elemento de texto.
 * Retorna { color, fromImage } — color é null quando o fundo é uma imagem
 * sem cor dominante conhecida; nesse caso o caller decide por overlay.
 */
function effectiveBgUnderEl(slide: Slide, el: El): { color: string | null; fromImage: boolean } {
  // Procura shape opaco (alpha >= 0.6) que cubra o elemento — desenhado antes (z menor)
  for (const other of slide.els) {
    if (other === el) break;
    if (other.type !== "shape" || !other.bg) continue;
    const c = parseHex(other.bg);
    const opacity = other.opacity ?? 1;
    if (!c) continue;
    const effAlpha = (c.a ?? 1) * opacity;
    if (effAlpha < 0.55) continue;
    if (rectsOverlap(other, el)) return { color: other.bg, fromImage: false };
  }
  if (slide.bgImage) return { color: null, fromImage: true };
  return { color: extractSlideSolidBg(slide.bg), fromImage: false };
}

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

// ─── Núcleo: ensure ────────────────────────────────────────────────

export interface BrandPalette {
  colors?: string[]; // paleta principal da marca
}

const SAFE_LIGHT = "#ffffff";
const SAFE_DARK = "#0b0b0f";

/**
 * Idempotente: remove auto-overlays antigos, recolore textos para a paleta
 * quando possível e insere overlay seguro atrás de textos sobre imagem
 * quando nenhuma cor da paleta resolve o contraste.
 */
export function ensureReadableTextLayers(doc: StudioDoc, brand: BrandPalette = {}): StudioDoc {
  const palette = (brand.colors || []).filter((c) => parseHex(c));
  // Candidatas: paleta + branco/preto (sempre presentes como fallback neutro)
  const textCandidates = [...palette, SAFE_LIGHT, SAFE_DARK];

  const slides = doc.slides.map((slide) => {
    // 1) remove auto-overlays prévios (mantém todo o resto)
    let els = slide.els.filter((e) => !e.id.startsWith(AUTO_BG_PREFIX));

    // 2) para cada texto, escolhe melhor cor; se falhar, insere overlay atrás
    const newEls: El[] = [];
    for (const el of els) {
      if (el.type !== "text") { newEls.push(el); continue; }

      // Se o texto já carrega text-shadow forte (layouts editoriais),
      // confiamos na sombra e NÃO injetamos overlay atrás — mantém a foto limpa.
      if (el.shadow && String(el.shadow).trim().length > 0) {
        newEls.push(el);
        continue;
      }

      // base com novos overlays já adicionados nesta passada
      const partialSlide: Slide = { ...slide, els: newEls };
      const bgInfo = effectiveBgUnderEl(partialSlide, el);
      const currentColor = el.color || "#ffffff";

      // Se já há contraste suficiente, mantém
      if (bgInfo.color && isReadableTextColor(currentColor, bgInfo.color)) {
        newEls.push(el);
        continue;
      }


      // Tenta trocar para outra cor da paleta com contraste OK
      if (bgInfo.color) {
        const better = chooseReadableTextColor(textCandidates, bgInfo.color);
        if (better) {
          newEls.push({ ...el, color: better });
          continue;
        }
      }

      // Sem cor de fundo conhecida (imagem) OU paleta não resolve:
      // adiciona overlay SUTIL atrás do texto e força cor segura.
      // Opacidades baixas (≤ 0.42) + radius generoso para evitar "tarja quadrada".
      const preferDarkOverlay = decideOverlayTone(currentColor);
      const overlayBg = preferDarkOverlay ? "rgba(10,15,30,0.38)" : "rgba(255,255,255,0.55)";
      const safeText = preferDarkOverlay ? SAFE_LIGHT : SAFE_DARK;

      const padX = 14;
      const padY = 8;
      newEls.push({
        id: AUTO_BG_PREFIX + uid(),
        type: "shape",
        x: Math.max(0, el.x - padX),
        y: Math.max(0, el.y - padY),
        w: el.w + padX * 2,
        h: el.h + padY * 2,
        bg: overlayBg,
        opacity: 1,
        radius: 18,
      });
      newEls.push({ ...el, color: safeText });
    }
    els = newEls;
    return { ...slide, els };
  });

  return { ...doc, slides };
}

/** Heurística: se a cor de texto atual já é escura, prefere overlay claro; senão escuro. */
function decideOverlayTone(textColor: string): boolean {
  const lum = getRelativeLuminance(textColor);
  // texto claro → overlay escuro (true). texto escuro → overlay claro (false).
  return lum >= 0.5;
}
