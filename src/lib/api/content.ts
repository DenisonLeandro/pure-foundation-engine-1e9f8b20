/**
 * AI content generation + stock image search.
 *
 * Both call Supabase Edge Functions (generate-content / image-search),
 * which use the Lovable AI Gateway and the user's saved provider keys.
 */

import { getSupabaseUrl, getSavedConfig, baseHeaders } from "./_shared";

// ─── AI Content Generation ──────────────────────────────────────

export interface BrandProfileForAI {
  name: string;
  description?: string;
  tone: string;
  targetAudience?: string;
  industry?: string;
  keywords?: string[];
  avoidWords?: string[];
  examplePosts?: string[];
  systemPrompt?: string;
}

export interface GenerateContentParams {
  prompt: string;
  platforms: string[];
  tone?: string;
  language?: string;
  sourceContent?: string;
  brandProfile?: BrandProfileForAI;
}

export interface CarouselSlide {
  heading: string;
  body: string;
}

export interface GenerateContentResult {
  posts: Record<string, string>;
  carousel?: {
    title: string;
    slides: CarouselSlide[];
  };
  imageKeywords?: string[];
  visualSuggestion?: string;
  hashtags?: string[];
}

// ─── Image Search ───────────────────────────────────────────────

export interface StockImage {
  id: string;
  url: string;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  author: string;
  authorUrl: string;
  source: string;
}

export interface ImageSearchParams {
  keywords: string[];
  count?: number;
  orientation?: "landscape" | "portrait" | "squarish";
}

export async function searchImages(
  params: ImageSearchParams
): Promise<{ images: StockImage[] }> {
  const url = `${getSupabaseUrl()}/functions/v1/image-search`;
  const cfg = getSavedConfig();
  const headers = await baseHeaders();
  if (cfg.higgsFieldApiId) headers["x-higgsfield-api-id"] = cfg.higgsFieldApiId;
  if (cfg.higgsFieldApiSecret) headers["x-higgsfield-api-secret"] = cfg.higgsFieldApiSecret;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Image search error: HTTP ${response.status}`);
  }

  return response.json();
}

export interface StockSearchParams {
  companyId: string;
  query: string;
  count?: number;
  orientation?: "landscape" | "portrait" | "squarish";
}

/** Busca fotos de acervo (Pexels) via edge function stock-search.
 *  A chave Pexels é carregada da empresa no servidor — não trafega pelo cliente. */
export async function searchStockImages(
  params: StockSearchParams
): Promise<{ images: StockImage[] }> {
  if (!params.companyId) throw new Error("companyId é obrigatório para buscar imagens.");
  const url = `${getSupabaseUrl()}/functions/v1/stock-search`;
  const headers = await baseHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let msg: string;
    try { const e = await response.json(); msg = e.error || `HTTP ${response.status}`; }
    catch { msg = `HTTP ${response.status}`; }
    throw new Error(msg);
  }

  return response.json();
}

/** Valida uma chave Pexels chamando a API diretamente (Pexels suporta CORS).
 *  A chave digitada pelo usuário no Setup nunca passa por uma edge. */
export async function validatePexelsKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.pexels.com/v1/search?query=test&per_page=1", {
      headers: { Authorization: key },
    });
    if (res.status === 401 || res.status === 403) return { valid: false, error: "Chave inválida" };
    if (!res.ok) return { valid: false, error: `HTTP ${res.status}` };
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Erro de conexão" };
  }
}

export async function generateContent(
  params: GenerateContentParams
): Promise<GenerateContentResult> {
  const url = `${getSupabaseUrl()}/functions/v1/generate-content`;
  const headers = await baseHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorMsg: string;
    try {
      const errBody = await response.json();
      errorMsg = errBody.error || `HTTP ${response.status}`;
    } catch {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
