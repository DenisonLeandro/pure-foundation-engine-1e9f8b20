/**
 * Helpers de segurança por empresa para Edge Functions.
 *
 * Padrão de uso (toda Edge Function que precise de chaves da empresa):
 *
 *   import { requireUser } from "../_shared/auth.ts";
 *   import { validateCompanyMembership, getCompanyConfig } from "../_shared/company-secrets.ts";
 *
 *   const auth = await requireUser(req, corsHeaders);
 *   if (auth instanceof Response) return auth;
 *
 *   const { companyId } = await req.json();
 *   const membership = await validateCompanyMembership(companyId, auth.user.id);
 *   if (membership instanceof Response) return membership; // 403
 *
 *   const cfg = await getCompanyConfig(companyId, auth.user.id);
 *   if (cfg instanceof Response) return cfg;
 *
 *   // use cfg.blotato_api_key, cfg.postforme_api_key, etc. APENAS no servidor.
 *   // NUNCA devolva chaves no JSON de resposta.
 *
 * Regras invioláveis:
 *  - Nunca confiar em companyId enviado pelo frontend sem validar membership.
 *  - Nunca devolver chaves/segredos no body da resposta.
 *  - Nunca expor SUPABASE_SERVICE_ROLE_KEY ao cliente.
 */

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export type CompanyRole = "owner" | "admin" | "editor";

export interface CompanyConfigRow {
  company_id: string;
  blotato_api_key: string | null;
  postforme_api_key: string | null;
  pexels_api_key: string | null;
  firecrawl_api_key: string | null;
  higgsfield_api_id: string | null;
  higgsfield_api_secret: string | null;
  openai_api_key: string | null;
  apify_api_token: string | null;
  elevenlabs_api_key: string | null;
  [key: string]: unknown;
}

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Cria um Supabase client com a SERVICE_ROLE para checagens internas (RLS-bypass).
 * NUNCA exponha este client/segredo ao cliente.
 */
function adminClient(): SupabaseClient | Response {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Valida que o usuário é membro ativo da empresa e retorna o papel.
 * Retorna Response 400/403 em caso de erro.
 */
export async function validateCompanyMembership(
  companyId: string | undefined | null,
  userId: string,
  corsHeaders: Record<string, string> = {},
): Promise<Response | { role: CompanyRole }> {
  if (!companyId || typeof companyId !== "string") {
    return jsonResponse({ error: "companyId obrigatório" }, 400, corsHeaders);
  }
  const admin = adminClient();
  if (admin instanceof Response) return admin;

  const { data, error } = await admin
    .from("company_members")
    .select("role, status")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "Falha ao validar empresa" }, 500, corsHeaders);
  }
  if (!data) {
    return jsonResponse({ error: "Forbidden: usuário não pertence à empresa" }, 403, corsHeaders);
  }
  return { role: data.role as CompanyRole };
}

/**
 * Exige que o usuário tenha um dos papéis permitidos na empresa.
 * Útil para ações restritas (ex.: gravar configuração, gerenciar membros).
 */
export async function requireCompanyRole(
  companyId: string | undefined | null,
  userId: string,
  allowedRoles: CompanyRole[],
  corsHeaders: Record<string, string> = {},
): Promise<Response | { role: CompanyRole }> {
  const result = await validateCompanyMembership(companyId, userId, corsHeaders);
  if (result instanceof Response) return result;
  if (!allowedRoles.includes(result.role)) {
    return jsonResponse(
      { error: `Forbidden: requer papel ${allowedRoles.join("/")}` },
      403,
      corsHeaders,
    );
  }
  return result;
}

/**
 * Busca chaves de API do usuário em user_configs.
 * NUNCA devolva este objeto (ou subcampos sensíveis) no body da resposta da função.
 *
 * Retorna config vazia (todas as chaves null) caso o usuário ainda não tenha registro.
 */
export async function getUserConfig(
  userId: string,
  corsHeaders: Record<string, string> = {},
): Promise<Response | { config: CompanyConfigRow }> {
  const admin = adminClient();
  if (admin instanceof Response) return admin;

  const { data, error } = await admin
    .from("user_configs")
    .select("postforme_api_key, blotato_api_key, pexels_api_key, firecrawl_api_key, higgsfield_api_id, higgsfield_api_secret, apify_api_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "Falha ao carregar config do usuário" }, 500, corsHeaders);
  }

  const config = (data ?? {
    postforme_api_key: null,
    blotato_api_key: null,
    pexels_api_key: null,
    firecrawl_api_key: null,
    higgsfield_api_id: null,
    higgsfield_api_secret: null,
    apify_api_token: null,
  }) as CompanyConfigRow;
  return { config };
}

/**
 * Busca chaves do DONO da empresa ativa (não do usuário logado).
 * Garante que funcionários/admins usem as chaves cadastradas pelo owner.
 * Valida que o requester é membro ativo da empresa.
 */
export async function getCompanyOwnerConfig(
  companyId: string | undefined | null,
  requesterUserId: string,
  corsHeaders: Record<string, string> = {},
): Promise<Response | { config: CompanyConfigRow; ownerUserId: string }> {
  const membership = await validateCompanyMembership(companyId, requesterUserId, corsHeaders);
  if (membership instanceof Response) return membership;

  const admin = adminClient();
  if (admin instanceof Response) return admin;

  const { data: ownerRow, error: ownerErr } = await admin
    .from("company_members")
    .select("user_id")
    .eq("company_id", companyId as string)
    .eq("role", "owner")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (ownerErr) {
    return jsonResponse({ error: "Falha ao localizar dono da empresa" }, 500, corsHeaders);
  }
  if (!ownerRow?.user_id) {
    return jsonResponse({ error: "Empresa sem dono ativo" }, 400, corsHeaders);
  }

  const cfg = await getUserConfig(ownerRow.user_id as string, corsHeaders);
  if (cfg instanceof Response) return cfg;
  return { config: cfg.config, ownerUserId: ownerRow.user_id as string };
}

/**
 * Resolve as chaves do DONO da empresa SEM validar um requester — para uso por
 * chamadas internas de serviço confiáveis (worker/tick do Autopilot, autenticadas
 * pela service role key). NUNCA exponha o resultado no body de uma resposta.
 * Retorna null se a empresa não existir ou não tiver dono ativo.
 */
export async function getCompanyOwnerConfigInternal(
  companyId: string | undefined | null,
): Promise<{ config: CompanyConfigRow; ownerUserId: string } | null> {
  if (!companyId) return null;
  const admin = adminClient();
  if (admin instanceof Response) return null;

  const { data: ownerRow } = await admin
    .from("company_members")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("role", "owner")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!ownerRow?.user_id) return null;

  const { data } = await admin
    .from("user_configs")
    .select("postforme_api_key, blotato_api_key, pexels_api_key, firecrawl_api_key, higgsfield_api_id, higgsfield_api_secret, apify_api_token")
    .eq("user_id", ownerRow.user_id as string)
    .maybeSingle();

  const config = (data ?? {}) as CompanyConfigRow;
  return { config, ownerUserId: ownerRow.user_id as string };
}

/**
 * Valida membership e retorna a linha de company_configs para uso INTERNO da edge.
 * NUNCA devolva este objeto (ou subcampos sensíveis) no body da resposta da função.
 *
 * Retorna config vazia (todas as chaves null) caso a empresa ainda não tenha registro.
 */
export async function getCompanyConfig(
  companyId: string | undefined | null,
  userId: string,
  corsHeaders: Record<string, string> = {},
): Promise<Response | { config: CompanyConfigRow; role: CompanyRole }> {
  const membership = await validateCompanyMembership(companyId, userId, corsHeaders);
  if (membership instanceof Response) return membership;

  const admin = adminClient();
  if (admin instanceof Response) return admin;

  const { data, error } = await admin
    .from("company_configs")
    .select("*")
    .eq("company_id", companyId as string)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "Falha ao carregar config da empresa" }, 500, corsHeaders);
  }

  const config = (data ?? { company_id: companyId as string }) as CompanyConfigRow;
  return { config, role: membership.role };
}
