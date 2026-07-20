import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser } from "../_shared/auth.ts";
import { logGatewayChat } from "../_shared/usage-log.ts";
import { getCompanyOwnerConfig } from "../_shared/company-secrets.ts";

/**
 * Source Extract — substitui blotato_create_source para extração de conteúdo.
 * URLs → Firecrawl scrape (conteúdo real da página).
 * Texto puro → sumariza via Lovable AI Gateway.
 *
 * Segurança:
 *  - Recebe { companyId, sourceType, url?, text?, customInstructions? } no body.
 *  - Valida membership ativo.
 *  - Busca firecrawl_api_key no servidor via getCompanyConfig.
 *  - Nunca aceita chave no header em fluxo operacional.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  companyId?: string;
  sourceType: string; // "url" | "youtube" | "text" | "article"
  url?: string;
  text?: string;
  customInstructions?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const { sourceType, url, text, customInstructions, companyId }: RequestBody = await req.json();
    if (!sourceType) {
      return new Response(JSON.stringify({ error: "Missing 'sourceType'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let rawContent = "";
    let title = "";

    const needsFirecrawl = !!url && (sourceType === "url" || sourceType === "youtube" || sourceType === "article");

    if (needsFirecrawl) {
      if (!companyId) {
        return new Response(JSON.stringify({ error: "Empresa não informada." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const cfg = await getCompanyOwnerConfig(companyId, auth.user.id, corsHeaders);
      if (cfg instanceof Response) return cfg;
      const firecrawlKey = cfg.config.firecrawl_api_key;
      if (!firecrawlKey) {
        return new Response(
          JSON.stringify({ error: "Firecrawl não configurado para esta empresa." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      });

      if (!scrapeRes.ok) {
        const errText = await scrapeRes.text();
        return new Response(
          JSON.stringify({ error: `Firecrawl ${scrapeRes.status}: ${errText.slice(0, 200)}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const scrapeData = await scrapeRes.json();
      rawContent = scrapeData?.data?.markdown || scrapeData?.markdown || "";
      title = scrapeData?.data?.metadata?.title || scrapeData?.metadata?.title || url!;
    } else if (text) {
      rawContent = text;
      title = text.slice(0, 80).split("\n")[0] || "Texto fornecido";
    } else {
      return new Response(JSON.stringify({ error: "Forneça 'url' ou 'text'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sumarizar o conteúdo com IA (Lovable AI Gateway)
    let content = rawContent.slice(0, 8000);
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableKey && rawContent.length > 200) {
      try {
        const instructions = customInstructions ? `\n\nInstruções adicionais: ${customInstructions}` : "";
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: `Você é um extrator de conteúdo. Resuma o texto em português brasileiro, preservando os pontos-chave, dados e citações relevantes. Máximo 1500 palavras.${instructions}` },
              { role: "user", content: rawContent.slice(0, 12000) },
            ],
            temperature: 0.3,
            max_tokens: 2048,
          }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          await logGatewayChat(aiData, { feature: "source_extract", model: "google/gemini-3-flash-preview", companyId, userId: auth.user.id });
          const summary = aiData.choices?.[0]?.message?.content;
          if (summary) content = summary;
        }
      } catch { /* usa rawContent cortado */ }
    }

    const id = crypto.randomUUID();
    return new Response(JSON.stringify({
      id,
      status: "completed",
      title,
      content,
      sourceType,
      referenceUrl: url || null,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("source-extract error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
