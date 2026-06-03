/**
 * Post for Me (PFM) — unified accounts + posting + analytics.
 *
 * All calls go through the postforme-proxy Edge Function. The PFM key can be
 * set explicitly (setPfmUserKey) or read from the user's saved config.
 */

import { getSupabaseUrl, getSavedConfig, baseHeaders } from "./_shared";

// Exported for direct use (e.g. Bluesky auth)
export async function callPfmDirect(
  tool: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  return callPfm(tool, args);
}

// PFM key can be passed from user config
let _pfmUserKey: string | undefined;
export function setPfmUserKey(key: string | undefined) { _pfmUserKey = key; }
export function getPfmUserKey() { return _pfmUserKey; }

async function callPfm(
  tool: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  const url = `${getSupabaseUrl()}/functions/v1/postforme-proxy`;
  const cfg = getSavedConfig();
  const headers = baseHeaders();
  if (_pfmUserKey) headers["x-pfm-api-key"] = _pfmUserKey;
  else if (cfg.postformeApiKey) headers["x-pfm-api-key"] = cfg.postformeApiKey;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ tool, args }),
  });

  if (!res.ok) {
    let errorMsg: string;
    try { const e = await res.json(); errorMsg = e.error || `HTTP ${res.status}`; }
    catch { errorMsg = `HTTP ${res.status}`; }
    throw new Error(errorMsg);
  }

  return res.json();
}

/** Validate PFM key by listing accounts */
export async function validatePfmKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = `${getSupabaseUrl()}/functions/v1/postforme-proxy`;
    const headers = baseHeaders();
    headers["x-pfm-api-key"] = key;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ tool: "pfm_list_accounts", args: {} }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { valid: false, error: body.error || `HTTP ${res.status}` };
    }
    setPfmUserKey(key);
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
    .filter((a: any) => a.status !== "disconnected")  // ignorar contas desconectadas
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
  // PFM API may nest under .data or return flat
  const data = result?.data ?? result;
  if (!data?.media_url || !data?.upload_url) {
    throw new Error("PFM upload URL response missing media_url or upload_url");
  }
  return { media_url: data.media_url, upload_url: data.upload_url };
}
