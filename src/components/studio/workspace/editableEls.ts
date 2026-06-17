/**
 * Constrói elementos de texto editáveis (El[]) para um slide gerado pela IA,
 * com posições aproximadas baseadas no template. Coordenadas usam o sistema
 * do preview do canvas (CANVAS_W=360 × CANVAS_H=450).
 *
 * Padrão editorial leve: sem gradiente cobrindo a foto, só text-shadow sutil
 * pra leitura. Templates: bottom, top, center-card, kicker.
 */

import type { El } from "./types";
import { uid } from "./types";
import type { SlideTemplate } from "@/lib/slide-compose";

export interface BuildElsOpts {
  heading: string;
  body?: string;
  brandHandle?: string;
  brandColor?: string;
  index?: number;
  total?: number;
  template: SlideTemplate;
}

const W = 360;
const H = 450;
const MARGIN = 24;
const SHADOW = "0 2px 10px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.5)";

function counterEl(index: number | undefined, total: number | undefined, position: "top-right" | "bottom-right"): El | null {
  if (typeof index !== "number" || typeof total !== "number" || total <= 1) return null;
  return {
    id: uid(), type: "text",
    x: W - MARGIN - 60,
    y: position === "top-right" ? 18 : H - 24,
    w: 60, h: 16,
    text: `${index + 1} / ${total}`,
    fontSize: 10, color: "rgba(255,255,255,0.92)",
    weight: 600, align: "right",
    shadow: SHADOW,
    zIndex: 5,
  };
}

function handleEl(brandHandle: string | undefined, position: "bottom-left" | "top-left"): El | null {
  if (!brandHandle) return null;
  return {
    id: uid(), type: "text",
    x: MARGIN,
    y: position === "bottom-left" ? H - 22 : 18,
    w: 200, h: 16,
    text: brandHandle,
    fontSize: 9, color: "rgba(255,255,255,0.72)",
    weight: 500, align: "left",
    shadow: SHADOW,
    zIndex: 5,
  };
}

export function buildEditableEls(opts: BuildElsOpts): El[] {
  const { heading, body, brandHandle, index, total, template } = opts;
  const els: El[] = [];
  const head = (heading || "").trim();
  const bodyText = (body || "").trim();

  switch (template) {
    case "top": {
      // Pequeno traço acima do título
      els.push({
        id: uid(), type: "shape",
        x: MARGIN, y: 56, w: 28, h: 2,
        bg: "rgba(255,255,255,0.7)", opacity: 1, zIndex: 2,
      });
      els.push({
        id: uid(), type: "text",
        x: MARGIN, y: 70, w: W - MARGIN * 2, h: 130,
        text: head,
        fontSize: 36, weight: 800, align: "left", color: "#ffffff",
        lineHeight: 1.02, letterSpacing: -0.4, shadow: SHADOW, zIndex: 3,
      });
      if (bodyText) {
        els.push({
          id: uid(), type: "text",
          x: MARGIN, y: 208, w: W - MARGIN * 2, h: 50,
          text: bodyText,
          fontSize: 12, weight: 400, align: "left",
          color: "rgba(255,255,255,0.92)",
          lineHeight: 1.35, shadow: SHADOW, zIndex: 3,
        });
      }
      const c = counterEl(index, total, "bottom-right"); if (c) els.push(c);
      const h = handleEl(brandHandle, "bottom-left"); if (h) els.push(h);
      break;
    }

    case "center-card": {
      // Sem card escuro. Título e legenda centralizados, apoiados só na sombra.
      els.push({
        id: uid(), type: "text",
        x: MARGIN, y: 170, w: W - MARGIN * 2, h: 120,
        text: head,
        fontSize: 30, weight: 800, align: "center", color: "#ffffff",
        lineHeight: 1.05, letterSpacing: -0.3, shadow: SHADOW, zIndex: 3,
      });
      if (bodyText) {
        els.push({
          id: uid(), type: "text",
          x: MARGIN, y: 282, w: W - MARGIN * 2, h: 50,
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
      els.push({
        id: uid(), type: "shape",
        x: MARGIN, y: 248, w: 22, h: 2,
        bg: "rgba(255,255,255,0.7)", opacity: 1, zIndex: 2,
      });
      els.push({
        id: uid(), type: "text",
        x: MARGIN, y: 258, w: W - MARGIN * 2, h: 14,
        text: kickerText,
        fontSize: 9, weight: 700, align: "left",
        color: "rgba(255,255,255,0.92)",
        letterSpacing: 1.4, shadow: SHADOW, zIndex: 3,
      });
      els.push({
        id: uid(), type: "text",
        x: MARGIN, y: 280, w: W - MARGIN * 2, h: 110,
        text: head,
        fontSize: 34, weight: 800, align: "left", color: "#ffffff",
        lineHeight: 1.04, letterSpacing: -0.4, shadow: SHADOW, zIndex: 3,
      });
      if (bodyText) {
        els.push({
          id: uid(), type: "text",
          x: MARGIN, y: 396, w: W - MARGIN * 2, h: 40,
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
      // SEM gradiente. Só text-shadow forte pra leitura.
      els.push({
        id: uid(), type: "text",
        x: MARGIN, y: 268, w: W - MARGIN * 2, h: 130,
        text: head,
        fontSize: 38, weight: 800, align: "left", color: "#ffffff",
        lineHeight: 1.02, letterSpacing: -0.4, shadow: SHADOW, zIndex: 3,
      });
      if (bodyText) {
        els.push({
          id: uid(), type: "text",
          x: MARGIN, y: 398, w: W - MARGIN * 2, h: 40,
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
