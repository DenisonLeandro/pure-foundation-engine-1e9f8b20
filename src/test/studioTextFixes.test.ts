import { describe, it, expect } from "vitest";
import { buildEditableEls } from "@/components/studio/workspace/editableEls";
import { ensureReadableTextLayers } from "@/components/studio/workspace/designReadability";
import type { StudioDoc } from "@/components/studio/workspace/types";

describe("verificação pontual: remover contador/PARTE + corrigir contraste", () => {
  it("buildEditableEls não produz mais texto de contador nem 'PARTE X'", () => {
    for (const template of ["top", "center-card", "kicker", "bottom", "side-bar", "quote"] as const) {
      const els = buildEditableEls({
        heading: "Título de teste",
        body: "Corpo de teste",
        index: 1,
        total: 5,
        template,
      });
      const texts = els.filter((e) => e.type === "text").map((e) => e.text);
      for (const t of texts) {
        expect(t).not.toMatch(/\d\s*\/\s*\d/); // nada tipo "2 / 5"
        expect(t).not.toMatch(/PARTE\s*0?\d/i); // nada tipo "PARTE 02"
      }
    }
  });

  it("texto branco sobre fundo sólido branco é corrigido pela ensureReadableTextLayers", () => {
    const doc: StudioDoc = {
      format: "post",
      platforms: ["instagram"],
      slides: [
        {
          bg: "#ffffff", // fundo sólido branco, sem foto
          els: [
            {
              id: "heading-1", type: "text",
              x: 24, y: 140, w: 312, h: 60,
              text: "Texto branco em fundo branco",
              fontSize: 32, color: "#ffffff",
              shadow: "0 0 4px rgba(0,0,0,0.85)", // já tem sombra — antes isso bloqueava a correção
            },
          ],
        },
      ],
      caption: "",
    } as unknown as StudioDoc;

    const fixed = ensureReadableTextLayers(doc);
    const headingAfter = fixed.slides[0].els.find((e) => e.id === "heading-1");
    // Ou a cor do texto virou escura (contraste com fundo branco), ou foi inserido overlay atrás.
    const hasOverlay = fixed.slides[0].els.some((e) => e.type === "shape" && e.id.startsWith("rb-bg-"));
    const textIsDark = headingAfter && headingAfter.color !== "#ffffff";
    expect(hasOverlay || textIsDark).toBe(true);
  });

  it("texto branco sobre FOTO (bgImage) continua confiando na sombra (não regride o comportamento de fotos)", () => {
    const doc: StudioDoc = {
      format: "post",
      platforms: ["instagram"],
      slides: [
        {
          bg: "linear-gradient(135deg, #8b5cf6, #d946ef)",
          bgImage: "https://example.com/foto.jpg",
          els: [
            {
              id: "heading-1", type: "text",
              x: 24, y: 140, w: 312, h: 60,
              text: "Texto sobre foto",
              fontSize: 32, color: "#ffffff",
              shadow: "0 0 4px rgba(0,0,0,0.85)",
            },
          ],
        },
      ],
      caption: "",
    } as unknown as StudioDoc;

    const fixed = ensureReadableTextLayers(doc);
    const headingAfter = fixed.slides[0].els.find((e) => e.id === "heading-1");
    // Continua branco, sem overlay extra — comportamento de fotos preservado.
    expect(headingAfter?.color).toBe("#ffffff");
    const hasOverlay = fixed.slides[0].els.some((e) => e.type === "shape" && e.id.startsWith("rb-bg-"));
    expect(hasOverlay).toBe(false);
  });
});
