/**
 * Constrói elementos de texto editáveis (El[]) para um slide gerado pela IA,
 * com posições aproximadas baseadas no template. Coordenadas usam o sistema
 * do preview do canvas (CANVAS_W=360 × CANVAS_H=450).
 *
 * Padrão editorial leve: sem gradiente cobrindo a foto, só uma sombra em
 * camadas, suave e quase invisível, que dá leitura sem virar mancha.
 */

import type { El } from "./types";
import { uid } from "./types";
import type { SlideTemplate } from "@/lib/slide-compose";
import { getPresetTypography, type StylePreset } from "./designAesthetics";

export interface BuildElsOpts {
  heading: string;
  body?: string;
  brandHandle?: string;
  brandColor?: string;
  index?: number;
  total?: number;
  template: SlideTemplate;
  /** Estilo/"mood" tipográfico (mesmo preset usado em refineDesignAesthetics) — varia fonte/peso/tracking pra não ficar sempre igual independente do tom do conteúdo. */
  mood?: StylePreset;
}

/**
 * Estima quantas linhas um texto vai ocupar numa caixa de largura `boxW`
 * com um dado `fontSize`, e reduz o fontSize até caber em `maxLines` —
 * evita títulos longos vazando da caixa e colidindo com o texto de apoio.
 */
function estimateLines(text: string, fontSize: number, boxW: number): number {
  const avgCharW = fontSize * 0.56;
  const charsPerLine = Math.max(6, Math.floor(boxW / avgCharW));
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  let lines = 1;
  let lineLen = 0;
  for (const w of words) {
    const wl = w.length + 1;
    if (lineLen + wl > charsPerLine && lineLen > 0) {
      lines++;
      lineLen = wl;
    } else {
      lineLen += wl;
    }
  }
  return lines;
}

function fitHeading(text: string, boxW: number, baseFontSize: number, maxLines: number, minFontSize = 18): { fontSize: number; lines: number } {
  let fontSize = baseFontSize;
  while (fontSize > minFontSize) {
    const lines = estimateLines(text, fontSize, boxW);
    if (lines <= maxLines) return { fontSize, lines };
    fontSize -= 2;
  }
  return { fontSize, lines: Math.min(maxLines, estimateLines(text, fontSize, boxW)) };
}

const W = 360;
const H = 450;
const MARGIN = 24;
// Drop-shadow natural em camadas: primeira camada (offset zero, blur pequeno)
// protege contra fundo branco sem parecer contorno; próximas camadas criam halo.
const SHADOW_DISCRETE =
  "0 0 2px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)";
const SHADOW =
  "0 0 3px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)";
const SHADOW_STRONG =
  "0 0 4px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.2)";

// Halo radial MUITO discreto atrás do título — 18% de opacidade, pílula
// totalmente arredondada. Quase invisível sobre fotos médias/escuras, dá só
// um respiro extra onde a foto é clara demais.
const HALO_PREFIX = "rb-bg-halo-";
// Contador ("3/7") e handle da marca são metadados decorativos, não fazem
// parte do bloco de título — não devem influenciar onde os acentos são
// ancorados (senão a barra de acento "sobe" pro topo e colide com a logo).
const META_PREFIX = "rb-meta-";
function titleHalo(x: number, y: number, w: number, h: number): El {
  const padX = 24, padY = 16;
  return {
    id: HALO_PREFIX + uid(),
    type: "shape",
    x: Math.max(0, x - padX),
    y: Math.max(0, y - padY),
    w: w + padX * 2,
    h: h + padY * 2,
    bg: "rgba(0,0,0,0.18)",
    opacity: 1,
    radius: 999,
    zIndex: 1,
  };
}


function counterEl(index: number | undefined, total: number | undefined, position: "top-right" | "bottom-right"): El | null {
  if (typeof index !== "number" || typeof total !== "number" || total <= 1) return null;
  return {
    id: META_PREFIX + uid(), type: "text",
    x: W - MARGIN - 60,
    y: position === "top-right" ? 18 : H - 18,
    w: 60, h: 14,
    text: `${index + 1} / ${total}`,
    fontSize: 10, color: "rgba(255,255,255,0.9)",
    weight: 600, align: "right",
    shadow: SHADOW,
    zIndex: 5,
  };
}

function handleEl(brandHandle: string | undefined, position: "bottom-left" | "top-left"): El | null {
  if (!brandHandle) return null;
  return {
    id: META_PREFIX + uid(), type: "text",
    x: MARGIN,
    y: position === "bottom-left" ? H - 18 : 18,
    w: 200, h: 14,
    text: brandHandle,
    fontSize: 9, color: "rgba(255,255,255,0.7)",
    weight: 500, align: "left",
    shadow: SHADOW,
    zIndex: 5,
  };
}

export function buildEditableEls(opts: BuildElsOpts): El[] {
  const { heading, body, brandHandle, index, total, template, mood } = opts;
  const els: El[] = [];
  const typo = getPresetTypography(mood || "auto");
  const headLineHeight = 1.06;
  const boxW = W - MARGIN * 2;
  let head = (heading || "").trim();
  const bodyText = (body || "").trim();
  if (typo.uppercase) head = head.toLocaleUpperCase("pt-BR");

  switch (template) {
    case "top": {
      const { fontSize, lines } = fitHeading(head, boxW, 32, 3);
      const headH = Math.round(lines * fontSize * headLineHeight + fontSize * 0.3);
      const headY = 56;
      els.push(titleHalo(MARGIN, headY, boxW, headH));
      els.push({
        id: uid(), type: "text",
        x: MARGIN, y: headY, w: boxW, h: headH,
        text: head,
        fontSize, weight: typo.weight, align: "left", color: "#ffffff",
        fontFamily: typo.fontFamily,
        lineHeight: headLineHeight, letterSpacing: typo.letterSpacing, shadow: SHADOW_STRONG, zIndex: 3,
      });
      if (bodyText) {
        els.push({
          id: uid(), type: "text",
          x: MARGIN, y: headY + headH + 14, w: boxW, h: 72,
          text: bodyText,
          fontSize: 12, weight: 400, align: "left",
          color: "rgba(255,255,255,0.94)",
          lineHeight: 1.4, shadow: SHADOW, zIndex: 3,
        });
      }
      const c = counterEl(index, total, "bottom-right"); if (c) els.push(c);
      const h = handleEl(brandHandle, "bottom-left"); if (h) els.push(h);
      break;
    }

    case "center-card": {
      const { fontSize, lines } = fitHeading(head, boxW, 28, 4);
      const headH = Math.round(lines * fontSize * 1.1 + fontSize * 0.3);
      const headY = 146;
      els.push(titleHalo(MARGIN, headY, boxW, headH));
      els.push({
        id: uid(), type: "text",
        x: MARGIN, y: headY, w: boxW, h: headH,
        text: head,
        fontSize, weight: typo.weight, align: "center", color: "#ffffff",
        fontFamily: typo.fontFamily,
        lineHeight: 1.1, letterSpacing: typo.letterSpacing, shadow: SHADOW_STRONG, zIndex: 3,
      });
      if (bodyText) {
        els.push({
          id: uid(), type: "text",
          x: MARGIN, y: headY + headH + 14, w: boxW, h: 80,
          text: bodyText,
          fontSize: 12, weight: 400, align: "center",
          color: "rgba(255,255,255,0.94)",
          lineHeight: 1.4, shadow: SHADOW, zIndex: 3,
        });
      }
      const c = counterEl(index, total, "top-right"); if (c) els.push(c);
      const h = handleEl(brandHandle, "bottom-left"); if (h) els.push(h);
      break;
    }

    case "kicker": {
      const kickerText = typeof index === "number" && typeof total === "number" && total > 1
        ? `PARTE ${String(index + 1).padStart(2, "0")}`
        : "DESTAQUE";
      const kickerY = 208;
      els.push({
        id: uid(), type: "text",
        x: MARGIN, y: kickerY, w: boxW, h: 14,
        text: kickerText,
        fontSize: 9, weight: 700, align: "left",
        color: "rgba(255,255,255,0.88)",
        fontFamily: typo.kickerFontFamily,
        letterSpacing: 1.6, shadow: SHADOW, zIndex: 3,
      });
      const { fontSize, lines } = fitHeading(head, boxW, 28, 3);
      const headH = Math.round(lines * fontSize * headLineHeight + fontSize * 0.3);
      const headY = kickerY + 20;
      els.push(titleHalo(MARGIN, headY, boxW, headH));
      els.push({
        id: uid(), type: "text",
        x: MARGIN, y: headY, w: boxW, h: headH,
        text: head,
        fontSize, weight: typo.weight, align: "left", color: "#ffffff",
        fontFamily: typo.fontFamily,
        lineHeight: headLineHeight, letterSpacing: typo.letterSpacing, shadow: SHADOW_STRONG, zIndex: 3,
      });
      if (bodyText) {
        els.push({
          id: uid(), type: "text",
          x: MARGIN, y: headY + headH + 12, w: boxW, h: 50,
          text: bodyText,
          fontSize: 11, weight: 400, align: "left",
          color: "rgba(255,255,255,0.9)",
          lineHeight: 1.35, shadow: SHADOW, zIndex: 3,
        });
      }
      const c = counterEl(index, total, "top-right"); if (c) els.push(c);
      const h = handleEl(brandHandle, "bottom-left"); if (h) els.push(h);
      break;
    }

    case "bottom":
    default: {
      const { fontSize, lines } = fitHeading(head, boxW, 34, 3);
      const headH = Math.round(lines * fontSize * 1.04 + fontSize * 0.3);
      // ancora pelo rodapé: quanto mais linhas, mais o bloco sobe (nunca desce do canvas).
      const headY = Math.max(140, H - 50 - headH - (bodyText ? 62 : 0));
      els.push(titleHalo(MARGIN, headY, boxW, headH));
      els.push({
        id: uid(), type: "text",
        x: MARGIN, y: headY, w: boxW, h: headH,
        text: head,
        fontSize, weight: typo.weight, align: "left", color: "#ffffff",
        fontFamily: typo.fontFamily,
        lineHeight: 1.04, letterSpacing: typo.letterSpacing, shadow: SHADOW_STRONG, zIndex: 3,
      });
      if (bodyText) {
        els.push({
          id: uid(), type: "text",
          x: MARGIN, y: headY + headH + 12, w: boxW, h: 50,
          text: bodyText,
          fontSize: 12, weight: 400, align: "left",
          color: "rgba(255,255,255,0.92)",
          lineHeight: 1.35, shadow: SHADOW, zIndex: 3,
        });
      }
      const c = counterEl(index, total, "top-right"); if (c) els.push(c);
      const h = handleEl(brandHandle, "bottom-left"); if (h) els.push(h);
      break;
    }
  }

  return els;
}

