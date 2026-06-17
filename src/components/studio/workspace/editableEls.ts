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
  const { heading, body, brandHandle, index, total } = opts;
  const els: El[] = [];

  // Gradiente inferior pra leitura — não-editável visualmente, mas existe como shape.
  els.push({
    id: uid(), type: "shape",
    x: 0, y: Math.round(H * 0.42), w: W, h: H - Math.round(H * 0.42),
    bg: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.88) 100%)",
    opacity: 1,
    zIndex: 1,
  });

  // Contador discreto no topo direito
  if (typeof index === "number" && typeof total === "number" && total > 1) {
    els.push({
      id: uid(), type: "text",
      x: W - MARGIN - 60, y: 18, w: 60, h: 18,
      text: `${index + 1} / ${total}`,
      fontSize: 10, color: "rgba(255,255,255,0.92)",
      weight: 600, align: "right",
      zIndex: 5,
    });
  }

  const head = (heading || "").trim();
  const bodyText = (body || "").trim();

  // Heading grande, branco, embaixo à esquerda
  els.push({
    id: uid(), type: "text",
    x: MARGIN, y: 268, w: W - MARGIN * 2, h: 130,
    text: head,
    fontSize: 38, weight: 800,
    align: "left",
    color: "#ffffff",
    lineHeight: 1.02,
    letterSpacing: -0.4,
    shadow: "0 2px 14px rgba(0,0,0,0.45)",
    zIndex: 3,
  });

  if (bodyText) {
    els.push({
      id: uid(), type: "text",
      x: MARGIN, y: 398, w: W - MARGIN * 2, h: 40,
      text: bodyText,
      fontSize: 12, weight: 400,
      align: "left",
      color: "rgba(255,255,255,0.88)",
      lineHeight: 1.35,
      zIndex: 3,
    });
  }

  // Handle discreto no rodapé esquerdo
  if (brandHandle) {
    els.push({
      id: uid(), type: "text",
      x: MARGIN, y: H - 22, w: 200, h: 16,
      text: brandHandle,
      fontSize: 9, color: "rgba(255,255,255,0.7)",
      weight: 500, align: "left",
      zIndex: 5,
    });
  }

  return els;
}

