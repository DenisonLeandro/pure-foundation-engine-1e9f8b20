/**
 * Blotato API Service Layer
 *
 * Modelo seguro por empresa:
 * - Frontend envia `{ tool, args, companyId }` no body.
 * - A Edge Function `blotato-proxy` valida membership e busca
 *   `blotato_api_key` em `company_configs` no servidor.
 * - O frontend NÃO envia mais `x-blotato-api-key` no fluxo operacional.
 *
 * Único uso restante de `x-blotato-api-key`: validação de uma chave
 * recém-digitada por Dono/Admin em Setup/ManageKeysView, via `getUser(typedKey)`
 * (flag `validateKey: true`). Esse caminho nunca lê chave salva.
 *
 * TODO: futuramente o `companyId` deve ser passado explicitamente por cada
 * chamada (em vez do setter de módulo abaixo) para reduzir estado global.
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

// ─── Empresa ativa (preenchido pelo CompanyContext) ──────────────
let _activeCompanyId: string | null = null;
export function setBlotatoActiveCompany(companyId: string | null | undefined) {
  _activeCompanyId = companyId || null;
}
export function getBlotatoActiveCompany() {
  return _activeCompanyId;
}

// ─── Transport ──────────────────────────────────────────────────

interface CallOpts {
  /** Use APENAS para validar uma chave recém-digitada em telas de Setup. */
  validateKey?: boolean;
  /** Chave digitada manualmente (somente quando validateKey === true). */
  typedKey?: string;
}

async function callTool(
  _apiKey: string,
  tool: string,
  args: Record<string, unknown> = {},
  opts: CallOpts = {},
): Promise<unknown> {
  const url = getEdgeFunctionUrl();

  const anonKey =
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
    "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Obter JWT do usuário, com fallback para anon.
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (anonKey) headers["apikey"] = anonKey;
    headers["Authorization"] = `Bearer ${token || anonKey}`;
  } catch {
    if (anonKey) {
      headers["apikey"] = anonKey;
      headers["Authorization"] = `Bearer ${anonKey}`;
    }
  }

  const body: Record<string, unknown> = { tool, args };

  if (opts.validateKey) {
    // Caminho EXCLUSIVO de validação de chave digitada (Setup/ManageKeysView).
    if (!opts.typedKey) throw new Error("Chave Blotato ausente para validação.");
    headers["x-blotato-api-key"] = opts.typedKey;
    body.validateKey = true;
  } else {
    // Fluxo operacional: companyId no body, NUNCA enviar a chave.
    if (!_activeCompanyId) {
      throw new Error("Selecione uma empresa antes de publicar.");
    }
    body.companyId = _activeCompanyId;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
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

/**
 * Valida uma chave Blotato recém-digitada.
 * SOMENTE para uso em telas de configuração (Setup/ManageKeysView),
 * sempre com chave vinda do input — nunca de config salvo.
 */
export async function getUser(typedKey: string): Promise<BlotatoUser> {
  return callTool(typedKey, "blotato_get_user", {}, {
    validateKey: true,
    typedKey,
  }) as Promise<BlotatoUser>;
}

// ─── Accounts ───────────────────────────────────────────────────

export async function listAccounts(
  _apiKey: string,
  platform?: Platform
): Promise<SocialAccount[]> {
  const args: Record<string, unknown> = {};
  if (platform) args.platform = platform;
  const result = await callTool(_apiKey, "blotato_list_accounts", args);
  if (result && typeof result === "object" && "items" in (result as any)) {
    return (result as any).items as SocialAccount[];
  }
  if (Array.isArray(result)) return result as SocialAccount[];
  return [];
}

export async function listSubaccounts(
  _apiKey: string,
  accountId: string
): Promise<SubAccount[]> {
  const result = await callTool(_apiKey, "blotato_list_subaccounts", { accountId });
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
  _apiKey: string,
  search?: string
): Promise<unknown> {
  const args: Record<string, unknown> = { fields: "id,description,inputs" };
  if (search) args.search = search;
  return callTool(_apiKey, "blotato_list_visual_templates", args);
}

// ─── Media Upload ───────────────────────────────────────────────

export interface MediaUploadResult {
  url: string;
  id: string;
}

export async function uploadMedia(
  _apiKey: string,
  url: string
): Promise<MediaUploadResult> {
  return callTool(_apiKey, "blotato_upload_media", { url }) as Promise<MediaUploadResult>;
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
  _apiKey: string,
  params: CreateVisualParams
): Promise<VisualCreation> {
  return callTool(_apiKey, "blotato_create_visual", {
    ...params,
    inputs: params.inputs ?? {},
    render: params.render ?? true,
  }) as Promise<VisualCreation>;
}

export async function getVisualStatus(
  _apiKey: string,
  id: string
): Promise<VisualCreation> {
  return callTool(_apiKey, "blotato_get_visual_status", {
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
  _apiKey: string,
  params: CreateSourceParams
): Promise<ContentSource> {
  return callTool(
    _apiKey,
    "blotato_create_source",
    params as unknown as Record<string, unknown>,
  ) as Promise<ContentSource>;
}

export async function getSourceStatus(
  _apiKey: string,
  id: string
): Promise<ContentSource> {
  return callTool(_apiKey, "blotato_get_source_status", {
    id,
  }) as Promise<ContentSource>;
}
