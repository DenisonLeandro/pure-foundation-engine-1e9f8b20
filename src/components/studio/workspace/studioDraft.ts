import { sanitizeDesignDoc } from "@/lib/gallery";
import type { StudioDoc } from "./types";
import type { StylePreset } from "./designAesthetics";

// Rascunho local do Studio — sobrevive a troca de aba/rota.
// Duas chaves:
//   studio:draft:v1:{userId}:{brandId|default}  → rascunho do editor (assisted)
//   studio:flow-draft:v1:{userId}               → estado do fluxo (mode + form do Criar com IA)
const PREFIX = "studio:draft:v1:";
const FLOW_PREFIX = "studio:flow-draft:v1:";

export interface StudioDraft {
  doc: StudioDoc;
  currentSlide?: number;
  stylePreset?: StylePreset;
  creationId?: string;
  fallbackImageUrls?: string[];
  updatedAt: number;
}

export type StudioDraftInput = Omit<StudioDraft, "updatedAt">;

// ── Flow draft (estado do fluxo do Studio) ──────────────────────────────────

export interface AutoFormDraft {
  prompt: string;
  imageSource: "pexels" | "ai";
  layoutMode: string;
  selectedSourceIds: string[];
  brandId: string | null;
  textFidelity: "improve" | "literal";
}

export interface StudioFlowDraft {
  version: 1;
  mode: "auto" | "assisted";
  autoForm?: AutoFormDraft;
  /** Doc gerado em "Criar com IA" (mostra OutputScreen ao restaurar). */
  autoDoc?: StudioDoc;
  updatedAt: number;
}

function draftKey(userId: string, brandId?: string | null): string {
  return `${PREFIX}${userId}:${brandId || "default"}`;
}

function flowKey(userId: string): string {
  return `${FLOW_PREFIX}${userId}`;
}

function isHttpUrl(s: unknown): s is string {
  return typeof s === "string" && /^https?:\/\//i.test(s);
}

function isValidDraft(d: unknown): d is StudioDraft {
  if (!d || typeof d !== "object") return false;
  const doc = (d as StudioDraft).doc;
  return !!doc && typeof doc === "object" && Array.isArray(doc.slides) && doc.slides.length > 0;
}

/** Doc "intocado" (em branco padrão) não vira rascunho — evita restaurar Studio vazio com toast. */
function isPristineDoc(doc: StudioDoc): boolean {
  if (doc.caption) return false;
  if ((doc.slides?.length ?? 0) !== 1) return false;
  const s = doc.slides[0];
  if (s.bgImage) return false;
  const els = s.els ?? [];
  if (els.length === 0) return true;
  return els.length === 1 && els[0].type === "text" && els[0].text === "Toque para editar";
}

/** Salva o rascunho local. Remove data:/blob: via sanitizeDesignDoc (nunca persiste base64). */
export function saveStudioDraft(userId: string, input: StudioDraftInput): void {
  try {
    if (!input.creationId && isPristineDoc(input.doc)) return;
    const safeDoc = sanitizeDesignDoc(input.doc) as unknown as StudioDoc | null;
    if (!safeDoc || !Array.isArray(safeDoc.slides) || !safeDoc.slides.length) return;
    const payload: StudioDraft = {
      ...input,
      doc: safeDoc,
      fallbackImageUrls: (input.fallbackImageUrls ?? []).filter(isHttpUrl),
      updatedAt: Date.now(),
    };
    localStorage.setItem(draftKey(userId, safeDoc.brandId), JSON.stringify(payload));
  } catch {
    // quota cheia / serialização — autosave nunca pode quebrar o editor
  }
}

/** Retorna o rascunho mais recente do usuário (entre todas as marcas). */
export function loadLatestStudioDraft(userId: string): StudioDraft | null {
  try {
    const prefix = `${PREFIX}${userId}:`;
    let best: StudioDraft | null = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "");
        if (isValidDraft(parsed) && (!best || (parsed.updatedAt ?? 0) > (best.updatedAt ?? 0))) best = parsed;
      } catch {
        // entrada corrompida — ignora
      }
    }
    return best;
  } catch {
    return null;
  }
}

/** Remove todos os rascunhos locais do usuário (editor + fluxo). */
export function clearStudioDrafts(userId: string): void {
  try {
    const prefix = `${PREFIX}${userId}:`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(prefix) || k === flowKey(userId))) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ── Flow draft API ───────────────────────────────────────────────────────────

function isValidFlowDraft(d: unknown): d is StudioFlowDraft {
  if (!d || typeof d !== "object") return false;
  const f = d as StudioFlowDraft;
  return f.mode === "auto" || f.mode === "assisted";
}

export function saveStudioFlowDraft(userId: string, draft: Omit<StudioFlowDraft, "version" | "updatedAt">): void {
  try {
    const safeAutoDoc = draft.autoDoc
      ? (sanitizeDesignDoc(draft.autoDoc) as unknown as StudioDoc | null) ?? undefined
      : undefined;
    const payload: StudioFlowDraft = {
      version: 1,
      mode: draft.mode,
      autoForm: draft.autoForm,
      autoDoc: safeAutoDoc,
      updatedAt: Date.now(),
    };
    localStorage.setItem(flowKey(userId), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function loadStudioFlowDraft(userId: string): StudioFlowDraft | null {
  try {
    const raw = localStorage.getItem(flowKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidFlowDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearStudioFlowDraft(userId: string): void {
  try { localStorage.removeItem(flowKey(userId)); } catch { /* ignore */ }
}
