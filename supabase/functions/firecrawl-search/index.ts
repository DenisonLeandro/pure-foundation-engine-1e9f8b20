import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser } from "../_shared/auth.ts";
import { getCompanyOwnerConfig } from "../_shared/company-secrets.ts";
import { logApiUsage } from "../_shared/usage-log.ts";

/**
 * Firecrawl Search Proxy
 *
 * Fluxo operacional: { companyId, query, limit } no body.
 *  - Valida membership ativo via helper.
 *  - Busca firecrawl_api_key em company_configs (server-side, SERVICE_ROLE).
 *
 * Fluxo de validação manual (chave recém-digitada por Dono/Admin no Setup):
 *  - { validateKey: true } no body + header x-firecrawl-api-key com a chave digitada.
 *  - NUNCA usar chave salva nesse caminho.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-firecrawl-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SearchRequest {
  companyId?: string;
  query: string;
  limit?: number;
  lang?: string;
  validateKey?: boolean;
}

async function callFirecrawl(apiKey: string, query: string, limit: number, lang: string) {
  const response = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit,
      lang,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });
  return response;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const body: SearchRequest = await req.json();
    const { query, limit = 5, lang = "pt-br", validateKey, companyId } = body;

    if (!query) {
      return new Response(JSON.stringify({ error: "Missing 'query' in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let apiKey: string | null = null;

    if (validateKey) {
      // Validação manual: usa SOMENTE a chave digitada via header.
      apiKey = req.headers.get("x-firecrawl-api-key");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Chave não fornecida para validação" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Fluxo operacional: valida membership e busca chave no servidor.
      if (!companyId) {
        return new Response(JSON.stringify({ error: "Empresa não informada." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const cfg = await getCompanyOwnerConfig(companyId, auth.user.id, corsHeaders);
      if (cfg instanceof Response) return cfg;
      apiKey = cfg.config.firecrawl_api_key;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Firecrawl não configurado para esta empresa." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    console.log(`[firecrawl-search] Searching: "${query}" (limit=${limit})`);

    const response = await callFirecrawl(apiKey, query, limit, lang);

    if (!response.ok) {
      const errText = await response.text();
      console.error("[firecrawl-search] API error:", response.status, errText);
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "INSUFFICIENT_CREDITS",
            message: "Firecrawl está sem créditos. Faça upgrade em https://firecrawl.dev/pricing.",
            fallback: true,
            results: [],
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: `Firecrawl API ${response.status}: ${errText.slice(0, 200)}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const results = (data.data || []).map((item: Record<string, unknown>) => ({
      url: item.url || "",
      title: (item.metadata as any)?.title || item.title || "",
      markdown: typeof item.markdown === "string" ? item.markdown.slice(0, 2000) : "",
    }));

    console.log(`[firecrawl-search] Found ${results.length} results`);

    if (!validateKey) {
      await logApiUsage({
        companyId,
        userId: auth.user.id,
        service: "firecrawl",
        operation: "default",
        units: 1,
        unitType: "search",
        metadata: { query, limit, resultCount: results.length },
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("firecrawl-search error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
