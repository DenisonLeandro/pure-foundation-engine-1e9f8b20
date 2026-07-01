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
  imageUrls: string[],
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
    imageUrls.push(slide.bgImage);
    // html2canvas não respeita `object-fit` em <img> de forma confiável (estica
    // em vez de cortar preservando proporção). background-image + background-size
    // é o caminho que a biblioteca renderiza corretamente.
    const bg = document.createElement("div");
    applyStyle(bg, {
      position: "absolute",
      inset: "0",
      backgroundImage: `url("${slide.bgImage}")`,
      backgroundSize: slide.bgFit === "contain" ? "contain" : "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    });
    node.appendChild(bg);
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
        imageUrls.push(e.src);
        // Mesmo motivo do fundo: background-image em vez de <img>+object-fit
        // pro html2canvas cortar preservando proporção em vez de esticar.
        const img = document.createElement("div");
        applyStyle(img, {
          width: "100%",
          height: "100%",
          backgroundImage: `url("${e.src}")`,
          backgroundSize: e.objectFit === "contain" ? "contain" : "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
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
    imageUrls.push(brand.logo_url);
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
    // background-image em vez de <img>+object-fit — mesmo motivo do fundo/imagens.
    const logo = document.createElement("div");
    applyStyle(logo, {
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      backgroundImage: `url("${brand.logo_url}")`,
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
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

/**
 * Pré-carrega as URLs usadas via background-image (fundo, imagens soltas, logo).
 * Como não são mais tags <img>, não dá pra checar `.complete` no DOM — carrega
 * cada URL num Image() à parte pra garantir que já estão no cache do navegador
 * antes do html2canvas desenhar o background-image correspondente.
 */
async function preloadImages(urls: string[]): Promise<void> {
  await Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          img.src = src;
          if (img.complete) done();
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
      const imageUrls: string[] = [];
      const node = buildSlideNode(slide, canvas.width, canvas.height, brand, doc.format, imageUrls);
      await preloadImages(imageUrls);
      container.appendChild(node);
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
