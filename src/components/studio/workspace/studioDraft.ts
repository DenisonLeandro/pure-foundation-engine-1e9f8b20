import { sanitizeDesignDoc } from "@/lib/gallery";
import type { StudioDoc } from "./types";
import type { StylePreset } from "./designAesthetics";

// Rascunho local do Studio — sobrevive a troca de aba/rota.
// Chave: studio:draft:v1:{userId}:{brandId|default}
const PREFIX = "studio:draft:v1:";

export interface StudioDraft {
  doc: StudioDoc;
  currentSlide?: number;
  stylePreset?: StylePreset;
  creationId?: string;
  fallbackImageUrls?: string[];
  updatedAt: number;
}

export type StudioDraftInput = Omit<StudioDraft, "updatedAt">;

function draftKey(userId: string, brandId?: string | null): string {
  return `${PREFIX}${userId}:${brandId || "default"}`;
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

/** Remove todos os rascunhos locais do usuário. */
export function clearStudioDrafts(userId: string): void {
  try {
    const prefix = `${PREFIX}${userId}:`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
