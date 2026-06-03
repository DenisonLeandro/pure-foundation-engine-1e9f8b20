/**
 * Blotato API Service Layer
 *
 * Calls Blotato MCP through a Supabase Edge Function proxy.
 * The Edge Function handles MCP protocol (initialize → tool call)
 * so the browser never hits CORS issues.
 */

import type {
  Platform,
  SocialAccount,
  SubAccount,
  ContentSource,
} from "@/types";
import { getSupabaseUrl } from "./_shared";

function getEdgeFunctionUrl(): string {
  return `${getSupabaseUrl()}/functions/v1/blotato-proxy`;
}

// ─── Transport ──────────────────────────────────────────────────

async function callTool(
  apiKey: string,
  tool: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  const url = getEdgeFunctionUrl();

  // Get Supabase publishable key for auth (Lovable auto-injects)
  const anonKey =
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
    "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-blotato-api-key": apiKey,
  };

  // Supabase Edge Functions require the anon key for auth
  if (anonKey) {
    headers["apikey"] = anonKey;
    headers["Authorization"] = `Bearer ${anonKey}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ tool, args }),
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

// ─── User ───────────────────────────────────────────────────────

export interface BlotatoUser {
  id: string;
  subscriptionStatus: string;
  apiKey: string;
  statusCode: number;
}

export async function getUser(apiKey: string): Promise<BlotatoUser> {
  return callTool(apiKey, "blotato_get_user") as Promise<BlotatoUser>;
}

// ─── Accounts ───────────────────────────────────────────────────

export async function listAccounts(
  apiKey: string,
  platform?: Platform
): Promise<SocialAccount[]> {
  const args: Record<string, unknown> = {};
  if (platform) args.platform = platform;
  const result = await callTool(apiKey, "blotato_list_accounts", args);
  // REST API returns { items: [...] }, normalize to array
  if (result && typeof result === "object" && "items" in (result as any)) {
    return (result as any).items as SocialAccount[];
  }
  if (Array.isArray(result)) return result as SocialAccount[];
  return [];
}

export async function listSubaccounts(
  apiKey: string,
  accountId: string
): Promise<SubAccount[]> {
  const result = await callTool(apiKey, "blotato_list_subaccounts", { accountId });
  if (result && typeof result === "object" && "items" in (result as any)) {
    return (result as any).items as SubAccount[];
  }
  if (Array.isArray(result)) return result as SubAccount[];
  return [];
}

// ─── Visuals ────────────────────────────────────────────────────

export interface VisualTemplateFromAPI {
  id: string;
  description: string;
  inputs?: unknown[];
}

export async function listVisualTemplates(
  apiKey: string,
  search?: string
): Promise<unknown> {
  const args: Record<string, unknown> = { fields: "id,description,inputs" };
  if (search) args.search = search;
  return callTool(apiKey, "blotato_list_visual_templates", args);
}

// ─── Media Upload ───────────────────────────────────────────────

export interface MediaUploadResult {
  url: string;
  id: string;
}

export async function uploadMedia(
  apiKey: string,
  url: string
): Promise<MediaUploadResult> {
  return callTool(apiKey, "blotato_upload_media", { url }) as Promise<MediaUploadResult>;
}

export interface CreateVisualParams {
  templateId: string;
  prompt?: string;
  inputs?: Record<string, unknown>;
  render?: boolean;
}

export interface VisualCreation {
  id: string;
  status: string;
  mediaUrl?: string;
  imageUrls?: string[];
  errorMessage?: string;
  failReason?: string;
  error?: string;
}

export async function createVisual(
  apiKey: string,
  params: CreateVisualParams
): Promise<VisualCreation> {
  return callTool(apiKey, "blotato_create_visual", {
    ...params,
    inputs: params.inputs ?? {},
    render: params.render ?? true,
  }) as Promise<VisualCreation>;
}

export async function getVisualStatus(
  apiKey: string,
  id: string
): Promise<VisualCreation> {
  return callTool(apiKey, "blotato_get_visual_status", {
    id,
  }) as Promise<VisualCreation>;
}

// ─── Sources ────────────────────────────────────────────────────

export interface CreateSourceParams {
  sourceType: string;
  url?: string;
  text?: string;
  customInstructions?: string;
}

export async function createSource(
  apiKey: string,
  params: CreateSourceParams
): Promise<ContentSource> {
  return callTool(
    apiKey,
    "blotato_create_source",
    params as unknown as Record<string, unknown>
  ) as Promise<ContentSource>;
}

export async function getSourceStatus(
  apiKey: string,
  id: string
): Promise<ContentSource> {
  return callTool(apiKey, "blotato_get_source_status", {
    id,
  }) as Promise<ContentSource>;
}
