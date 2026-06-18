import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

async function callLovableAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const response = await fetch("https://api.lovable.ai/generate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Lovable API error: ${response.status}`);
  }

  const data = await response.json();
  return data.text || "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { creation_id, title } = await req.json();

    if (!creation_id) {
      return errorResponse("Missing 'creation_id'", 400);
    }

    const sb = supabaseAdmin();

    // Fetch the creation/post
    const { data: creation, error: fetchError } = await sb
      .from("creations")
      .select("*")
      .eq("id", creation_id)
      .single();

    if (fetchError || !creation) {
      return errorResponse("Creation not found", 404);
    }

    // Extract content from creation
    const postContent = creation.prompt || creation.caption || "";
    if (!postContent.trim()) {
      return errorResponse("No content found in creation", 400);
    }

    // Generate article content using AI
    const articleTitle = title || postContent.split("\n")[0].slice(0, 50);
    const prompt = `Você é um redator profissional de artigos jurídicos.

A partir do seguinte conteúdo de um post para redes sociais:
"${postContent}"

Expanda isso em um artigo completo, bem estruturado e informativo com:
- Introdução contextual (2-3 parágrafos)
- Desenvolvimento detalhado do tema (5-7 parágrafos)
- Conclusão e próximos passos (2-3 parágrafos)

O artigo deve ser profissional, informativo e sem captação comercial agressiva.
Mantenha o tom educativo e responsável.
Procure estruturar bem com subtítulos quando apropriado.

Responda APENAS com o conteúdo do artigo, sem introduções ou comentários.`;

    // For now, since Lovable API might not be available, we'll use Claude via the AI gateway
    // In a real scenario, you'd call your AI provider here
    const articleContent = await callLovableAI(prompt);

    console.log(`[generate-article-from-post] Generated article from creation ${creation_id}`);

    return jsonResponse({
      title: articleTitle,
      content: articleContent,
      excerpt: postContent.slice(0, 150) + "...",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-article-from-post] Error:", message);
    return errorResponse(message, 502);
  }
});
