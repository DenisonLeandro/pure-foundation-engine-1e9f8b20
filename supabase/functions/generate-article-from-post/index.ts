import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";
import { validateCompanyMembership } from "../_shared/company-secrets.ts";

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

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[generate-article-from-post] AI Gateway error:", response.status, errText);
    throw new Error(`Lovable AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.choices?.[0]?.message?.content;
  if (!textContent) {
    throw new Error("No content in AI response");
  }
  return textContent;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const auth = await requireUser(req, corsHeaders);
    if (auth instanceof Response) return auth;

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

    const membership = await validateCompanyMembership(creation.company_id, auth.user.id, corsHeaders);
    if (membership instanceof Response) return membership;

    // Extract content from creation
    const postContent = creation.prompt || creation.caption || "";
    if (!postContent.trim()) {
      return errorResponse("No content found in creation", 400);
    }

    // Generate article content using AI
    const articleTitle = title || postContent.split("\n")[0].slice(0, 50);
    const prompt = `Você é um redator especializado em conteúdo jurídico de alta qualidade para sites e blogs de advocacia.

Sua tarefa é transformar o seguinte conteúdo de post em um ARTIGO PROFISSIONAL, INFORMATIVO E PERSUASIVO:

"${postContent}"

REQUISITOS OBRIGATÓRIOS:
1. ESTRUTURA: Use subtítulos bem organizados (máx. 2-3 níveis)
2. INTRODUÇÃO: Um parágrafo forte que:
   - Apresente a relevância do tema
   - Mostre por que o leitor deve se importar
   - Crie conexão emocional com o problema

3. DESENVOLVIMENTO: 6-8 parágrafos que:
   - Expliquem detalhadamente o assunto
   - Incluam exemplos práticos e reais
   - Destaquem benefícios e consequências
   - Use linguagem acessível mas profissional
   - Anticipe dúvidas do leitor

4. BENEFÍCIOS/OPORTUNIDADES: Um parágrafo que:
   - Enumere benefícios de agir corretamente
   - Mostre riscos de não fazer nada
   - Inspire confiança

5. CALL-TO-ACTION: Fechamento que:
   - Convide o leitor a buscar ajuda profissional
   - Seja gentil e sem pressão
   - Use frases como "entre em contato", "agende uma consulta"

TOM:
- Profissional, mas acessível
- Educativo e informativo
- Confiável e autoridade
- Que demonstra expertise
- Que convida contato (sem ser agressivo)

FORMATAÇÃO:
- Parágrafos bem distribuídos (3-5 linhas cada)
- Linguagem clara e direta
- Sem jargão desnecessário

RESPONDA APENAS COM O CORPO DO ARTIGO, SEM PREFÁCIOS OU COMENTÁRIOS.`;

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
