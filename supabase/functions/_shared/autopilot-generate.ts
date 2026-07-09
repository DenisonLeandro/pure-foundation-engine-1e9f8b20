/**
 * Autopilot v2 — geração de conteúdo (handlers gen_image / gen_caption).
 *
 * Replica o pipeline do Studio "A IA cria tudo" no backend:
 *   1. tema → briefing rico + headline (IA)
 *   2. buildArtPrompt (compartilhado com o Studio) → openai-image (mesma função)
 *   3. composição da LOGO REAL por cima, no servidor (ImageScript), com a MESMA
 *      geometria do Studio (logoPlacement)
 *   4. upload ao storage `media` → autopilot_posts.image_url
 * A legenda usa a mesma generate-content do Studio.
 *
 * Roda dentro do worker (service role) chamando openai-image/generate-content
 * como chamadas internas (isInternalServiceCall).
 */

import { Image } from "npm:imagescript@1.3.1";
import { buildArtPrompt, logoPlacement, IMG_SIZE, IMG_QUALITY, type ArtBrandLike } from "./studio-art.ts";
import { brandToAIProfile } from "./brand.ts";
import type { Job, SB, HandlerMap } from "./autopilot-engine.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

/** Headers de chamada interna (service role) para reusar openai-image/generate-content. */
function internalHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: ANON,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };
}

// ─── Carregamento de contexto ───────────────────────────────────────
interface Ctx {
  // deno-lint-ignore no-explicit-any
  post: any;
  // deno-lint-ignore no-explicit-any
  plan: any;
  // deno-lint-ignore no-explicit-any
  brand: any | null;
}

async function loadContext(sb: SB, postId: string | null): Promise<Ctx> {
  if (!postId) throw new Error("job sem post_id");
  const { data: post, error: pErr } = await sb.from("autopilot_posts").select("*").eq("id", postId).single();
  if (pErr || !post) throw new Error(`post não encontrado: ${pErr?.message ?? postId}`);
  const { data: plan } = await sb.from("autopilot_plans").select("*").eq("id", post.plan_id).single();
  let brand = null;
  if (plan?.brand_id) {
    const { data } = await sb.from("brand_profiles").select("*").eq("id", plan.brand_id).single();
    brand = data ?? null;
  }
  return { post, plan, brand };
}

// ─── Expansão tema → briefing de arte + headline ────────────────────
async function expandThemeToBrief(
  theme: string,
  category: string | null,
  // deno-lint-ignore no-explicit-any
  brand: any | null,
): Promise<{ brief: string; headline: string }> {
  if (!LOVABLE_KEY) return { brief: theme, headline: theme };
  const sys = `Você é diretor de arte de social media. A partir do TEMA (e categoria), produza um JSON com:
- "brief": 2 a 3 frases descrevendo a arte ideal do post (cena, elementos visuais, atmosfera). NÃO descreva texto/tipografia aqui.
- "headline": uma chamada curta (máximo 8 palavras), fiel ao tema, em português correto, para ser exibida em DESTAQUE na arte.
Responda APENAS JSON: {"brief":"...","headline":"..."}`;
  const user = `TEMA: ${theme}\nCATEGORIA: ${category || "-"}\nMARCA: ${brand?.name || "-"} (tom: ${brand?.tone || "-"})`;
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });
    if (!r.ok) return { brief: theme, headline: theme };
    const d = await r.json();
    const raw = (d.choices?.[0]?.message?.content || "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const p = JSON.parse(raw);
    const brief = typeof p.brief === "string" && p.brief.trim() ? p.brief.trim() : theme;
    const headline = typeof p.headline === "string" && p.headline.trim() ? p.headline.trim() : theme;
    return { brief, headline };
  } catch {
    return { brief: theme, headline: theme };
  }
}

// ─── openai-image (mesma função do Studio, chamada interna) ─────────
async function generateArtImage(prompt: string, userId?: string, companyId?: string): Promise<string> {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/openai-image`, {
    method: "POST",
    headers: internalHeaders(),
    body: JSON.stringify({ prompt, size: IMG_SIZE, quality: IMG_QUALITY, n: 1, userId, companyId }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`openai-image ${r.status}: ${t.slice(0, 200)}`);
  }
  const d = await r.json();
  const img = d.images?.[0];
  if (typeof img !== "string") throw new Error("openai-image não retornou imagem");
  return img; // data URL (base64) ou http URL
}

// ─── Decodificação de fonte (data URL ou http) → bytes ──────────────
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function srcToBytes(src: string): Promise<Uint8Array> {
  if (/^https?:\/\//i.test(src)) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`fetch imagem ${r.status}`);
    return new Uint8Array(await r.arrayBuffer());
  }
  return dataUrlToBytes(src);
}

// ─── Composição da logo no servidor (mesma geometria do Studio) ─────
async function composeWithLogo(artBytes: Uint8Array, logoUrl?: string | null): Promise<Uint8Array> {
  const art = await Image.decode(artBytes);
  if (logoUrl) {
    try {
      const logo = await Image.decode(await srcToBytes(logoUrl));
      const p = logoPlacement(art.width, logo.width, logo.height);
      logo.resize(Math.max(1, Math.round(p.w)), Math.max(1, Math.round(p.h)));
      art.composite(logo, Math.round(p.x), Math.round(p.y));
    } catch (e) {
      // Logo é opcional (ou formato não decodificável, ex.: SVG/WebP) — segue só com a arte.
      console.warn("[autopilot-generate] logo não composta:", e instanceof Error ? e.message : e);
    }
  }
  return await art.encode(); // PNG
}

async function uploadArt(sb: SB, companyId: string, bytes: Uint8Array): Promise<string> {
  const path = `autopilot/${companyId}/${crypto.randomUUID()}.png`;
  const { error } = await sb.storage.from("media").upload(path, bytes, { contentType: "image/png" });
  if (error) throw new Error(`upload falhou: ${error.message}`);
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** Promove o post a `ready` quando arte E legenda já estão prontas (atômico por statement). */
async function promoteIfReady(sb: SB, postId: string): Promise<void> {
  await sb.from("autopilot_posts")
    .update({ status: "ready", updated_at: new Date().toISOString() })
    .eq("id", postId)
    .in("status", ["draft", "generating"])
    .not("caption", "is", null)
    .not("image_url", "is", null);
}

// ─── Handler: gen_image ─────────────────────────────────────────────
async function genImage(sb: SB, job: Job): Promise<void> {
  const { post, plan, brand } = await loadContext(sb, job.post_id);

  // Reusa o briefing já expandido (regeneração) ou expande do tema.
  let userText: string = post.art_brief || "";
  if (!userText) {
    const { brief, headline } = await expandThemeToBrief(post.theme, post.category, brand);
    userText = headline
      ? `${brief}\n\nTexto em destaque na arte (exatamente como escrito, sem erros ortográficos): "${headline}".`
      : brief;
  }

  const artBrand: ArtBrandLike = { colors: brand?.colors, logo_url: brand?.logo_url };
  const prompt = buildArtPrompt(userText, artBrand);
  const img = await generateArtImage(prompt, plan?.created_by, post.company_id);
  const composed = await composeWithLogo(await srcToBytes(img), brand?.logo_url || null);
  const url = await uploadArt(sb, post.company_id, composed);

  await sb.from("autopilot_posts").update({
    art_brief: userText,
    image_url: url,
    image_prompt: prompt,
    visual_provider: "openai",
    updated_at: new Date().toISOString(),
  }).eq("id", post.id);

  await promoteIfReady(sb, post.id);
}

// ─── Handler: gen_caption ───────────────────────────────────────────
async function genCaption(sb: SB, job: Job): Promise<void> {
  const { post, plan, brand } = await loadContext(sb, job.post_id);
  const platform = (Array.isArray(plan?.platforms) && plan.platforms[0]) || "instagram";

  const r = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
    method: "POST",
    headers: internalHeaders(),
    body: JSON.stringify({
      prompt: post.theme,
      platforms: [platform],
      tone: brand?.tone,
      language: "português brasileiro",
      brandProfile: brandToAIProfile(brand),
      companyId: post.company_id,
      userId: plan?.created_by,
    }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`generate-content ${r.status}: ${t.slice(0, 200)}`);
  }
  const d = await r.json();
  const text = d.posts?.[platform] || Object.values(d.posts || {})[0] || "";
  if (!text || !String(text).trim()) throw new Error("generate-content devolveu legenda vazia");
  const hashtags = Array.isArray(d.hashtags) ? d.hashtags : [];

  await sb.from("autopilot_posts").update({
    caption: String(text),
    hashtags,
    updated_at: new Date().toISOString(),
  }).eq("id", post.id);

  await promoteIfReady(sb, post.id);
}

export const generationHandlers: HandlerMap = {
  gen_image: genImage,
  gen_caption: genCaption,
};
