import { createContext, useContext, useReducer, useCallback, useMemo, useRef, type ReactNode } from "react";
import type { Platform } from "@/types";
import type { StudioDoc, StudioFormat, Slide, El } from "./types";
import { uid } from "./types";

// ─── Documento inicial ───────────────────────────────────────────

export function blankSlide(c1 = "#8b5cf6", c2 = "#d946ef", text = "#ffffff"): Slide {
  return {
    bg: `linear-gradient(135deg, ${c1}, ${c2})`,
    els: [
      { id: uid(), type: "text", x: 36, y: 150, w: 328, h: 90, text: "Toque para editar", fontSize: 30, color: text, weight: 700, align: "left" },
    ],
  };
}

export function emptyDoc(format: StudioFormat = "post", brandId: string | null = null): StudioDoc {
  return {
    format,
    brandId,
    slides: [blankSlide()],
    caption: "",
    hashtags: [],
    platforms: ["instagram"],
    schedule: { when: "now" },
  };
}

// ─── Estado + histórico (undo/redo) ──────────────────────────────

interface State {
  doc: StudioDoc;
  past: StudioDoc[];
  future: StudioDoc[];
  selectedElId: string | null;
  currentSlide: number;
}

type Action =
  | { type: "SET"; partial: Partial<StudioDoc>; history?: boolean }
  | { type: "REPLACE"; doc: StudioDoc }
  | { type: "PUSH_HISTORY" }
  | { type: "SELECT"; id: string | null }
  | { type: "SET_SLIDE"; index: number }
  | { type: "UNDO" }
  | { type: "REDO" };

const MAX_HISTORY = 50;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET": {
      const doc = { ...state.doc, ...action.partial };
      if (action.history === false) return { ...state, doc };
      return { ...state, doc, past: [...state.past, state.doc].slice(-MAX_HISTORY), future: [] };
    }
    case "REPLACE":
      return { ...state, doc: action.doc, past: [...state.past, state.doc].slice(-MAX_HISTORY), future: [], selectedElId: null, currentSlide: 0 };
    case "PUSH_HISTORY":
      return { ...state, past: [...state.past, state.doc].slice(-MAX_HISTORY), future: [] };
    case "SELECT":
      return { ...state, selectedElId: action.id };
    case "SET_SLIDE":
      return { ...state, currentSlide: action.index, selectedElId: null };
    case "UNDO": {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return { ...state, doc: prev, past: state.past.slice(0, -1), future: [state.doc, ...state.future], selectedElId: null };
    }
    case "REDO": {
      if (!state.future.length) return state;
      const next = state.future[0];
      return { ...state, doc: next, past: [...state.past, state.doc], future: state.future.slice(1), selectedElId: null };
    }
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────

interface StudioCtx {
  doc: StudioDoc;
  slide: Slide;
  currentSlide: number;
  selectedElId: string | null;
  selectedEl: El | null;
  canUndo: boolean;
  canRedo: boolean;
  // mutações
  set: (partial: Partial<StudioDoc>, history?: boolean) => void;
  replaceDoc: (doc: StudioDoc) => void;
  setSlides: (slides: Slide[], history?: boolean) => void;
  patchSlide: (index: number, partial: Partial<Slide>, history?: boolean) => void;
  patchEl: (id: string, partial: Partial<El>, history?: boolean) => void;
  addEl: (el: El) => void;
  delEl: (id: string) => void;
  pushHistory: () => void;
  select: (id: string | null) => void;
  setCurrentSlide: (index: number) => void;
  setFormat: (format: StudioFormat) => void;
  setPlatforms: (p: Platform[]) => void;
  undo: () => void;
  redo: () => void;
  // export do canvas (registrado pelo DesignCanvas, consumido pelo publish)
  registerExporter: (fn: (() => Promise<string[]>) | null) => void;
  exportSlides: () => Promise<string[]>;
}

const Ctx = createContext<StudioCtx | null>(null);

export function StudioProvider({ children, initial }: { children: ReactNode; initial?: StudioDoc }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    doc: initial ?? emptyDoc(),
    past: [],
    future: [],
    selectedElId: null,
    currentSlide: 0,
  }));

  const set = useCallback((partial: Partial<StudioDoc>, history = true) => dispatch({ type: "SET", partial, history }), []);
  const replaceDoc = useCallback((doc: StudioDoc) => dispatch({ type: "REPLACE", doc }), []);
  const pushHistory = useCallback(() => dispatch({ type: "PUSH_HISTORY" }), []);
  const select = useCallback((id: string | null) => dispatch({ type: "SELECT", id }), []);
  const setCurrentSlide = useCallback((index: number) => dispatch({ type: "SET_SLIDE", index }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  const cur = Math.min(state.currentSlide, state.doc.slides.length - 1);

  const setSlides = useCallback((slides: Slide[], history = true) => set({ slides }, history), [set]);

  const patchSlide = useCallback((index: number, partial: Partial<Slide>, history = true) => {
    set({ slides: state.doc.slides.map((s, i) => (i === index ? { ...s, ...partial } : s)) }, history);
  }, [set, state.doc.slides]);

  const patchEl = useCallback((id: string, partial: Partial<El>, history = true) => {
    set({
      slides: state.doc.slides.map((s, i) =>
        i === cur ? { ...s, els: s.els.map((e) => (e.id === id ? { ...e, ...partial } : e)) } : s
      ),
    }, history);
  }, [set, state.doc.slides, cur]);

  const addEl = useCallback((el: El) => {
    set({ slides: state.doc.slides.map((s, i) => (i === cur ? { ...s, els: [...s.els, el] } : s)) });
    dispatch({ type: "SELECT", id: el.id });
  }, [set, state.doc.slides, cur]);

  const delEl = useCallback((id: string) => {
    set({ slides: state.doc.slides.map((s, i) => (i === cur ? { ...s, els: s.els.filter((e) => e.id !== id) } : s)) });
    dispatch({ type: "SELECT", id: null });
  }, [set, state.doc.slides, cur]);

  const setFormat = useCallback((format: StudioFormat) => set({ format }), [set]);
  const setPlatforms = useCallback((p: Platform[]) => set({ platforms: p }), [set]);

  const exporterRef = useRef<(() => Promise<string[]>) | null>(null);
  const registerExporter = useCallback((fn: (() => Promise<string[]>) | null) => { exporterRef.current = fn; }, []);
  const exportSlides = useCallback(() => (exporterRef.current ? exporterRef.current() : Promise.resolve([])), []);

  const slide = state.doc.slides[cur] ?? state.doc.slides[0];
  const selectedEl = slide?.els.find((e) => e.id === state.selectedElId) ?? null;

  const value = useMemo<StudioCtx>(() => ({
    doc: state.doc,
    slide,
    currentSlide: cur,
    selectedElId: state.selectedElId,
    selectedEl,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    set, replaceDoc, setSlides, patchSlide, patchEl, addEl, delEl, pushHistory,
    select, setCurrentSlide, setFormat, setPlatforms, undo, redo,
    registerExporter, exportSlides,
  }), [state, slide, cur, selectedEl, set, replaceDoc, setSlides, patchSlide, patchEl, addEl, delEl, pushHistory, select, setCurrentSlide, setFormat, setPlatforms, undo, redo, registerExporter, exportSlides]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudio(): StudioCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStudio precisa estar dentro de <StudioProvider>");
  return ctx;
}
