import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser } from "../_shared/auth.ts";
import { logApiUsage } from "../_shared/usage-log.ts";

/**
 * AI Content Generation Edge Function
 * Uses Google Gemini API for text generation
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLATFORM_GUIDELINES: Record<string, string> = {
  instagram: `Instagram: até 2200 chars. Use emojis, quebras de linha, 5-10 hashtags relevantes no final. Tom visual e inspirador. Inclua CTA.`,
  twitter: `Twitter/X: máximo 280 chars. Conciso, direto, hook forte. 1-2 hashtags. Tom conversacional.`,
  facebook: `Facebook: até 500 chars ideal. Tom pessoal e engajador. Perguntas para gerar comentários.`,
  linkedin: `LinkedIn: até 1300 chars ideal. Tom profissional. Storytelling com lições práticas. 3-5 hashtags.`,
  tiktok: `TikTok: até 300 chars. Linguagem jovem e direta. Emojis. Hook forte.`,
  pinterest: `Pinterest: até 500 chars. Descritivo e útil. Keywords para SEO.`,
  threads: `Threads: até 500 chars. Tom casual e autêntico.`,
  bluesky: `Bluesky: até 300 chars. Tom casual e inteligente.`,
  youtube: `YouTube (descrição): até 500 chars. SEO-friendly. CTA para inscrição.`,
};

interface RequestBody {
  prompt: string;
  platforms: string[];
  tone?: string;
  language?: string;
  sourceContent?: string;
  brandProfile?: {
    name: string;
    description?: string;
    tone: string;
    targetAudience?: string;
    industry?: string;
    keywords?: string[];
    avoidWords?: string[];
    examplePosts?: string[];
    systemPrompt?: string;
  };
  companyId?: string;
  fidelity?: "improve" | "literal";
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
    const body: RequestBody = await req.json();
    const { prompt, platforms, tone, language, sourceContent, brandProfile, companyId, fidelity } = body;

    if (!prompt || !platforms?.length) {
      return new Response(
        JSON.stringify({ error: "Missing 'prompt' and 'platforms'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = language || "português brasileiro";
    const toneGuide = brandProfile?.tone || tone || "profissional mas acessível";

    let brandContext = "";
    if (brandProfile) {
      const parts: string[] = [];
      parts.push(`PERFIL DA MARCA: ${brandProfile.name}`);
      if (brandProfile.description) parts.push(`Sobre: ${brandProfile.description}`);
      parts.push(`Tom de voz: ${brandProfile.tone}`);
      if (brandProfile.targetAudience) parts.push(`Público-alvo: ${brandProfile.targetAudience}`);
      if (brandProfile.industry) parts.push(`Setor: ${brandProfile.industry}`);
      if (brandProfile.keywords?.length) parts.push(`Palavras-chave: ${brandProfile.keywords.join(", ")}`);
      if (brandProfile.avoidWords?.length) parts.push(`NUNCA use: ${brandProfile.avoidWords.join(", ")}`);
      if (brandProfile.examplePosts?.length) {
        parts.push(`Exemplos de posts:`);
        brandProfile.examplePosts.forEach((p, i) => parts.push(`  ${i + 1}. ${p}`));
      }
      if (brandProfile.systemPrompt) parts.push(`Instruções adicionais: ${brandProfile.systemPrompt}`);
      brandContext = `\n\n${parts.join("\n")}`;
    }

    const platformInstructions = platforms
      .map((p) => PLATFORM_GUIDELINES[p] || `${p}: crie conteúdo adequado.`)
      .join("\n\n");

    const sourceContext = sourceContent
      ? `\n\nCONTEÚDO DE REFERÊNCIA:\n---\n${sourceContent.slice(0, 3000)}\n---`
      : "";

    let systemPrompt: string;
    if (fidelity === "literal") {
      systemPrompt = `Você é uma agência de marketing digital. Seu trabalho é usar o texto do usuário EXATAMENTE COMO ESTÁ ESCRITO para os posts, sem reescrever, sem parafrasear, sem melhorar. Você pode gerar hashtags, headings de slides para imagem, e metadados visuais, mas a legenda principal (posts) deve ser IDÊNTICA ao texto do usuário.${brandContext}

MODO LITERAL — CRÍTICO:
- A mensagem do usuário É A LEGENDA FINAL. Use-a palavra por palavra, sem mudanças.
- Os posts (para cada plataforma) devem ser IDÊNTICOS ao texto do usuário.
- APENAS gere: headings para slides (se carrossel), hashtags, keywords de imagem, mood visual.
- EXTRAIR TEMA: Identifique qual é o REAL TEMA DO POST (não descrições técnicas de imagem). Retorne em "extractedTheme".
- Linguagem: ${lang}

FORMATO DE RESPOSTA (JSON puro):
{
  "posts": {
    "<platform>": "${prompt}"
  },
  "carousel": {
    "title": "${prompt.slice(0, 50)}",
    "slides": [
      { "heading": "<frase para slide 1>", "body": "<apoio 1-2 linhas>" }
    ]
  },
  "extractedTheme": "<o real tema/assunto do post, sem descrição de imagem>",
  "imageKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "visualSuggestion": "slideshow",
  "moodSuggestion": "editorial",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`;
    } else {
      systemPrompt = `Você é uma agência de marketing digital completa. Crie uma campanha de conteúdo em ${lang}.${brandContext}

REGRA MÁXIMA (prioridade sobre todas as outras abaixo):
- Se a mensagem do usuário contiver uma linha "TÍTULO EXATO (...)" com um texto entre aspas, esse texto é uma ORDEM LITERAL: use-o exatamente como está escrito — sem corrigir, sem reescrever, sem parafrasear, sem trocar uma palavra — como título do carrossel ("carousel.title") e/ou heading do primeiro slide. NUNCA troque o título exigido por uma versão "mais criativa" sua.
- PRESERVE a mensagem, os fatos, números, ofertas e dados EXATAMENTE como o usuário escreveu. Você pode apenas melhorar clareza, ritmo, formatação e estrutura. NUNCA invente dados, preços, promessas ou afirmações que não estejam no texto original.
- EXTRAIR TEMA: Identifique qual é o REAL TEMA DO POST (a parte de conteúdo relevante, ignorando descrições técnicas de imagem/visual). Retorne em "extractedTheme".

REGRAS IMPORTANTES:
- OBRIGATÓRIO: Todo o conteúdo DEVE ser em português brasileiro (pt-BR). Nunca gere textos em inglês ou outro idioma.
- Tom: ${toneGuide}
- Cada plataforma deve ter conteúdo DIFERENTE e OTIMIZADO
- NÃO inclua prefixos como "Instagram:" no texto dos posts
- O carrossel deve ter 4-6 slides com frases impactantes e concisas
- Keywords de busca de imagem devem ser em português brasileiro
- Hashtags devem ser em português brasileiro, no máximo 5 e relevantes (sem genéricas demais)
- Responda APENAS com JSON válido, sem markdown, sem code blocks

REGRAS DE LEGENDA (CRÍTICAS — evite o "tom genérico de IA"):
- VARIE a abertura. NUNCA comece com "Você sabia?", "Fique atento!", "Salve este post", "Procure um advogado" ou "Entre em contato".
- Use aberturas naturais: contexto, observação, pergunta sutil, micro-história, dado concreto.
- Linguagem natural, profissional, clara. Sem sensacionalismo, sem clickbait, sem promessa de resultado.
- Sem chamada comercial agressiva. Sem captação indevida.
- No máximo 2 emojis pontuais por legenda (ou nenhum). Sem excesso de emojis.
- Estrutura recomendada: abertura contextual → explicação curta → ponto prático → chamada leve para refletir/salvar/compartilhar (opcional).
- Para tema JURÍDICO: caráter exclusivamente educativo. NÃO prometa direito ou ganho, NÃO diga "você tem direito" sem ressalva, NÃO induza contratação, NÃO faça captação. Mantenha tom informativo e responsável.
- Cada legenda deve soar diferente das outras — evite frases-clichê repetidas entre posts.

DIRETRIZES POR PLATAFORMA:
${platformInstructions}

ESTILO VISUAL ("moodSuggestion") — escolha 1 com base no TOM do tema, não use sempre o mesmo:
- "institutional": temas jurídicos, sérios, corporativos, formais → tipografia sóbria, sem brilho.
- "editorial": temas de marca/lifestyle/autoridade, tom elegante e confiante.
- "energetic": temas leves, divertidos, esportivos, datas comemorativas, entretenimento → tipografia bold em caixa alta, tom vibrante.
- "modern": temas de tecnologia, inovação, negócios modernos.
- "minimal": temas calmos, bem-estar, reflexivos, com pouco texto.
Escolha o que realmente combina com o TEMA recebido — dois temas diferentes (ex.: um post jurídico e um post sobre um evento esportivo) NUNCA devem receber o mesmo moodSuggestion.

FORMATO DE RESPOSTA (JSON puro):
{
  "posts": {
    "<platform>": "<texto do post>"
  },
  "carousel": {
    "title": "<título do carrossel>",
    "slides": [
      { "heading": "<frase curta impactante>", "body": "<texto de apoio 1-2 linhas>" }
    ]
  },
  "extractedTheme": "<o real tema/assunto do post, sem descrição técnica de imagem>",
  "imageKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "visualSuggestion": "<tipo: tutorial-carousel | quote-card | infographic | slideshow>",
  "moodSuggestion": "<institutional | editorial | energetic | modern | minimal>",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`;
    }

    const userMessage = `Crie uma campanha completa para: ${platforms.join(", ")}

TEMA: ${prompt}${sourceContext}

Gere: posts por plataforma + carrossel de 4-6 slides + 5 keywords para busca de imagens + sugestão de visual + 5 hashtags.

Responda com JSON puro.`;

    // Use Lovable AI Gateway
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY não configurada.");
    }

    console.log("[generate-content] Calling Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[generate-content] AI Gateway error:", response.status, errText);
      if (response.status === 429) {
        throw new Error("Rate limit excedido. Tente novamente em alguns segundos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.");
      }
      throw new Error(`Erro na API de IA ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;

    if (!textContent) {
      throw new Error("Sem conteúdo na resposta da IA");
    }

    console.log("[generate-content] Got AI response, parsing JSON...");

    let parsed: Record<string, unknown>;
    try {
      const cleaned = textContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const posts: Record<string, string> = {};
      for (const p of platforms) posts[p] = textContent;
      parsed = {
        posts,
        carousel: { title: prompt, slides: [{ heading: prompt, body: textContent.slice(0, 100) }] },
        imageKeywords: prompt.split(" ").slice(0, 5),
        visualSuggestion: "tutorial-carousel",
        moodSuggestion: "editorial",
        hashtags: [],
      };
    }

    console.log("[generate-content] Success!");

    const totalTokens = data.usage?.total_tokens;
    await logApiUsage({
      companyId,
      userId: auth.user.id,
      service: "gemini",
      operation: "default",
      units: typeof totalTokens === "number" ? totalTokens / 1000 : 2,
      unitType: "1k_tokens",
      metadata: { model: "google/gemini-3-flash-preview", platforms, totalTokens },
    });

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("generate-content error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
