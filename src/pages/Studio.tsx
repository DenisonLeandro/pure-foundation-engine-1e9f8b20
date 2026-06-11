import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { StudioEntry } from "@/components/studio/workspace/StudioEntry";
import { AutoStudio } from "@/components/studio/workspace/AutoStudio";
import { StudioWorkspace } from "@/components/studio/workspace/StudioWorkspace";
import { emptyDoc } from "@/components/studio/workspace/StudioProvider";
import type { StudioDoc, Slide } from "@/components/studio/workspace/types";

interface NavState {
  sourceContent?: string;
  sourceTitle?: string;
  prompt?: string;
  mediaUrls?: string[];
  scheduleAt?: string;
  // Edição vinda da Galeria:
  designDoc?: StudioDoc;
  creationId?: string;
  fallbackImageUrl?: string | null;
  fallbackImageUrls?: string[] | null;
}

function isHttpUrl(s: unknown): s is string {
  return typeof s === "string" && /^https?:\/\//i.test(s);
}

function slideHasVisual(s?: Slide): boolean {
  if (!s) return false;
  if (isHttpUrl(s.bgImage)) return true;
  return (s.els || []).some((e) => e.type === "image" && isHttpUrl(e.src));
}

/** Aplica fallback de imagem por slide (índice). Não duplica se o slide já tiver visual. */
export function ensureDocHasVisualFallbacks(doc: StudioDoc, fallbackImageUrls?: (string | null | undefined)[] | null): StudioDoc {
  const fallbacks = (fallbackImageUrls ?? []).filter(isHttpUrl);
  if (!fallbacks.length) return doc;
  const slides: Slide[] = [...(doc.slides ?? [])];

  // 1) Preenche slides existentes que não têm visual.
  for (let i = 0; i < slides.length; i++) {
    if (!slideHasVisual(slides[i]) && fallbacks[i]) {
      slides[i] = { ...slides[i], bgImage: fallbacks[i] };
    }
  }
  // 2) Cria slides extras se o fallback tiver mais imagens do que o doc.
  for (let i = slides.length; i < fallbacks.length; i++) {
    slides.push({ bg: "#0b0b0f", bgImage: fallbacks[i], els: [] });
  }
  return { ...doc, slides };
}

/** Compat: aceita uma única URL (post único). */
export function ensureDocHasVisualFallback(doc: StudioDoc, fallbackImageUrl?: string | null): StudioDoc {
  return ensureDocHasVisualFallbacks(doc, fallbackImageUrl ? [fallbackImageUrl] : null);
}

function buildInitial(nav: NavState | null): StudioDoc | undefined {
  if (!nav) return undefined;
  const fallbacks: string[] = (nav.fallbackImageUrls ?? []).filter(isHttpUrl);
  if (!fallbacks.length && isHttpUrl(nav.fallbackImageUrl)) fallbacks.push(nav.fallbackImageUrl);

  // 1) Doc editável vindo da Galeria — prioridade máxima, com fallback visual por slide.
  if (nav.designDoc && typeof nav.designDoc === "object" && Array.isArray(nav.designDoc.slides)) {
    return ensureDocHasVisualFallbacks(nav.designDoc, fallbacks);
  }
  // 2) Item antigo sem designDoc — construir doc inicial com cada imagem como fundo.
  if (fallbacks.length) {
    const isCarousel = fallbacks.length > 1;
    const base = emptyDoc(isCarousel ? "carousel" : "post", null);
    return {
      ...base,
      slides: fallbacks.map((url) => ({ bg: base.slides[0].bg, bgImage: url, els: [] })),
    };
  }
  // 3) Fluxo legado (deep-link de fonte/post).
  const has = nav.sourceContent || nav.prompt || nav.sourceTitle || (nav.mediaUrls?.length ?? 0) > 0;
  if (!has) return undefined;
  const base = emptyDoc("post", null);
  return {
    ...base,
    caption: nav.sourceContent || nav.prompt || "",
    slides: nav.mediaUrls?.length ? [{ bg: base.slides[0].bg, bgImage: nav.mediaUrls[0], els: [] }] : base.slides,
    schedule: nav.scheduleAt ? { when: "schedule", at: nav.scheduleAt } : { when: "now" },
  };
}

export default function Studio() {
  const nav = (useLocation().state as NavState | null) || null;
  const navInitial = useMemo(() => buildInitial(nav), [nav]);
  const editingCreationId = nav?.creationId;
  const fallbackImageUrl = nav?.fallbackImageUrl ?? undefined;
  const fallbackImageUrls = (nav?.fallbackImageUrls ?? []).filter(isHttpUrl);

  // Deep-link com estado abre direto no modo assistido (canvas) pré-preenchido.
  const [mode, setMode] = useState<"entry" | "auto" | "assisted">(navInitial ? "assisted" : "entry");
  const [handoffDoc, setHandoffDoc] = useState<StudioDoc | undefined>(undefined);

  const back = () => { setHandoffDoc(undefined); setMode("entry"); };

  if (mode === "entry") {
    return <StudioEntry onPick={setMode} />;
  }

  if (mode === "auto") {
    return (
      <AutoStudio
        onBack={back}
        onEditInCanvas={(d) => { setHandoffDoc(d); setMode("assisted"); }}
      />
    );
  }

  // assisted — full-bleed (cancela o padding do AppLayout)
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <StudioWorkspace
        initial={handoffDoc ?? navInitial}
        onBack={back}
        editingCreationId={editingCreationId}
        fallbackImageUrl={fallbackImageUrl}
        fallbackImageUrls={fallbackImageUrls}
      />
    </div>
  );
}
