import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser } from "../_shared/auth.ts";
import { getUserConfig } from "../_shared/company-secrets.ts";

/**
 * Image Search Edge Function
 *
 * Gera imagens via Higgsfield Soul (text-to-image).
 *
 * Segurança:
 *  - Recebe { companyId, keywords, count?, orientation? } no body.
 *  - Valida membership ativo via helper.
 *  - Carrega higgsfield_api_id/secret de company_configs no servidor.
 *  - Sem credenciais Higgsfield: retorna placeholders em vez de erro
 *    (mantém o comportamento de fallback anterior).
 *  - Nunca aceita credenciais no header em fluxo operacional.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ImageResult {
  id: string;
  url: string;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  author: string;
  authorUrl: string;
  source: string; // "higgsfield" | "placeholder"
}

interface RequestBody {
  companyId?: string;
  keywords: string[];
  count?: number;
  orientation?: "landscape" | "portrait" | "squarish";
}

async function generateWithHiggsfield(
  apiId: string,
  apiSecret: string,
  keywords: string[],
  count: number,
  orientation: string,
): Promise<ImageResult[]> {
  const prompt = keywords.join(" ");
  const aspectRatio =
    orientation === "portrait" ? "9:16" :
    orientation === "landscape" ? "16:9" :
    "1:1";

  const results: ImageResult[] = [];

  const promises = Array.from({ length: count }, async () => {
    const response = await fetch("https://platform.higgsfield.ai/higgsfield-ai/soul/standard", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiId}:${apiSecret}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: aspectRatio,
        resolution: "720p",
      }),
    });

    if (!response.ok) {
      throw new Error(`Higgsfield API ${response.status}`);
    }

    const data = await response.json();
    const requestId = data.request_id;
    if (!requestId) throw new Error("Higgsfield não retornou request_id");

    const statusUrl = `https://platform.higgsfield.ai/requests/${requestId}/status`;
    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusRes = await fetch(statusUrl, {
        headers: {
          "Authorization": `Key ${apiId}:${apiSecret}`,
          "Accept": "application/json",
        },
      });
      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();
      if (statusData.status === "completed" && statusData.images?.length) {
        const imageUrl = statusData.images[0].url;
        return {
          id: requestId,
          url: imageUrl,
          thumbUrl: imageUrl,
          fullUrl: imageUrl,
          alt: keywords.join(", "),
          author: "Higgsfield Soul",
          authorUrl: "https://higgsfield.ai",
          source: "higgsfield",
        } as ImageResult;
      }
      if (statusData.status === "failed" || statusData.status === "nsfw") {
        throw new Error(`Higgsfield geração falhou: ${statusData.status}`);
      }
    }
    throw new Error("Higgsfield timeout - geração demorou demais");
  });

  const settled = await Promise.allSettled(promises);
  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) {
      results.push(result.value);
    }
  }
  return results;
}

function getPlaceholders(keywords: string[], count: number): ImageResult[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = encodeURIComponent(keywords.join("-") + i);
    return {
      id: `placeholder-${i}`,
      url: `https://picsum.photos/seed/${seed}/800/800`,
      thumbUrl: `https://picsum.photos/seed/${seed}/200/200`,
      fullUrl: `https://picsum.photos/seed/${seed}/1200/1200`,
      alt: keywords.join(", "),
      author: "Lorem Picsum",
      authorUrl: "https://picsum.photos",
      source: "placeholder" as const,
    };
  });
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

  const authResult = await requireUser(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const body: RequestBody = await req.json();
    const { keywords, count = 8, orientation = "squarish", companyId } = body;

    if (!keywords?.length) {
      return new Response(JSON.stringify({ error: "Missing 'keywords' array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let hfApiId: string | null = null;
    let hfApiSecret: string | null = null;

    if (companyId) {
      const cfg = await getUserConfig(authResult.user.id, corsHeaders);
      if (cfg instanceof Response) return cfg; // 403 se não for membro
      hfApiId = cfg.config.higgsfield_api_id;
      hfApiSecret = cfg.config.higgsfield_api_secret;
    }

    let images: ImageResult[] = [];
    if (hfApiId && hfApiSecret) {
      try {
        images = await generateWithHiggsfield(hfApiId, hfApiSecret, keywords, count, orientation);
      } catch (err) {
        console.error("Higgsfield falhou:", err instanceof Error ? err.message : err);
      }
    }

    if (images.length === 0) {
      images = getPlaceholders(keywords, count);
    }

    return new Response(JSON.stringify({ images }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("image-search error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
