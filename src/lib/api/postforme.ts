/**
 * Post for Me (PFM) — unified accounts + posting + analytics.
 *
 * Modelo seguro por empresa:
 * - Todas as chamadas operacionais incluem `companyId` no body.
 * - A Edge Function postforme-proxy valida membership e busca
 *   `postforme_api_key` em `company_configs` no servidor.
 * - O frontend NÃO envia mais `x-pfm-api-key` no fluxo operacional.
 *
 * Único uso restante de `x-pfm-api-key`: validação de uma chave recém-digitada
 * em Setup/ManageKeysView (`validatePfmKey`). Esse caminho não usa nenhuma
 * chave salva — apenas a string digitada no input.
 */

import { getSupabaseUrl, baseHeaders } from "./_shared";

// ─── Empresa ativa (preenchido pelo CompanyContext) ────────────────
let _activeCompanyId: string | null = null;
export function setPfmActiveCompany(companyId: string | null | undefined) {
  _activeCompanyId = companyId || null;
}
export function getPfmActiveCompany() {
  return _activeCompanyId;
}

// ─── No-ops mantidos para compatibilidade com AppContext ───────────
// (a chave da empresa não é mais lida no frontend; o backend resolve.)
export function setPfmUserKey(_key: string | undefined) { /* no-op */ }
export function getPfmUserKey(): string | undefined { return undefined; }

// Exported for direct use (e.g. Bluesky auth)
export async function callPfmDirect(
  tool: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  return callPfm(tool, args);
}

async function callPfm(
  tool: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  const companyId = _activeCompanyId;
  if (!companyId) {
    throw new Error("Selecione uma empresa antes de publicar.");
  }

  const url = `${getSupabaseUrl()}/functions/v1/postforme-proxy`;
  const headers = await baseHeaders();

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ tool, args, companyId }),
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || payload?.handled) {
    const errorMsg = payload?.error || payload?.details?.message || `HTTP ${payload?.status || res.status}`;
    throw new Error(errorMsg);
  }

  return payload;
}

/** Valida uma chave PFM recém-digitada pelo Dono/Admin.
 *  Envia a chave digitada via header APENAS para essa rota de validação.
 *  Não lê nem usa nenhuma chave salva da empresa. */
export async function validatePfmKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = `${getSupabaseUrl()}/functions/v1/postforme-proxy`;
    const headers = await baseHeaders();
    headers["x-pfm-api-key"] = key;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ tool: "pfm_list_accounts", args: {}, validateKey: true }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { valid: false, error: body.error || `HTTP ${res.status}` };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Erro de conexão" };
  }
}

// Accounts
export interface PfmAccount {
  id: string;
  platform: string;
  username: string;
  name: string;
  picture: string;
  status: string;
}

export async function pfmListAccounts(platform?: string): Promise<PfmAccount[]> {
  const args: Record<string, unknown> = {};
  if (platform) args.platform = platform;
  const result = await callPfm("pfm_list_accounts", args) as any;
  return (result.data || [])
    .filter((a: any) => a.status !== "disconnected")
    .map((a: any) => ({
      id: a.id,
      platform: a.platform === "x" ? "twitter" : a.platform,
      username: a.username || a.platform_username || a.name || a.platform_name || (a.platform === "youtube" ? "YouTube" : ""),
      name: a.name || a.platform_name || a.username || a.platform_username || (a.platform === "youtube" ? "Canal YouTube" : ""),
      picture: a.profile_photo_url || a.picture || a.platform_profile_picture_url || "",
      status: a.status || "active",
    }));
}

export async function pfmAuthUrl(platform: string, connectionType?: string): Promise<string> {
  const args: Record<string, unknown> = { platform: platform === "twitter" ? "x" : platform };
  if (connectionType) args.connection_type = connectionType;
  const result = await callPfm("pfm_auth_url", args) as any;
  return result.url || "";
}

export async function pfmDisconnectAccount(id: string): Promise<void> {
  await callPfm("pfm_disconnect_account", { id });
}

// Posts
export interface PfmCreatePostParams {
  caption: string;
  social_accounts: string[];
  media?: Array<string | { url: string; [key: string]: unknown }>;
  scheduled_at?: string;
  account_configurations?: {
    social_account_id: string;
    configuration: Record<string, unknown> & {
      media?: Array<string | { url: string; [key: string]: unknown }>;
    };
  }[];
}

export async function pfmCreatePost(params: PfmCreatePostParams): Promise<any> {
  return callPfm("pfm_create_post", params as unknown as Record<string, unknown>);
}

export async function pfmListPosts(opts?: { platform?: string; status?: string; limit?: number }): Promise<any> {
  return callPfm("pfm_list_posts", opts || {});
}

export async function pfmDeletePost(id: string): Promise<void> {
  await callPfm("pfm_delete_post", { id });
}

export async function pfmGetPost(id: string): Promise<any> {
  return callPfm("pfm_get_post", { id });
}

export async function pfmUpdatePost(id: string, data: Record<string, unknown>): Promise<any> {
  return callPfm("pfm_update_post", { id, data });
}

// Analytics
export async function pfmPostResults(opts?: { social_account_id?: string; platform?: string; limit?: number }): Promise<any> {
  return callPfm("pfm_post_results", opts || {});
}

export async function pfmAccountFeed(socialAccountId: string, limit = 20, cursor?: string): Promise<any> {
  const args: Record<string, unknown> = { social_account_id: socialAccountId, limit };
  if (cursor) args.cursor = cursor;
  return callPfm("pfm_account_feed", args);
}

// Media upload
export async function pfmCreateUploadUrl(): Promise<{ media_url: string; upload_url: string }> {
  const result = await callPfm("pfm_upload_url", {}) as any;
  const data = result?.data ?? result;
  if (!data?.media_url || !data?.upload_url) {
    throw new Error("PFM upload URL response missing media_url or upload_url");
  }
  return { media_url: data.media_url, upload_url: data.upload_url };
}
