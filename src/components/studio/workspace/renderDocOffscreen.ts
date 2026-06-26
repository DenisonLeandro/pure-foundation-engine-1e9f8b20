/**
 * Renderer offscreen — produz as imagens FINAIS de um StudioDoc usando o MESMO
 * DOM do editor (DesignCanvas) + html2canvas. Garante que a imagem salva na
 * Galeria seja idêntica ao que o editor mostra ao reabrir o design_doc.
 *
 * Crítico: NÃO usar composeSlideWithText (canvas API com Inter rasterizado),
 * pois ele produz arte diferente da renderizada pelo editor — fonte do
 * mismatch Galeria ↔ Editor.
 */

import type { StudioDoc, Slide } from "./types";
import { getCanvasSize, getExportSize } from "./types";

export interface RenderBrand {
  logo_url?: string | null;
  handle?: string | null;
  name?: string | null;
  colors?: string[] | null;
}

function applyStyle(el: HTMLElement, css: Record<string, string | number | undefined>) {
  for (const [k, v] of Object.entries(css)) {
    if (v === undefined || v === null || v === "") continue;
    (el.style as unknown as Record<string, string>)[k] = String(v);
  }
}

function buildSlideNode(
  slide: Slide,
  canvasW: number,
  canvasH: number,
  brand: RenderBrand | null,
  format: string,
): HTMLElement {
  const node = document.createElement("div");
  const accent = brand?.colors?.[2] || "#ffffff";
  const useBg = !slide.bgImage || slide.bgFit === "contain";
  applyStyle(node, {
    position: "relative",
    overflow: "hidden",
    borderRadius: "12px",
    width: `${canvasW}px`,
    height: `${canvasH}px`,
    background: useBg ? (slide.bg || "#0b0b0f") : "transparent",
  });

  if (slide.bgImage) {
    const img = document.createElement("img");
    img.src = slide.bgImage;
    img.crossOrigin = "anonymous";
    applyStyle(img, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      objectFit: slide.bgFit ?? "cover",
    });
    node.appendChild(img);
  }

  for (const e of slide.els) {
    const wrap = document.createElement("div");
    applyStyle(wrap, {
      position: "absolute",
      left: `${e.x}px`,
      top: `${e.y}px`,
      width: `${e.w}px`,
      height: `${e.h}px`,
      transform: e.rotation ? `rotate(${e.rotation}deg)` : undefined,
      zIndex: e.zIndex !== undefined ? String(e.zIndex) : undefined,
    });

    if (e.type === "text") {
      const span = document.createElement("span");
      span.textContent = e.text || "";
      applyStyle(span, {
        display: "block",
        width: "100%",
        whiteSpace: "pre-wrap",
        fontSize: e.fontSize ? `${e.fontSize}px` : undefined,
        fontFamily: e.fontFamily,
        color: e.color || "#ffffff",
        fontWeight: e.weight ? String(e.weight) : undefined,
        textAlign: e.align || "left",
        lineHeight: e.lineHeight !== undefined ? String(e.lineHeight) : "1.15",
        letterSpacing: e.letterSpacing ? `${e.letterSpacing}px` : undefined,
        textShadow: e.shadow,
        WebkitTextStroke: e.stroke ? `${e.strokeWidth ?? 1}px ${e.stroke}` : undefined,
        opacity: e.opacity !== undefined ? String(e.opacity) : undefined,
      });
      wrap.appendChild(span);
    } else if (e.type === "image") {
      if (e.src) {
        const img = document.createElement("img");
        img.src = e.src;
        img.crossOrigin = "anonymous";
        applyStyle(img, {
          width: "100%",
          height: "100%",
          objectFit: e.objectFit ?? "cover",
          borderRadius: e.radius ? `${e.radius}px` : undefined,
          opacity: e.opacity !== undefined ? String(e.opacity) : undefined,
        });
        wrap.appendChild(img);
      }
    } else if (e.type === "shape") {
      const sh = document.createElement("div");
      applyStyle(sh, {
        width: "100%",
        height: "100%",
        background: e.bg,
        borderRadius: e.radius ? `${e.radius}px` : undefined,
        opacity: e.opacity !== undefined ? String(e.opacity) : undefined,
      });
      wrap.appendChild(sh);
    }

    node.appendChild(wrap);
  }

  // logo da marca: selo discreto no canto superior esquerdo, em TODOS os slides
  // (com ou sem foto de fundo) — fundo translúcido + borda sutil pra ficar
  // legível mesmo sobre fotos claras ou escuras.
  if (brand?.logo_url) {
    const badge = document.createElement("div");
    applyStyle(badge, {
      position: "absolute",
      left: "12px",
      top: "12px",
      width: "42px",
      height: "42px",
      borderRadius: "12px",
      background: "rgba(10,12,20,0.45)",
      border: "1px solid rgba(255,255,255,0.4)",
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(2px)",
    });
    const logo = document.createElement("img");
    logo.src = brand.logo_url;
    logo.crossOrigin = "anonymous";
    applyStyle(logo, {
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      objectFit: "contain",
    });
    badge.appendChild(logo);
    node.appendChild(badge);
  }

  // handle/nome da marca: mantém regra antiga (só em slides "chapados")
  if (!slide.bgImage && format !== "card") {
    if (brand?.handle || brand?.name) {
      const handle = document.createElement("div");
      handle.textContent = brand.handle || brand.name || "";
      applyStyle(handle, {
        position: "absolute",
        bottom: "12px",
        left: "12px",
        fontSize: "11px",
        fontWeight: "500",
        color: accent,
        opacity: "0.92",
      });
      node.appendChild(handle);
    }
  }

  return node;
}

async function waitForImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
            // safety timeout
            setTimeout(done, 8000);
          }),
    ),
  );
}

/**
 * Renderiza cada slide do doc como PNG dataURL, usando o mesmo DOM/CSS do editor.
 * Retorna lista de dataURLs (uma por slide). Para format="video" devolve [].
 */
export async function renderDocOffscreen(doc: StudioDoc, brand: RenderBrand | null): Promise<string[]> {
  if (doc.format === "video") return [];
  const { default: html2canvas } = await import("html2canvas");
  const canvas = getCanvasSize(doc);
  const exportSize = getExportSize(doc);

  const container = document.createElement("div");
  applyStyle(container, {
    position: "fixed",
    left: "-99999px",
    top: "0",
    pointerEvents: "none",
    opacity: "0",
    zIndex: "-1",
  });
  document.body.appendChild(container);
  if (document.fonts?.ready) await document.fonts.ready.catch(() => {});

  const urls: string[] = [];
  try {
    for (const slide of doc.slides) {
      const node = buildSlideNode(slide, canvas.width, canvas.height, brand, doc.format);
      container.appendChild(node);
      await waitForImages(node);
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)));
      try {
        const rendered = await html2canvas(node, {
          useCORS: true,
          backgroundColor: null,
          width: canvas.width,
          height: canvas.height,
          windowWidth: canvas.width,
          windowHeight: canvas.height,
          scale: exportSize.scale,
        });
        if (rendered.width && rendered.height) {
          const url = rendered.toDataURL("image/png");
          if (url && url.length > 100) urls.push(url);
        }
      } catch (err) {
        console.warn("[renderDocOffscreen] slide falhou:", err);
      }
      container.removeChild(node);
    }
  } finally {
    if (container.parentNode) container.parentNode.removeChild(container);
  }
  return urls;
}
