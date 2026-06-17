import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { StudioEntry } from "@/components/studio/workspace/StudioEntry";
import { AutoStudio } from "@/components/studio/workspace/AutoStudio";
import { StudioWorkspace } from "@/components/studio/workspace/StudioWorkspace";
import { emptyDoc } from "@/components/studio/workspace/StudioProvider";
import { loadLatestStudioDraft, loadStudioFlowDraft, type StudioDraft, type StudioFlowDraft } from "@/components/studio/workspace/studioDraft";
import { useAuth } from "@/contexts/AuthContext";
import { CANVAS_H, CANVAS_W, type StudioDoc, type Slide, type El } from "@/components/studio/workspace/types";

type ImageMeta = { width: number; height: number };
const fallbackCanvas = { width: CANVAS_W, height: CANVAS_H, aspectRatio: CANVAS_W / CANVAS_H, source: "fallback" as const };

interface NavState {
  /** "edit" força o Studio a abrir o post existente (sem rascunho, sem tela inicial). */
  mode?: "edit" | "new";
  sourceContent?: string;
  sourceTitle?: string;
  prompt?: string;
  mediaUrls?: string[];
  scheduleAt?: string;
  // Edição vinda da Galeria:
  designDoc?: StudioDoc | null;
  creationId?: string;
  fallbackImageUrl?: string | null;
  fallbackImageUrls?: string[] | null;
  finalImageUrls?: string[] | null;
  finalImageMeta?: (ImageMeta | null)[] | null;
  slideIndex?: number;
  selectedSlideIndex?: number;
  thumbnailUrl?: string | null;
  title?: string | null;
  /** Rota para a qual "Salvar e voltar" / "Voltar para Galeria" deve navegar. */
  returnTo?: string;
  /** Legenda persistida na Galeria — sobrescreve doc.caption ao abrir. */
  caption?: string | null;
}

function isHttpUrl(s: unknown): s is string {
  return typeof s === "string" && /^https?:\/\//i.test(s);
}

function slideHasVisual(s?: Slide): boolean {
  if (!s) return false;
  if (isHttpUrl(s.bgImage)) return true;
  return (s.els || []).some((e) => e.type === "image" && isHttpUrl(e.src));
}

function canvasFromImageMeta(meta?: ImageMeta | null, source: "designDoc" | "fallback" = "fallback") {
  if (!meta?.width || !meta?.height) return undefined;
  const ratio = meta.width / meta.height;
  if (!Number.isFinite(ratio) || ratio <= 0) return undefined;
  const width = 360;
  const height = Math.max(180, Math.round(width / ratio));
  return { width, height, aspectRatio: ratio, source };
}

function hasValidDesignDoc(doc: NavState["designDoc"]): doc is StudioDoc {
  return !!doc && typeof doc === "object" && Array.isArray(doc.slides) && doc.slides.length > 0
    && doc.slides.every((s) => s && typeof s === "object" && Array.isArray((s as Slide).els));
}

/** Reescala um elemento de um canvas autorado para um canvas alvo. */
function rescaleEl(el: El, sx: number, sy: number): El {
  const s = Math.min(sx, sy); // escala uniforme p/ tipografia/raio (não distorce)
  return {
    ...el,
    x: Math.round(el.x * sx),
    y: Math.round(el.y * sy),
    w: Math.round(el.w * sx),
    h: Math.round(el.h * sy),
    fontSize: typeof el.fontSize === "number" ? Math.max(6, Math.round(el.fontSize * s)) : el.fontSize,
    letterSpacing: typeof el.letterSpacing === "number" ? el.letterSpacing * s : el.letterSpacing,
    strokeWidth: typeof el.strokeWidth === "number" ? el.strokeWidth * s : el.strokeWidth,
    radius: typeof el.radius === "number" ? Math.round(el.radius * s) : el.radius,
  };
}

function prepareDesignDocForEdit(nav: NavState, doc: StudioDoc): StudioDoc {
  const firstMeta = nav.finalImageMeta?.[0] ?? null;
  const finalUrls = (nav.finalImageUrls ?? []).filter(isHttpUrl);

  // 1) Canvas alvo: prioriza aspect ratio da imagem final salva (Galeria),
  //    senão o canvas salvo do doc, senão fallback 4:5.
  const targetCanvas =
    canvasFromImageMeta(firstMeta, "designDoc") ??
    (doc.canvas ? { ...doc.canvas, source: "designDoc" as const } : { ...fallbackCanvas, source: "designDoc" as const });

  // 2) Canvas autorado: registrado no save (authoredCanvas) ou doc.canvas legado ou fallback.
  const authored = doc.authoredCanvas ?? (doc.canvas ? { width: doc.canvas.width, height: doc.canvas.height } : { width: CANVAS_W, height: CANVAS_H });
  const sx = targetCanvas.width / Math.max(1, authored.width);
  const sy = targetCanvas.height / Math.max(1, authored.height);
  const needsRescale = Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001;

  // 3) Reescala todos os elementos + cola imagem final como bgImage do slide,
  //    garantindo identidade visual com a Galeria.
  const slides: Slide[] = (doc.slides ?? []).map((s, i) => {
    const els = needsRescale ? (s.els ?? []).map((e) => rescaleEl(e, sx, sy)) : (s.els ?? []);
    const bgImage = finalUrls[i] ?? s.bgImage;
    return {
      ...s,
      els,
      bgImage,
      bgFit: bgImage === finalUrls[i] ? "cover" : (s.bgFit ?? "cover"),
    };
  });

  return {
    ...doc,
    canvas: targetCanvas,
    authoredCanvas: { width: targetCanvas.width, height: targetCanvas.height },
    slides,
    caption: typeof nav.caption === "string" ? nav.caption : doc.caption,
  };
}

function buildStaticFallbackDoc(nav: NavState, urls: string[]): StudioDoc {
  const isCarousel = urls.length > 1;
  const base = emptyDoc(isCarousel ? "carousel" : "post", null);
  const firstMeta = nav.finalImageMeta?.[0] ?? null;
  return {
    ...base,
    canvas: canvasFromImageMeta(firstMeta, "fallback") ?? fallbackCanvas,
    slides: urls.map((url) => ({ bg: "#0b0b0f", bgImage: url, bgFit: "contain", els: [] })),
    caption: typeof nav.caption === "string" ? nav.caption : base.caption,
  };
}

/** Aplica fallback de imagem por slide (índice). Não duplica se o slide já tiver visual. */
export function ensureDocHasVisualFallbacks(doc: StudioDoc, fallbackImageUrls?: (string | null | undefined)[] | null): StudioDoc {
  const fallbacks = (fallbackImageUrls ?? []).filter(isHttpUrl);
  if (!fallbacks.length) return doc;
  const slides: Slide[] = [...(doc.slides ?? [])];

  // 1) Preenche slides existentes que não têm visual.
  for (let i = 0; i < slides.length; i++) {
    if (!slideHasVisual(slides[i]) && fallbacks[i]) {
      slides[i] = { ...slides[i], bgImage: fallbacks[i], bgFit: "contain" };
    }
  }
  // 2) Cria slides extras se o fallback tiver mais imagens do que o doc.
  for (let i = slides.length; i < fallbacks.length; i++) {
    slides.push({ bg: "#0b0b0f", bgImage: fallbacks[i], bgFit: "contain", els: [] });
  }
  return { ...doc, slides };
}

/** Compat: aceita uma única URL (post único). */
export function ensureDocHasVisualFallback(doc: StudioDoc, fallbackImageUrl?: string | null): StudioDoc {
  return ensureDocHasVisualFallbacks(doc, fallbackImageUrl ? [fallbackImageUrl] : null);
}

function buildInitial(nav: NavState | null): StudioDoc | undefined {
  if (!nav) return undefined;
  const finalUrls = (nav.finalImageUrls ?? []).filter(isHttpUrl);
  const fallbacks: string[] = (nav.fallbackImageUrls ?? []).filter(isHttpUrl);
  if (!fallbacks.length && isHttpUrl(nav.fallbackImageUrl)) fallbacks.push(nav.fallbackImageUrl);
  const isEdit = nav.mode === "edit" || !!nav.creationId;

  // 1) Doc editável vindo da Galeria — usa EXATAMENTE como salvo.
  //    A imagem final salva fica só como referência/fallback; NÃO substitui camadas.
  if (isEdit && hasValidDesignDoc(nav.designDoc)) {
    return prepareDesignDocForEdit(nav, nav.designDoc);
  }
  if (!isEdit && hasValidDesignDoc(nav.designDoc)) {
    return prepareDesignDocForEdit(nav, nav.designDoc);
  }
  // 2) Item antigo sem designDoc válido — abrir imagem final como fallback estático.
  if (isEdit && (finalUrls.length || fallbacks.length)) {
    return buildStaticFallbackDoc(nav, finalUrls.length ? finalUrls : fallbacks);
  }
  // 3) Edição sem designDoc nem imagens — ainda assim NÃO mostrar tela inicial.
  //    Abre um doc vazio editável vinculado ao creationId.
  if (isEdit) {
    const base = emptyDoc("post", null);
    return typeof nav.caption === "string" ? { ...base, canvas: fallbackCanvas, caption: nav.caption } : { ...base, canvas: fallbackCanvas };
  }
  // 4) Fluxo legado (deep-link de fonte/post).
  const has = nav.sourceContent || nav.prompt || nav.sourceTitle || (nav.mediaUrls?.length ?? 0) > 0;
  if (!has) return undefined;
  const base = emptyDoc("post", null);
  return {
    ...base,
    caption: (typeof nav.caption === "string" && nav.caption) || nav.sourceContent || nav.prompt || "",
    slides: nav.mediaUrls?.length ? [{ bg: base.slides[0].bg, bgImage: nav.mediaUrls[0], els: [] }] : base.slides,
    schedule: nav.scheduleAt ? { when: "schedule", at: nav.scheduleAt } : { when: "now" },
  };
}

export default function Studio() {
  const nav = (useLocation().state as NavState | null) || null;
  const { user } = useAuth();
  const userId = user?.id;
  const navInitial = useMemo(() => buildInitial(nav), [nav]);

  useEffect(() => {
    if (!nav) return;
    const isEdit = nav.mode === "edit" || !!nav.creationId;
    if (!isEdit) return;
    const hasDoc = hasValidDesignDoc(nav.designDoc);
    const slides = hasDoc && Array.isArray((nav.designDoc as { slides?: unknown[] }).slides)
      ? (nav.designDoc as { slides: unknown[] }).slides.length : 0;
    const authored = hasDoc ? (nav.designDoc as StudioDoc).authoredCanvas ?? (nav.designDoc as StudioDoc).canvas ?? null : null;
    console.info("[studio:open]", {
      mode: "edit",
      creationId: nav.creationId,
      loadedFrom: hasDoc ? "designDoc" : (nav.finalImageUrls?.length || nav.fallbackImageUrls?.length || nav.fallbackImageUrl ? "finalImageFallback" : "fallback"),
      slides,
      targetCanvas: navInitial?.canvas ? `${navInitial.canvas.width}x${navInitial.canvas.height}` : "360x450",
      authoredCanvas: authored ? `${authored.width}x${authored.height}` : null,
      imageAspectRatio: nav.finalImageMeta?.[0] ? `${nav.finalImageMeta[0].width}x${nav.finalImageMeta[0].height}` : null,
      bgImageApplied: !!(nav.finalImageUrls?.length),
      ignoredLocalDraft: true,
    });
  }, [nav, navInitial]);

  // Rascunho local recuperado (quando não veio nada via navigation state).
  const [draft, setDraft] = useState<StudioDraft | null>(null);
  const [flowDraft, setFlowDraft] = useState<StudioFlowDraft | null>(null);
  const restoreTried = useRef(false);

  // Edição vinda da Galeria força modo assistido e bloqueia restauração de rascunho.
  const isEditFromGallery = nav?.mode === "edit" || !!nav?.creationId;

  // Deep-link com estado abre direto no modo assistido (canvas) pré-preenchido.
  const [mode, setMode] = useState<"entry" | "auto" | "assisted">(
    isEditFromGallery || navInitial ? "assisted" : "entry"
  );
  const [handoffDoc, setHandoffDoc] = useState<StudioDoc | undefined>(undefined);

  // Restaura rascunho local ao abrir o Studio sem state — uma única vez, antes de o canvas montar.
  useEffect(() => {
    if (restoreTried.current || navInitial || !userId) return;
    // Em modo edição (vindo da Galeria), nunca restaurar rascunho local.
    if (isEditFromGallery) { restoreTried.current = true; return; }
    if (mode !== "entry") { restoreTried.current = true; return; }
    restoreTried.current = true;

    // 1) Fluxo (mode "auto" do Criar com IA) tem prioridade sobre rascunho de editor.
    const flow = loadStudioFlowDraft(userId);
    if (flow?.mode === "auto") {
      setFlowDraft(flow);
      setMode("auto");
      toast.message("Rascunho do Studio recuperado.");
      return;
    }

    // 2) Rascunho do editor (assisted) com doc preservado.
    const d = loadLatestStudioDraft(userId);
    if (d) {
      setDraft(d);
      setMode("assisted");
      toast.message("Rascunho recuperado automaticamente.");
    }
  }, [userId, navInitial, mode, isEditFromGallery]);

  const draftInitial = useMemo(
    () => (draft ? ensureDocHasVisualFallbacks(draft.doc, draft.fallbackImageUrls) : undefined),
    [draft]
  );

  // Prioridade: navigation state > rascunho local.
  const editingCreationId = nav?.creationId ?? (navInitial ? undefined : draft?.creationId);
  const fallbackImageUrl = nav?.fallbackImageUrl ?? undefined;
  const fallbackImageUrls = navInitial
    ? (nav?.fallbackImageUrls ?? []).filter(isHttpUrl)
    : (draft?.fallbackImageUrls ?? []).filter(isHttpUrl);

  const back = () => { setHandoffDoc(undefined); setFlowDraft(null); setMode("entry"); };
  // Após descartar o rascunho, volta para a entrada com o Studio limpo.
  const handleDraftDiscarded = () => { setDraft(null); setFlowDraft(null); setHandoffDoc(undefined); setMode("entry"); };

  if (mode === "entry") {
    return <StudioEntry onPick={setMode} />;
  }

  if (mode === "auto") {
    return (
      <AutoStudio
        onBack={back}
        onEditInCanvas={(d) => { setHandoffDoc(d); setMode("assisted"); }}
        initialForm={flowDraft?.autoForm}
        initialDoc={flowDraft?.autoDoc}
      />
    );
  }

  // assisted — full-bleed (cancela o padding do AppLayout)
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <StudioWorkspace
        initial={handoffDoc ?? navInitial ?? draftInitial}
        onBack={back}
        editingCreationId={editingCreationId}
        fallbackImageUrl={fallbackImageUrl}
        fallbackImageUrls={fallbackImageUrls}
        draftUserId={isEditFromGallery ? undefined : userId}
        initialSlide={navInitial ? (nav?.selectedSlideIndex ?? nav?.slideIndex) : draft?.currentSlide}
        initialStylePreset={navInitial ? undefined : draft?.stylePreset}
        onDraftDiscarded={handleDraftDiscarded}
        returnTo={nav?.returnTo}
      />
    </div>
  );
}
