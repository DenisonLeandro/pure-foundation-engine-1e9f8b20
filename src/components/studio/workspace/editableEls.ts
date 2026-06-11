/**
 * Constrói elementos de texto editáveis (El[]) para um slide gerado pela IA,
 * com posições aproximadas baseadas no template. Coordenadas usam o sistema
 * do preview do canvas (CANVAS_W=360 × CANVAS_H=450).
 *
 * Não busca pixel-perfect com o composeSlideWithText (que renderiza em 1024×1536):
 * o objetivo é que o usuário consiga selecionar, editar, mover e re-exportar.
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

export function buildEditableEls(opts: BuildElsOpts): El[] {
  const { heading, body, brandHandle, brandColor = "#f59e0b", index, total, template } = opts;
  const els: El[] = [];

  // Chrome — brand handle e contador (presentes na maioria dos templates)
  if (brandHandle) {
    els.push({
      id: uid(), type: "text",
      x: MARGIN, y: template === "top" ? H - 36 : 18,
      w: 200, h: 18,
      text: brandHandle, fontSize: 10, color: "rgba(255,255,255,0.78)",
      weight: 500, align: "left",
    });
  }
  if (typeof index === "number" && typeof total === "number" && total > 1) {
    els.push({
      id: uid(), type: "text",
      x: W - MARGIN - 60, y: template === "top" ? H - 36 : 18,
      w: 60, h: 18,
      text: `${index + 1} / ${total}`, fontSize: 10, color: "rgba(255,255,255,0.88)",
      weight: 600, align: "right",
    });
  }

  // Heading + body por template
  const head = (heading || "").trim();
  const bodyText = (body || "").trim();

  switch (template) {
    case "top": {
      els.push(textEl({ x: MARGIN, y: 80, w: W - MARGIN * 2, h: 90, text: head, fontSize: 26, weight: 800, align: "left", color: "#ffffff" }));
      if (bodyText) els.push(textEl({ x: MARGIN, y: 180, w: W - MARGIN * 2, h: 60, text: bodyText, fontSize: 12, weight: 500, align: "left", color: "rgba(255,255,255,0.9)" }));
      els.push(shapeBar(MARGIN, 60, brandColor));
      break;
    }
    case "center-card": {
      els.push({
        id: uid(), type: "shape",
        x: MARGIN, y: 150, w: W - MARGIN * 2, h: 160,
        bg: "rgba(10,15,30,0.72)", opacity: 1,
      });
      els.push(textEl({ x: MARGIN + 18, y: 168, w: W - (MARGIN + 18) * 2, h: 100, text: head, fontSize: 22, weight: 800, align: "left", color: "#ffffff" }));
      if (bodyText) els.push(textEl({ x: MARGIN + 18, y: 270, w: W - (MARGIN + 18) * 2, h: 36, text: bodyText, fontSize: 11, weight: 500, align: "left", color: "rgba(255,255,255,0.88)" }));
      break;
    }
    case "side-bar": {
      els.push({
        id: uid(), type: "shape",
        x: 0, y: 0, w: Math.round(W * 0.42), h: H,
        bg: brandColor, opacity: 0.95,
      });
      const barW = Math.round(W * 0.42);
      els.push(textEl({ x: 16, y: 140, w: barW - 32, h: 140, text: head, fontSize: 20, weight: 800, align: "left", color: "#ffffff" }));
      if (bodyText) els.push(textEl({ x: 16, y: 290, w: barW - 32, h: 90, text: bodyText, fontSize: 11, weight: 500, align: "left", color: "rgba(255,255,255,0.92)" }));
      break;
    }
    case "kicker": {
      const kickerText = typeof index === "number" && typeof total === "number" && total > 1
        ? `CAPÍTULO ${String(index + 1).padStart(2, "0")}`
        : "DESTAQUE";
      els.push(textEl({ x: MARGIN, y: 280, w: W - MARGIN * 2, h: 18, text: kickerText, fontSize: 9, weight: 700, align: "left", color: "rgba(255,255,255,0.92)" }));
      els.push(textEl({ x: MARGIN, y: 300, w: W - MARGIN * 2, h: 90, text: head, fontSize: 28, weight: 800, align: "left", color: "#ffffff" }));
      if (bodyText) els.push(textEl({ x: MARGIN, y: 396, w: W - MARGIN * 2, h: 40, text: bodyText, fontSize: 11, weight: 500, align: "left", color: "rgba(255,255,255,0.9)" }));
      break;
    }
    case "quote": {
      els.push(textEl({ x: MARGIN, y: 170, w: W - MARGIN * 2, h: 160, text: `“${head}”`, fontSize: 20, weight: 600, align: "center", color: "#ffffff" }));
      break;
    }
    case "bottom":
    default: {
      els.push(textEl({ x: MARGIN, y: 300, w: W - MARGIN * 2, h: 90, text: head, fontSize: 28, weight: 800, align: "left", color: "#ffffff" }));
      if (bodyText) els.push(textEl({ x: MARGIN, y: 396, w: W - MARGIN * 2, h: 40, text: bodyText, fontSize: 11, weight: 500, align: "left", color: "rgba(255,255,255,0.9)" }));
      break;
    }
  }

  return els;
}

function textEl(p: { x: number; y: number; w: number; h: number; text: string; fontSize: number; weight: number; align: "left" | "center" | "right"; color: string }): El {
  return {
    id: uid(), type: "text",
    x: p.x, y: p.y, w: p.w, h: p.h,
    text: p.text, fontSize: p.fontSize, weight: p.weight, align: p.align, color: p.color,
  };
}

function shapeBar(x: number, y: number, color: string): El {
  return { id: uid(), type: "shape", x, y, w: 40, h: 3, bg: color, opacity: 1 };
}
