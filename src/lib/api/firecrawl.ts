/**
 * Firecrawl web search via the firecrawl-search Edge Function.
 *
 * Fluxo operacional (sem chave no header):
 *   - O frontend envia apenas { companyId, query, limit } no body.
 *   - A Edge Function valida membership e busca firecrawl_api_key no servidor.
 *
 * Validação manual (apenas chave recém-digitada por Dono/Admin no Setup):
 *   - validateFirecrawlKey(typedKey) usa o header x-firecrawl-api-key
 *     com a chave digitada — NUNCA com chave salva/AppContext.
 */

import { getSupabaseUrl, baseHeaders } from "./_shared";

let _activeCompanyId: string | null = null;

export function setFirecrawlActiveCompany(companyId: string | null) {
  _activeCompanyId = companyId;
}

export function getFirecrawlActiveCompany(): string | null {
  return _activeCompanyId;
}

export interface FirecrawlSearchResult {
  url: string;
  title: string;
  markdown: string;
}

export async function firecrawlSearch(
  query: string,
  limit = 5,
): Promise<{ success?: boolean; results: FirecrawlSearchResult[] }> {
  if (!_activeCompanyId) {
    throw new Error("Selecione uma empresa antes de pesquisar fontes.");
  }
  const url = `${getSupabaseUrl()}/functions/v1/firecrawl-search`;
  const headers = await baseHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ companyId: _activeCompanyId, query, limit }),
  });

  if (!response.ok) {
    let errorMsg: string;
    try { const e = await response.json(); errorMsg = e.error || `HTTP ${response.status}`; }
    catch { errorMsg = `HTTP ${response.status}`; }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Valida APENAS uma chave recém-digitada (não usa chave salva).
 * Mantém header x-firecrawl-api-key porque a chave ainda não existe no servidor.
 */
export async function validateFirecrawlKey(typedKey: string): Promise<{ valid: boolean; error?: string }> {
  if (!typedKey || !typedKey.trim()) {
    return { valid: false, error: "Chave vazia" };
  }
  try {
    const url = `${getSupabaseUrl()}/functions/v1/firecrawl-search`;
    const headers = await baseHeaders();
    headers["x-firecrawl-api-key"] = typedKey.trim();
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ validateKey: true, query: "test", limit: 1 }),
    });
    if (!response.ok) {
      let msg: string;
      try { const e = await response.json(); msg = e.error || `HTTP ${response.status}`; }
      catch { msg = `HTTP ${response.status}`; }
      return { valid: false, error: msg };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Erro de conexão" };
  }
}
