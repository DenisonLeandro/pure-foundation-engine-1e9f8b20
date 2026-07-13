import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser, isInternalServiceCall } from "../_shared/auth.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { logApiUsage } from "../_shared/usage-log.ts";

/**
 * OpenAI Image proxy — geração e edição.
 *
 * - Sem `image` no corpo → geração (`/v1/images/generations`).
 * - Com `image` (data URL ou http URL) → edição (`/v1/images/edits`): a IA
 *   repinta a imagem enviada seguindo o `prompt`. Usado pelo Modo 1 do Studio
 *   ("IA cria a arte completa") para refinar a arte por uma caixa de texto.
 *
 * Resolução da chave (nesta ordem):
 *   1. header `x-openai-api-key` (chave por-usuário, opcional)
 *   2. Supabase Vault via RPC public.get_vault_secret (chave da plataforma)
 *   3. env OPENAI_API_KEY (fallback)
 *
 * A chave nunca trafega no bundle do cliente nem no git.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-openai-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_IMAGE_MODEL = "gpt-image-2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function resolveOpenAiKey(headerKey: string | null): Promise<string | null> {
  // Só usamos OpenAI direto quando o usuário fornecer explicitamente sua
  // própria chave via header `x-openai-api-key`. Caso contrário roteamos via
  // Lovable AI Gateway (que suporta `openai/gpt-image-2` com a mesma
  // qualidade e evita o problema de o modelo não existir na API direta).
  if (headerKey?.trim()) return headerKey.trim();
  return null;
}

/** Converte uma data URL (base64) ou http URL numa Blob para upload multipart. */
async function imageToBlob(src: string): Promise<{ blob: Blob; filename: string }> {
  if (/^https?:\/\//i.test(src)) {
    const r = await fetch(src);
    const blob = await r.blob();
    const type = blob.type || "image/png";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    return { blob, filename: `image.${ext}` };
  }
  const comma = src.indexOf(",");
  const meta = comma >= 0 ? src.slice(0, comma) : "";
  const b64 = comma >= 0 ? src.slice(comma + 1) : src;
  const mime = /data:(.*?);base64/.exec(meta)?.[1] || "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return { blob: new Blob([bytes], { type: mime }), filename: `image.${ext}` };
}

function parseImages(data: { data?: Array<{ b64_json?: string; url?: string }> }): string[] {
  return (data.data || [])
    .map((d) => (d.b64_json ? `data:image/png;base64,${d.b64_json}` : d.url))
    .filter((u): u is string => !!u);
}

interface RequestBody {
  prompt: string;
  size?: string;        // gpt-image-2 aceita dims custom (múltiplos de 16). Ex.: "1024x1280" (4:5), "1024x1024", "1024x1536", "auto"
  n?: number;
  model?: string;
  quality?: string;     // gpt-image: "low" | "medium" | "high" | "auto"
  background?: string;  // "transparent" | "opaque" | "auto"
  companyId?: string;
  image?: string;       // presente → modo edição (data URL ou http URL)
  userId?: string;      // só em chamadas internas (worker) — para o log de uso
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Chamada interna do Autopilot (worker/tick) reusa esta função sem JWT de
  // usuário; do contrário, exige usuário autenticado (comportamento original).
  const internal = isInternalServiceCall(req);
  let userId: string | undefined;
  if (!internal) {
    const auth = await requireUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    userId = auth.user.id;
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { prompt, size = "1024x1024", n = 1, model, quality, background, companyId, image } = body;
    if (internal && body.userId) userId = body.userId;
    const isEdit = typeof image === "string" && image.length > 0;

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Missing 'prompt'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = await resolveOpenAiKey(req.headers.get("x-openai-api-key"));

    // Fallback: sem chave OpenAI → usa Lovable AI Gateway (Gemini image).
    // Gemini aceita imagem de entrada, então também cobre a edição.
    if (!apiKey) {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableKey) {
        return new Response(
          JSON.stringify({ error: "Nenhuma chave de imagem disponível (OpenAI ou Lovable AI)." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      try {
        // Roteia via Lovable AI Gateway. Para GERAÇÃO usamos openai/gpt-image-2
        // (mantém a qualidade). Para EDIÇÃO usamos Gemini (aceita imagem de
        // entrada no shape chat).
        const useGemini = isEdit;
        const gwModel = useGemini ? "google/gemini-2.5-flash-image" : "openai/gpt-image-2";
        console.log(`[openai-image] Lovable AI ${isEdit ? "edit" : "generate"} model=${gwModel} size=${size} n=${n}`);

        // Streaming (SSE) para evitar timeout do edge runtime em gerações
        // longas (gpt-image-2 high @ 1024x1280 pode levar 2+ minutos). Sem
        // stream, o `await` fica ocioso e a plataforma derruba a conexão →
        // 504. Com stream, chegam eventos periódicos e a conexão fica viva.
        // A UI só precisa da imagem final — descartamos os parciais.
        const gwBody: Record<string, unknown> = useGemini
          ? {
              model: gwModel,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: image } },
                  ],
                },
              ],
              modalities: ["image", "text"],
              n,
              stream: true,
            }
          : {
              model: gwModel,
              prompt,
              size,
              n,
              quality: quality || "medium",
              stream: true,
              partial_images: 1,
            };

        const gwResp = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
            "X-Lovable-AIG-SDK": "edge-function",
          },
          body: JSON.stringify(gwBody),
        });

        if (!gwResp.ok) {
          const errText = await gwResp.text();
          console.error("[openai-image] Lovable AI error:", gwResp.status, errText);
          let msg = `Lovable AI ${gwResp.status}`;
          try { msg = JSON.parse(errText)?.error?.message || msg; } catch { /* keep raw */ }
          if (gwResp.status === 429) msg = "Limite de uso da IA atingido. Tente novamente em alguns segundos.";
          if (gwResp.status === 402) msg = "Créditos de IA esgotados. Adicione créditos ao workspace em Configurações → Workspace → Uso.";
          return new Response(JSON.stringify({ error: msg }), {
            status: gwResp.status === 429 || gwResp.status === 402 ? gwResp.status : 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!gwResp.body) {
          return new Response(JSON.stringify({ error: "Lovable AI retornou stream vazio." }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const encoder = new TextEncoder();
        let gatewayReader: ReadableStreamDefaultReader<string> | null = null;

        return new Response(new ReadableStream<Uint8Array>({
          async start(controller) {
            let heartbeat: number | undefined;
            let closed = false;

            const write = (chunk: string) => {
              if (!closed) controller.enqueue(encoder.encode(chunk));
            };
            const close = () => {
              if (closed) return;
              closed = true;
              if (heartbeat !== undefined) clearInterval(heartbeat);
              controller.close();
            };
            const fail = (message: string) => {
              console.error("[openai-image] stream error:", message);
              write(JSON.stringify({ error: message }));
              close();
            };

            try {
              // Envia whitespace válido em JSON enquanto a imagem renderiza.
              // Assim `response.json()` continua funcionando, mas a conexão não
              // fica ociosa por 150s+ e não cai em 504.
              write("\n");
              heartbeat = setInterval(() => write("\n"), 10000);

              // Parser SSE simples: acumula linhas até um bloco terminar em \n\n.
              // Cada evento tem opcionalmente `event: <name>` e um `data: <json>`.
              gatewayReader = gwResp.body!.pipeThrough(new TextDecoderStream()).getReader();
              let buffer = "";
              let finalImage: string | null = null;
              let streamError: string | null = null;
              let completed = false;

              const handleEvent = (eventName: string, dataStr: string) => {
                if (!dataStr || dataStr === "[DONE]") return;
                let payload: any = null;
                try { payload = JSON.parse(dataStr); } catch { /* ignore */ }
                if (!payload) return;

                // Erro (por nome do evento OU payload.type === "error")
                if (eventName === "error" || payload.type === "error") {
                  streamError = payload?.error?.message || "Falha ao gerar imagem.";
                  return;
                }

                const type = eventName || payload.type;
                if (type === "image_generation.completed" && payload.b64_json) {
                  finalImage = `data:image/png;base64,${payload.b64_json}`;
                  completed = true;
                }
                // image_generation.partial_image → descartado; UI atual só usa final.
              };

              while (true) {
                const { value, done } = await gatewayReader.read();
                if (done) break;
                buffer += value;

                // Processa blocos completos separados por \n\n (ou \r\n\r\n).
                let sepIdx: number;
                while ((sepIdx = buffer.search(/\r?\n\r?\n/)) !== -1) {
                  const rawEvent = buffer.slice(0, sepIdx);
                  buffer = buffer.slice(sepIdx).replace(/^\r?\n\r?\n/, "");

                  let eventName = "";
                  const dataLines: string[] = [];
                  for (const line of rawEvent.split(/\r?\n/)) {
                    if (!line || line.startsWith(":")) continue; // comentário SSE
                    if (line.startsWith("event:")) eventName = line.slice(6).trim();
                    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
                  }
                  if (dataLines.length) handleEvent(eventName, dataLines.join("\n"));
                }
              }

              if (streamError) {
                fail(streamError);
                return;
              }
              if (!finalImage || !completed) {
                fail("Stream terminou sem imagem final.");
                return;
              }

              const images = [finalImage];

              await logApiUsage({
                companyId,
                userId,
                service: useGemini ? "gemini" : "openai_image",
                operation: isEdit ? "image_edit" : "image",
                units: images.length,
                unitType: "image",
                metadata: { model: gwModel, fallback: true, edit: isEdit, via: "lovable-gateway", stream: true },
              });

              write(JSON.stringify({ images, model: gwModel }));
              close();
            } catch (streamErr) {
              const m = streamErr instanceof Error ? streamErr.message : String(streamErr);
              fail(m);
            } finally {
              if (heartbeat !== undefined) clearInterval(heartbeat);
              try { await gatewayReader?.cancel(); } catch { /* noop */ }
            }
          },
          async cancel() {
            try { await gatewayReader?.cancel(); } catch { /* noop */ }
          },
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erro desconhecido no fallback Lovable AI";
        console.error("[openai-image] fallback error:", message);
        return new Response(JSON.stringify({ error: message }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const resolvedModel = model || DEFAULT_IMAGE_MODEL;
    const resolvedQuality = quality || "medium";
    let resp: Response;

    if (isEdit) {
      // Edição: multipart/form-data com a imagem de entrada. NÃO definir
      // Content-Type manualmente — o fetch adiciona o boundary do multipart.
      const { blob, filename } = await imageToBlob(image as string);
      const form = new FormData();
      form.append("model", resolvedModel);
      form.append("prompt", prompt);
      form.append("image", blob, filename);
      form.append("size", size);
      form.append("quality", resolvedQuality);
      console.log(`[openai-image] EDIT model=${resolvedModel} size=${size}`);
      resp = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}` },
        body: form,
      });
    } else {
      const payload: Record<string, unknown> = {
        model: resolvedModel,
        prompt,
        n,
        size,
        quality: resolvedQuality,
      };
      if (background) payload.background = background;
      console.log(`[openai-image] model=${resolvedModel} size=${size} n=${n}`);
      resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[openai-image] OpenAI error:", resp.status, errText);
      let msg = `OpenAI ${resp.status}`;
      try { msg = JSON.parse(errText)?.error?.message || msg; } catch { /* keep raw */ }
      if (resp.status === 401) msg = "Chave OpenAI inválida.";
      if (resp.status === 429) msg = "Limite de taxa ou créditos OpenAI excedido.";
      return new Response(JSON.stringify({ error: msg }), {
        status: resp.status === 401 ? 401 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const images = parseImages(data);

    await logApiUsage({
      companyId,
      userId,
      service: "openai_image",
      operation: isEdit ? "edit" : "default",
      units: images.length,
      unitType: "image",
      metadata: { model: resolvedModel, size, quality: resolvedQuality, edit: isEdit },
    });

    return new Response(JSON.stringify({ images, model: resolvedModel }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("openai-image error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
