import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser } from "../_shared/auth.ts";
import { getCompanyOwnerConfig } from "../_shared/company-secrets.ts";

/**
 * Stock Image Search — banco de imagens REAL (Pexels).
 * Chave da empresa é carregada no servidor a partir de company_configs.
 * O cliente NÃO envia x-pexels-api-key.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  companyId: string;
  query: string;
  count?: number;
  orientation?: "landscape" | "portrait" | "squarish";
}

interface StockImage {
  id: string;
  url: string;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  author: string;
  authorUrl: string;
  source: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as Partial<RequestBody>;
    const { companyId, query, count = 12, orientation = "squarish" } = body;

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "Missing 'query'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfgResult = await getCompanyOwnerConfig(companyId, auth.user.id, corsHeaders);
    if (cfgResult instanceof Response) return cfgResult; // 400/403/500

    const apiKey = cfgResult.config.pexels_api_key;
    if (!apiKey) {
      console.warn("[stock-search] pexels_api_key ausente", { companyId, ownerUserId: cfgResult.ownerUserId, requesterUserId: auth.user.id });
      return new Response(
        JSON.stringify({ error: "Pexels não configurado para esta empresa." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pexelsOrientation = orientation === "squarish" ? "square" : orientation;
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query.trim());
    url.searchParams.set("per_page", String(Math.min(count, 30)));
    url.searchParams.set("orientation", pexelsOrientation);
    url.searchParams.set("locale", "pt-BR");

    const res = await fetch(url.toString(), { headers: { Authorization: apiKey } });
    if (!res.ok) {
      const txt = await res.text();
      console.error("[stock-search] Pexels error:", res.status, txt);
      const msg = res.status === 401 ? "Chave Pexels inválida." : `Pexels ${res.status}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: res.status === 401 ? 401 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const images: StockImage[] = (data.photos || []).map((p: {
      id: number; alt?: string; photographer?: string; photographer_url?: string;
      src?: { original?: string; large?: string; medium?: string; tiny?: string };
    }) => ({
      id: String(p.id),
      url: p.src?.large || p.src?.medium || p.src?.original || "",
      thumbUrl: p.src?.tiny || p.src?.medium || "",
      fullUrl: p.src?.original || p.src?.large || "",
      alt: p.alt || query.trim(),
      author: p.photographer || "Pexels",
      authorUrl: p.photographer_url || "https://www.pexels.com",
      source: "pexels",
    }));

    return new Response(JSON.stringify({ images }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("stock-search error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
