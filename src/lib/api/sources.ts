/**
 * Source extraction — substitui Blotato Sources por Firecrawl + IA.
 * Síncrono (sem polling): retorna conteúdo extraído e sumarizado.
 *
 * Segurança: não envia chave Firecrawl no header. A Edge Function valida
 * membership e carrega firecrawl_api_key no servidor a partir de companyId.
 */

import { getSupabaseUrl, baseHeaders } from "./_shared";
import { getFirecrawlActiveCompany } from "./firecrawl";
import type { ContentSource } from "@/types";

export interface ExtractSourceParams {
  sourceType: string;
  url?: string;
  text?: string;
  customInstructions?: string;
}

export async function extractSource(params: ExtractSourceParams): Promise<ContentSource> {
  const companyId = getFirecrawlActiveCompany();
  if (!companyId) {
    throw new Error("Selecione uma empresa antes de pesquisar fontes.");
  }

  const url = `${getSupabaseUrl()}/functions/v1/source-extract`;
  const headers = await baseHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...params, companyId }),
  });

  if (!response.ok) {
    let msg: string;
    try { const e = await response.json(); msg = e.error || `HTTP ${response.status}`; }
    catch { msg = `HTTP ${response.status}`; }
    throw new Error(msg);
  }

  return response.json();
}
