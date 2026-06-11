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
}

function isHttpUrl(s: unknown): s is string {
  return typeof s === "string" && /^https?:\/\//i.test(s);
}

function slideHasVisual(s?: Slide): boolean {
  if (!s) return false;
  if (isHttpUrl(s.bgImage)) return true;
  return (s.els || []).some((e) => e.type === "image" && isHttpUrl(e.src));
}

export function ensureDocHasVisualFallback(doc: StudioDoc, fallbackImageUrl?: string | null): StudioDoc {
  if (!isHttpUrl(fallbackImageUrl)) return doc;
  const slides = [...(doc.slides ?? [])];
  if (!slides.length) slides.push({ bg: "#0b0b0f", els: [] });
  if (!slideHasVisual(slides[0])) {
    slides[0] = { ...slides[0], bgImage: fallbackImageUrl };
  }
  return { ...doc, slides };
}

function buildInitial(nav: NavState | null): StudioDoc | undefined {
  if (!nav) return undefined;
  // 1) Doc editável vindo da Galeria — prioridade máxima, com fallback visual.
  if (nav.designDoc && typeof nav.designDoc === "object" && Array.isArray(nav.designDoc.slides)) {
    return ensureDocHasVisualFallback(nav.designDoc, nav.fallbackImageUrl);
  }
  // 2) Item antigo sem designDoc — construir doc inicial usando a imagem como fundo.
  if (nav.fallbackImageUrl) {
    const base = emptyDoc("post", null);
    return {
      ...base,
      slides: [{ bg: base.slides[0].bg, bgImage: nav.fallbackImageUrl, els: [] }],
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
      />
    </div>
  );
}
