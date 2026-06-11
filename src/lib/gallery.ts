/**
 * Gallery Service — persists creations in Supabase `creations` table
 */

import { supabase } from "@/integrations/supabase/client";

export const DESIGN_DOC_SCHEMA_VERSION = 1;

/** Editable design document. Kept loose to decouple from Studio internals. */
export type EditableDesignDoc = {
  schemaVersion: number;
  [k: string]: unknown;
};

export interface Creation {
  id: string;
  type: "image" | "video" | "carousel";
  urls: string[];
  thumbnailUrl?: string;
  prompt?: string;
  templateId?: string;
  templateName?: string;
  sourceId?: string;
  published: boolean;
  createdAt: string;
  /** Optional editable design (StudioDoc + schemaVersion). null/absent for legacy items. */
  designDoc?: EditableDesignDoc | null;
  /** Legenda do post para redes sociais (editável depois). */
  caption?: string | null;
}

/**
 * Sanitiza um StudioDoc-like para persistir como design_doc:
 * - força schemaVersion
 * - remove strings `data:` / `blob:` (sem base64 dentro do JSON; só http/https)
 */
export function sanitizeDesignDoc(input: unknown): EditableDesignDoc | null {
  if (!input || typeof input !== "object") return null;
  try {
    const clone = JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
    stripDataUrls(clone);
    clone.schemaVersion = DESIGN_DOC_SCHEMA_VERSION;
    return clone as EditableDesignDoc;
  } catch {
    return null;
  }
}

function stripDataUrls(node: unknown): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) stripDataUrls(item);
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string" && (v.startsWith("data:") || v.startsWith("blob:"))) {
      delete obj[key];
    } else if (v && typeof v === "object") {
      stripDataUrls(v);
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────

export async function getCreations(filter?: "image" | "video" | "carousel"): Promise<Creation[]> {
  let query = supabase
    .from("creations")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter) {
    query = query.eq("type", filter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load creations:", error);
    return [];
  }

  return (data || []).map(mapRow);
}

export async function getCreation(id: string): Promise<Creation | null> {
  const { data, error } = await supabase
    .from("creations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data);
}

export async function saveCreation(input: Omit<Creation, "id" | "createdAt">): Promise<Creation | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const payload: Record<string, unknown> = {
    user_id: user.id,
    type: input.type,
    urls: input.urls,
    thumbnail_url: input.thumbnailUrl || input.urls[0] || null,
    prompt: input.prompt || null,
    template_id: input.templateId || null,
    template_name: input.templateName || null,
    source_id: input.sourceId || null,
    published: input.published,
  };
  if (input.designDoc !== undefined) {
    payload.design_doc = input.designDoc ? sanitizeDesignDoc(input.designDoc) : null;
  }

  const { data, error } = await supabase
    .from("creations")
    .insert(payload as never)
    .select()
    .single();

  if (error) {
    console.error("Failed to save creation:", error);
    return null;
  }
  return mapRow(data);
}

export async function updateCreation(id: string, updates: Partial<Creation>): Promise<Creation | null> {
  const payload: Record<string, unknown> = {};
  if (updates.published !== undefined) payload.published = updates.published;
  if (updates.urls) payload.urls = updates.urls;
  if (updates.prompt !== undefined) payload.prompt = updates.prompt;
  if (updates.type) payload.type = updates.type;
  if (updates.thumbnailUrl !== undefined) payload.thumbnail_url = updates.thumbnailUrl;
  if (updates.designDoc !== undefined) {
    payload.design_doc = updates.designDoc ? sanitizeDesignDoc(updates.designDoc) : null;
  }

  const { data, error } = await supabase
    .from("creations")
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update creation:", error);
    return null;
  }
  return mapRow(data);
}

export async function deleteCreation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("creations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete creation:", error);
    return false;
  }
  return true;
}

export async function markAsPublished(id: string): Promise<void> {
  await updateCreation(id, { published: true });
}

/**
 * Find gallery item by any matching URL and mark as published
 */
function normalizeUrl(url: string): string {
  return url.split("?")[0].replace(/\/+$/, "");
}

export async function markAsPublishedByUrls(urls: string[]): Promise<void> {
  if (!urls.length) return;

  // Fetch unpublished creations
  const { data } = await supabase
    .from("creations")
    .select("id, urls")
    .eq("published", false);

  if (!data?.length) return;

  const normalizedUrls = urls.map(normalizeUrl);
  const idsToUpdate: string[] = [];

  for (const row of data) {
    const match = (row.urls || []).some((u: string) => {
      const normalized = normalizeUrl(u);
      return normalizedUrls.includes(normalized) || urls.includes(u);
    });
    if (match) idsToUpdate.push(row.id);
  }

  if (idsToUpdate.length > 0) {
    await supabase
      .from("creations")
      .update({ published: true })
      .in("id", idsToUpdate);
  }
}

/**
 * Persiste URLs: data: URLs são upadas pro storage e viram http; blob: são descartadas.
 */
export async function persistUrls(urls: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const u of urls) {
    if (!u) continue;
    if (u.startsWith("http")) {
      out.push(u);
    } else if (u.startsWith("data:")) {
      // Upload data URL pro Supabase storage
      try {
        const [head, b64] = u.split(",");
        const mime = /:(.*?);/.exec(head)?.[1] || "image/png";
        const ext = mime.split("/")[1] || "png";
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) continue;
        const path = `gallery/${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("media").upload(path, bytes, { contentType: mime });
        if (!error) {
          out.push(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
        }
      } catch { /* skip this one */ }
    }
    // blob: URLs are discarded (não persistentes)
  }
  return out;
}

/**
 * Save a visual creation to the gallery. Handles data: URLs automatically
 * (uploads to storage first). NENHUMA criação se perde.
 */
export async function saveVisualToGallery(opts: {
  urls: string[];
  prompt?: string;
  templateId?: string;
  templateName?: string;
  designDoc?: EditableDesignDoc | null;
}): Promise<Creation | null> {
  const validUrls = await persistUrls(opts.urls);
  if (validUrls.length === 0) return null;

  const isVideo = validUrls.some((u) => /\.(mp4|mov|webm)/i.test(u));
  const isCarousel = validUrls.length > 1 && !isVideo;

  return saveCreation({
    type: isVideo ? "video" : isCarousel ? "carousel" : "image",
    urls: validUrls,
    thumbnailUrl: validUrls[0],
    prompt: opts.prompt,
    templateId: opts.templateId,
    templateName: opts.templateName,
    published: false,
    designDoc: opts.designDoc ?? undefined,
  });
}

/**
 * Save uploaded media to gallery. Handles data: URLs (uploads automatically).
 */
export async function saveUploadToGallery(urls: string[]): Promise<Creation | null> {
  const validUrls = await persistUrls(urls);
  if (validUrls.length === 0) return null;

  const isVideo = validUrls.some((u) => /\.(mp4|mov|webm)/i.test(u));
  return saveCreation({
    type: isVideo ? "video" : validUrls.length > 1 ? "carousel" : "image",
    urls: validUrls,
    thumbnailUrl: validUrls[0],
    published: false,
  });
}

// ─── Internal helper ────────────────────────────────────────────

function mapRow(row: any): Creation {
  return {
    id: row.id,
    type: row.type || "image",
    urls: row.urls || [],
    thumbnailUrl: row.thumbnail_url || (row.urls?.[0] ?? undefined),
    prompt: row.prompt || undefined,
    templateId: row.template_id || undefined,
    templateName: row.template_name || undefined,
    sourceId: row.source_id || undefined,
    published: row.published ?? false,
    createdAt: row.created_at,
    designDoc: (row.design_doc as EditableDesignDoc | null) ?? null,
  };
}
