import { useEffect, useRef, useState, useCallback } from "react";
import {
  Type, Image as ImageIcon, Square, Plus, Copy, Trash2, ChevronLeft, ChevronRight, Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrands } from "@/hooks/use-brands";
import { useStudio, blankSlide } from "./StudioProvider";
import { CANVAS_W, CANVAS_H, getCanvasSize, getExportSize, uid, type El, type Slide } from "./types";

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head)?.[1] || "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
export { dataUrlToBlob };

export function DesignCanvas() {
  const {
    doc, slide, currentSlide, selectedElId, set, setSlides, patchSlide, patchEl,
    addEl, delEl, pushHistory, select, setCurrentSlide, registerExporter,
  } = useStudio();
  const { brands } = useBrands();
  const brand = brands.find((b) => b.id === doc.brandId) || null;
  const c1 = brand?.colors?.[0] || "#8b5cf6";
  const c2 = brand?.colors?.[1] || "#d946ef";
  const accent = brand?.colors?.[2] || "#ffffff";
  const canvas = getCanvasSize(doc);
  const exportSize = getExportSize(doc);
  const staticFallback = doc.canvas?.source === "fallback" && doc.slides.every((s) => (s.els?.length ?? 0) === 0 && !!s.bgImage);

  const [exporting, setExporting] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef<{ id: string; sx: number; sy: number; ex: number; ey: number } | null>(null);

  const isCarousel = doc.format === "carousel";
  const isVideo = doc.format === "video";

  // ── drag move ──
  useEffect(() => {
    const move = (ev: MouseEvent) => {
      if (!drag.current) return;
      const d = drag.current;
      patchEl(d.id, { x: Math.round(d.ex + (ev.clientX - d.sx)), y: Math.round(d.ey + (ev.clientY - d.sy)) }, false);
    };
    const up = () => { drag.current = null; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [patchEl]);

  // ── delete selected element via keyboard ──
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Delete" && ev.key !== "Backspace") return;
      const target = ev.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (selectedElId) {
        ev.preventDefault();
        delEl(selectedElId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedElId, delEl]);

  const startDrag = (ev: React.MouseEvent, e: El) => {
    ev.stopPropagation();
    select(e.id);
    pushHistory();
    drag.current = { id: e.id, sx: ev.clientX, sy: ev.clientY, ex: e.x, ey: e.y };
  };

  // ── export (registra no provider) ──
  const exporter = useCallback(async (): Promise<string[]> => {
    if (isVideo) return doc.videoUrl ? [doc.videoUrl] : [];
    const { default: html2canvas } = await import("html2canvas"); // carregado sob demanda
    setExporting(true);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 80)));
    const urls: string[] = [];
    try {
      for (let i = 0; i < (slideRefs.current.length || 0); i++) {
        const node = slideRefs.current[i];
        if (!node) continue;
        // IMPORTANTE: width/height aqui são em CSS px (tamanho do nó),
        // não o tamanho de saída. O tamanho final do PNG = width*scale × height*scale.
        // Antes passávamos EXPORT_W/EXPORT_H como width/height, o que fazia o
        // html2canvas recortar uma área 1080×1350 CSS do nó (que tem só 360×450),
        // gerando um PNG enorme com a arte pequena no canto superior esquerdo.
        const rendered = await html2canvas(node, {
          useCORS: true,
          backgroundColor: null,
          width: canvas.width,
          height: canvas.height,
          windowWidth: canvas.width,
          windowHeight: canvas.height,
          scale: exportSize.scale,
        });
        // Validação: descarta export quebrado (canvas vazio / dimensão inesperada).
        if (!rendered.width || !rendered.height) continue;
        const url = rendered.toDataURL("image/png");
        if (url && url.length > 100) urls.push(url);
      }
    } finally {
      setExporting(false);
    }
    return urls;
  }, [isVideo, doc.videoUrl, canvas.width, canvas.height, exportSize.scale]);

  useEffect(() => {
    registerExporter(exporter);
    return () => registerExporter(null);
  }, [exporter, registerExporter]);

  // ── slide ops ──
  const addSlide = () => { setSlides([...doc.slides, blankSlide(c1, c2, accent)]); setCurrentSlide(doc.slides.length); };
  const dupSlide = () => {
    const copy: Slide = JSON.parse(JSON.stringify(doc.slides[currentSlide]));
    copy.els = copy.els.map((e) => ({ ...e, id: uid() }));
    setSlides([...doc.slides.slice(0, currentSlide + 1), copy, ...doc.slides.slice(currentSlide + 1)]);
    setCurrentSlide(currentSlide + 1);
  };
  const delSlide = () => {
    if (doc.slides.length === 1) return;
    setSlides(doc.slides.filter((_, i) => i !== currentSlide));
    setCurrentSlide(Math.max(0, currentSlide - 1));
  };

  const addElement = (type: El["type"]) => {
    const base: El = type === "text"
      ? { id: uid(), type, x: 40, y: 180, w: 320, h: 70, text: "Novo texto", fontSize: 24, color: accent, weight: 600, align: "left" }
      : type === "image"
      ? { id: uid(), type, x: 130, y: 130, w: 140, h: 140, src: "", radius: 12 }
      : { id: uid(), type, x: 130, y: 150, w: 140, h: 100, bg: accent, radius: 12, opacity: 1 };
    addEl(base);
  };

  // ── Temas NÃO destrutivos ──
  // Regras:
  //   • NUNCA remover slide.bgImage (foto de fundo).
  //   • NUNCA apagar elementos (textos, imagens, formas).
  //   • Quando há bgImage: aplicar apenas overlay/ajuste de cor de texto.
  //   • Quando não há bgImage: pode trocar a cor sólida/gradiente do bg.
  // Overlay de tema usa um id prefixado para poder ser substituído/removido
  // sem afetar shapes criados pelo usuário.
  const THEME_OVERLAY_PREFIX = "__themeOverlay";
  const PRESETS = [
    { name: "Clean", theme: "clean" as const },
    { name: "Dark", theme: "dark" as const },
    { name: "Marca", theme: "marca" as const },
  ];

  const applyTheme = (theme: "clean" | "dark" | "marca") => {
    const hadBgImage = !!slide.bgImage;
    // remove overlays de tema anteriores (mantém shapes do usuário intactas)
    let els: El[] = slide.els.filter((e) => !e.id.startsWith(THEME_OVERLAY_PREFIX));
    const patch: Partial<Slide> = {};

    if (theme === "clean") {
      if (!hadBgImage) {
        patch.bg = "#ffffff";
        els = els.map((e) => (e.type === "text" ? { ...e, color: "#111111" } : e));
      }
      // com bgImage: só limpamos overlays escuros — mantém imagem e textos.
    } else if (theme === "dark") {
      if (hadBgImage) {
        const overlay: El = {
          id: `${THEME_OVERLAY_PREFIX}_${uid()}`,
          type: "shape",
          x: 0, y: 0, w: canvas.width, h: canvas.height,
          bg: "#000000", radius: 0, opacity: 0.35,
        };
        els = [overlay, ...els];
        els = els.map((e) => (e.type === "text" ? { ...e, color: "#ffffff" } : e));
      } else {
        patch.bg = "#0b0b12";
        els = els.map((e) => (e.type === "text" ? { ...e, color: "#ffffff" } : e));
      }
    } else {
      // marca
      if (!hadBgImage) {
        patch.bg = `linear-gradient(135deg, ${c1}, ${c2})`;
      }
      els = els.map((e) => (e.type === "text" ? { ...e, color: accent } : e));
    }

    patch.els = els;
    patchSlide(currentSlide, patch);
  };

  // ── render ──
  if (isVideo) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        {doc.videoUrl ? (
          <video src={doc.videoUrl} controls className="max-h-full max-w-full rounded-xl border border-border shadow-lg" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
            <Film className="h-12 w-12 opacity-40" />
            <p className="max-w-xs text-sm">Use o copiloto à direita para gerar um vídeo (Higgsfield) com a marca.</p>
          </div>
        )}
      </div>
    );
  }

  const renderSlide = (s: Slide, i: number, exportMode: boolean) => (
    <div
      key={i}
      ref={(el) => { slideRefs.current[i] = el; }}
      onMouseDown={() => select(null)}
      className={`relative overflow-hidden rounded-xl ${exportMode ? "absolute left-0 top-0" : "shadow-lg"}`}
      style={{
        width: canvas.width, height: canvas.height,
        background: s.bgImage && s.bgFit !== "contain" ? undefined : s.bg,
        display: exportMode ? "block" : i === currentSlide ? "block" : "none",
      }}
    >
      {s.bgImage && <img src={s.bgImage} crossOrigin="anonymous" alt="" className="absolute inset-0 h-full w-full" style={{ objectFit: s.bgFit ?? "cover" }} />}
      {s.els.map((e) => (
        <div
          key={e.id}
          onMouseDown={(ev) => !exportMode && startDrag(ev, e)}
          className={`absolute ${exportMode ? "" : "cursor-move"} ${!exportMode && selectedElId === e.id ? "ring-2 ring-violet-400" : ""}`}
          style={{ left: e.x, top: e.y, width: e.w, height: e.h, transform: e.rotation ? `rotate(${e.rotation}deg)` : undefined, zIndex: e.zIndex }}
        >
          {e.type === "text" && (
            <span style={{ fontSize: e.fontSize, fontFamily: e.fontFamily, color: e.color, fontWeight: e.weight, textAlign: e.align, display: "block", width: "100%", lineHeight: e.lineHeight ?? 1.15, letterSpacing: e.letterSpacing, textShadow: e.shadow, WebkitTextStroke: e.stroke ? `${e.strokeWidth ?? 1}px ${e.stroke}` : undefined, whiteSpace: "pre-wrap", opacity: e.opacity }}>{e.text}</span>
          )}
          {e.type === "image" && (e.src
            ? <img src={e.src} crossOrigin="anonymous" alt="" style={{ width: "100%", height: "100%", objectFit: e.objectFit ?? "cover", borderRadius: e.radius, opacity: e.opacity }} />
            : <div className="flex h-full w-full items-center justify-center rounded bg-black/20 text-[10px] text-white/70">imagem</div>)}
          {e.type === "shape" && <div style={{ width: "100%", height: "100%", background: e.bg, borderRadius: e.radius, opacity: e.opacity }} />}
        </div>
      ))}
      {/* marca: logo + handle — só em slides "chapados" (sem arte de fundo) e fora do card,
          pra não duplicar a marca em imagens já desenhadas (arte/auto/gpt-image-2). */}
      {!s.bgImage && doc.format !== "card" && (
        <>
          {brand?.logo_url && <img src={brand.logo_url} crossOrigin="anonymous" alt="" className="absolute left-3 top-3 h-6 w-6 rounded object-cover" />}
          {(brand?.handle || brand?.name) && (
            <div className="absolute bottom-3 left-3 text-[11px] font-medium" style={{ color: accent, opacity: 0.92 }}>{brand?.handle || brand?.name}</div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col items-center gap-4 overflow-auto p-6">
      {staticFallback && (
        <p className="text-xs text-muted-foreground">Este post antigo não possui camadas editáveis. Ele será aberto como imagem final.</p>
      )}
      {!staticFallback && <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">Tema:</span>
        {PRESETS.map((p) => (
          <Button key={p.name} variant="outline" size="sm" className="h-7 text-xs" onClick={() => applyTheme(p.theme)}>{p.name}</Button>
        ))}
        <span className="mx-1 text-border">|</span>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addElement("text")}><Type className="mr-1 h-3.5 w-3.5" />Texto</Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addElement("image")}><ImageIcon className="mr-1 h-3.5 w-3.5" />Imagem</Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addElement("shape")}><Square className="mr-1 h-3.5 w-3.5" />Forma</Button>
      </div>}

      {/* canvas */}
      <div className="relative" style={{ width: canvas.width, height: canvas.height }}>
        {doc.slides.map((s, i) => renderSlide(s, i, exporting))}
        {selectedElId && !exporting && (
          <div className="absolute -bottom-9 left-0 right-0 flex justify-center">
            <Button
              variant="destructive"
              size="sm"
              className="h-7 gap-1 rounded-full px-3 text-xs shadow-md"
              onClick={() => { if (selectedElId) delEl(selectedElId); }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Apagar
            </Button>
          </div>
        )}
      </div>

      {/* carousel nav */}
      {isCarousel && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-xs text-muted-foreground">{currentSlide + 1}/{doc.slides.length}</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentSlide(Math.min(doc.slides.length - 1, currentSlide + 1))} disabled={currentSlide === doc.slides.length - 1}><ChevronRight className="h-4 w-4" /></Button>
          <span className="mx-1 text-border">|</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addSlide} title="Novo slide"><Plus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={dupSlide} title="Duplicar"><Copy className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={delSlide} disabled={doc.slides.length === 1} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
