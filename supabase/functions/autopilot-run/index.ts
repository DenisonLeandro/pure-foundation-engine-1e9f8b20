import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { brandToAIProfile, brandImageDirective, type BrandRow } from "../_shared/brand.ts";

/**
 * Autopilot Run — Pipeline principal de automação
 *
 * Actions:
 *   generate       — Pesquisa + gera roteiro de posts para o ciclo
 *   schedule       — Gera visuais + agenda posts aprovados
 *   check_visuals  — Verifica status de visuais pendentes
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Helpers ────────────────────────────────────────────────────

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

function supabaseForUser(authHeader: string) {
  return createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Resolve API keys for a user, preferring the company they belong to (shared keys)
 * and falling back to their own user_configs row if no company config exists yet.
 */
async function loadKeysForUser(
  sb: ReturnType<typeof createClient>,
  userId: string,
): Promise<Record<string, string | null>> {
  const { data: companyKeys } = await sb.rpc("get_company_keys_for_user", { _user_id: userId });
  if (companyKeys && (companyKeys as any).id) return companyKeys as Record<string, string | null>;
  const { data: userCfg } = await sb
    .from("user_configs")
    .select("blotato_api_key, postforme_api_key, anthropic_api_key, unsplash_api_key, pexels_api_key, apify_api_token, firecrawl_api_key, higgsfield_api_id, higgsfield_api_secret")
    .eq("user_id", userId)
    .maybeSingle();
  return (userCfg ?? {}) as Record<string, string | null>;

}

function errorResponse(message: string, status = 500) {
  return jsonResponse({ error: message }, status);
}

// Faz upload de um data URL (base64) para o storage `media` e devolve a URL pública.
async function uploadDataUrl(
  sb: ReturnType<typeof supabaseAdmin>,
  userId: string,
  dataUrl: string
): Promise<string | null> {
  try {
    const [head, b64] = dataUrl.split(",");
    const mime = /:(.*?);/.exec(head)?.[1] || "image/png";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const path = `autopilot/${userId}/${crypto.randomUUID()}.png`;
    const { error } = await sb.storage.from("media").upload(path, bytes, { contentType: mime });
    if (error) { console.error("[autopilot] upload error:", error.message); return null; }
    return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.error("[autopilot] uploadDataUrl:", e instanceof Error ? e.message : e);
    return null;
  }
}

// ─── Firecrawl Search ───────────────────────────────────────────

async function firecrawlSearch(
  apiKey: string,
  query: string,
  limit = 5
): Promise<{ url: string; title: string; markdown: string }[]> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/firecrawl-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-firecrawl-api-key": apiKey,
      apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")!}`,
    },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

// Scrape direto de uma URL (conteúdo real, não SERP) via Firecrawl /v1/scrape.
async function firecrawlScrape(
  apiKey: string,
  url: string
): Promise<{ url: string; title: string; markdown: string } | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const md = data?.data?.markdown || data?.markdown || "";
    const title = data?.data?.metadata?.title || data?.metadata?.title || url;
    if (!md) return null;
    return { url, title, markdown: md };
  } catch {
    return null;
  }
}

// ─── AI Content Generation ──────────────────────────────────────
// Reaproveita a MESMA function do Studio (generate-content) para unificar
// qualidade de texto e marca-raiz. Sem implementação de IA divergente aqui.

async function generatePostContent(
  platform: string,
  topic: string,
  researchContext: string,
  brand: BrandRow | null,
  visualFormat: string,
  contentTypes?: string[]
): Promise<{
  text: string;
  hashtags: string[];
  carousel?: { title: string; slides: { heading: string; body: string }[] };
}> {
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const wantCarousel = visualFormat === "carousel" || visualFormat === "auto";
  const ctLine = contentTypes?.length ? ` Tipo de conteúdo: ${contentTypes.join(", ")}.` : "";

  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({
      prompt: `${topic}.${ctLine}`,
      platforms: [platform],
      tone: brand?.tone,
      language: "português brasileiro",
      sourceContent: researchContext ? researchContext.slice(0, 3000) : undefined,
      brandProfile: brandToAIProfile(brand),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`generate-content ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.posts?.[platform] || Object.values(data.posts || {})[0] || "";
  return {
    text: String(text),
    hashtags: data.hashtags || [],
    carousel: wantCarousel ? data.carousel : undefined,
  };
}

// ─── Compute schedule slots ─────────────────────────────────────

// Map of timezone → UTC offset in hours (negative = behind UTC)
const TZ_OFFSETS: Record<string, number> = {
  "America/Sao_Paulo": -3,
  "America/Manaus": -4,
  "America/Noronha": -2,
  "America/Rio_Branco": -5,
};

function computeSlots(
  postsPerCycle: number,
  preferredDays: number[],
  preferredTimes: string[],
  recurrence: string,
  timezone: string
): Date[] {
  const slots: Date[] = [];
  const cycleDays = recurrence === "monthly" ? 30 : recurrence === "biweekly" ? 14 : 7;
  const tzOffset = TZ_OFFSETS[timezone] ?? -3; // default SP

  // Edge functions run in UTC. We build dates in UTC representing
  // the user's local time, then subtract the tz offset to get true UTC.
  // E.g. user wants 09:00 SP (UTC-3) → UTC 12:00 → setUTCHours(9 - (-3)) = 12

  // Start from tomorrow in user's local day
  const nowUtc = Date.now();
  const nowLocal = new Date(nowUtc + tzOffset * 3600_000);
  const startDate = new Date(Date.UTC(
    nowLocal.getUTCFullYear(),
    nowLocal.getUTCMonth(),
    nowLocal.getUTCDate() + 1
  ));

  let dayOffset = 0;
  while (slots.length < postsPerCycle && dayOffset < cycleDays) {
    const day = new Date(startDate);
    day.setUTCDate(day.getUTCDate() + dayOffset);
    const dayOfWeek = day.getUTCDay(); // 0=Sun in UTC (matches local since we start at midnight)

    if (preferredDays.includes(dayOfWeek)) {
      for (const time of preferredTimes) {
        if (slots.length >= postsPerCycle) break;
        const [h, m] = time.split(":").map(Number);
        // Convert local time to UTC: subtract the (negative) offset → add hours
        const utcSlot = new Date(day);
        utcSlot.setUTCHours(h - tzOffset, m, 0, 0);
        slots.push(utcSlot);
      }
    }
    dayOffset++;
  }

  return slots;
}

function computeNextRun(recurrence: string): Date {
  const next = new Date();
  const days = recurrence === "monthly" ? 30 : recurrence === "biweekly" ? 14 : 7;
  next.setDate(next.getDate() + days);
  next.setHours(6, 0, 0, 0);
  return next;
}

function cycleRange(recurrence: string): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  const days = recurrence === "monthly" ? 30 : recurrence === "biweekly" ? 14 : 7;
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

// ─── Action: Generate ───────────────────────────────────────────

async function handleGenerate(configId: string, userId?: string) {
  const sb = supabaseAdmin();

  // Load config
  const { data: config, error: cfgErr } = await sb
    .from("autopilot_configs")
    .select("*")
    .eq("id", configId)
    .single();

  if (cfgErr || !config) throw new Error(`Config not found: ${cfgErr?.message}`);

  const effectiveUserId = userId || config.user_id;

  // Load brand profile
  let brand: BrandRow | null = null;
  if (config.brand_id) {
    const { data } = await sb
      .from("brand_profiles")
      .select("*")
      .eq("id", config.brand_id)
      .single();
    brand = data;
  }

  // Load firecrawl API key from company config (shared) with fallback to user.
  const keys = await loadKeysForUser(sb, effectiveUserId);
  const firecrawlKey = keys?.firecrawl_api_key;


  // 1. Research via Firecrawl
  let allResults: { url: string; title: string; markdown: string }[] = [];

  if (firecrawlKey && config.research_topics?.length) {
    console.log(`[autopilot] Researching ${config.research_topics.length} topics...`);
    for (const topic of config.research_topics) {
      const results = await firecrawlSearch(firecrawlKey, topic, 3);
      allResults = allResults.concat(results.map((r: { url: string; title: string; markdown: string }) => ({ ...r, _topic: topic } as any)));
    }
  }

  // Scrape direto das URLs informadas (conteúdo real da página)
  if (firecrawlKey && config.research_urls?.length) {
    for (const url of config.research_urls) {
      const scraped = await firecrawlScrape(firecrawlKey, url);
      if (scraped) allResults.push(scraped);
    }
  }

  console.log(`[autopilot] Total research results: ${allResults.length}`);

  // 2. Create calendar
  const range = cycleRange(config.recurrence);
  const { data: calendar, error: calErr } = await sb
    .from("autopilot_calendars")
    .insert({
      user_id: effectiveUserId,
      config_id: configId,
      cycle_start: range.start,
      cycle_end: range.end,
      status: config.requires_approval ? "draft" : "approved",
      research_results: allResults.map((r) => ({
        url: r.url,
        title: r.title,
        summary: r.markdown?.slice(0, 500) || "",
      })),
    })
    .select()
    .single();

  if (calErr || !calendar) throw new Error(`Failed to create calendar: ${calErr?.message}`);

  // 3. Generate posts
  const slots = computeSlots(
    config.posts_per_cycle,
    config.preferred_days || [1, 3, 5],
    config.preferred_times || ["09:00", "18:00"],
    config.recurrence,
    config.timezone
  );

  // Build research context string
  const researchContext = allResults
    .map((r) => `## ${r.title}\n${r.markdown?.slice(0, 500) || ""}`)
    .join("\n\n");

  // Distribute platforms across slots (round-robin)
  const platforms = config.platforms || ["instagram"];
  const posts: Record<string, unknown>[] = [];

  for (let i = 0; i < slots.length; i++) {
    const platform = platforms[i % platforms.length];
    const topicIndex = i % (config.research_topics?.length || 1);
    const topic = config.research_topics?.[topicIndex] || brand?.name || "conteúdo";

    try {
      console.log(`[autopilot] Generating post ${i + 1}/${slots.length} for ${platform}...`);
      const content = await generatePostContent(
        platform,
        topic,
        researchContext,
        brand,
        config.visual_format,
        config.content_types
      );

      posts.push({
        user_id: effectiveUserId,
        calendar_id: calendar.id,
        platform,
        text_content: content.text,
        hashtags: content.hashtags || [],
        carousel_data: content.carousel || null,
        scheduled_at: slots[i].toISOString(),
        status: config.requires_approval ? "draft" : "approved",
        source_topic: topic,
      });
    } catch (err) {
      console.error(`[autopilot] Failed to generate post ${i + 1}:`, err);
      posts.push({
        user_id: effectiveUserId,
        calendar_id: calendar.id,
        platform,
        text_content: `[Erro na geração] ${topic}`,
        hashtags: [],
        scheduled_at: slots[i].toISOString(),
        status: "failed",
        error_message: err instanceof Error ? err.message : "Erro desconhecido",
        source_topic: topic,
      });
    }
  }

  if (posts.length > 0) {
    const { error: insertErr } = await sb.from("autopilot_posts").insert(posts);
    if (insertErr) console.error("[autopilot] Insert posts error:", insertErr.message);
  }

  // 4. Update config
  await sb
    .from("autopilot_configs")
    .update({
      last_run_at: new Date().toISOString(),
      next_run_at: computeNextRun(config.recurrence).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", configId);

  return {
    calendar_id: calendar.id,
    posts_generated: posts.length,
    research_results: allResults.length,
  };
}

// ─── Action: Schedule ───────────────────────────────────────────

async function handleSchedule(calendarId: string) {
  const sb = supabaseAdmin();

  // Load approved posts without pfm_post_id
  const { data: posts, error } = await sb
    .from("autopilot_posts")
    .select("*")
    .eq("calendar_id", calendarId)
    .in("status", ["approved", "visual_ready"])
    .is("pfm_post_id", null);

  if (error || !posts?.length) {
    return { scheduled: 0, message: "Nenhum post para agendar" };
  }

  // Load shared keys (company-scoped, falls back to user)
  const userId = posts[0].user_id;
  const keys = await loadKeysForUser(sb, userId);
  const pfmKey = keys?.postforme_api_key;
  if (!pfmKey) throw new Error("PostForMe API key não configurada");

  // Load autopilot config for social_account_ids
  const { data: calendar } = await sb
    .from("autopilot_calendars")
    .select("config_id")
    .eq("id", calendarId)
    .single();

  const { data: config } = await sb
    .from("autopilot_configs")
    .select("social_account_ids, visual_format, brand_id, image_provider, video_model")
    .eq("id", calendar?.config_id)
    .single();

  const hfId = keys?.higgsfield_api_id;
  const hfSecret = keys?.higgsfield_api_secret;


  let brandRow: BrandRow | null = null;
  if (config?.brand_id) {
    const { data } = await sb.from("brand_profiles").select("*").eq("id", config.brand_id).single();
    brandRow = data;
  }

  const fmt = config?.visual_format || "none";
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;

  let scheduled = 0;
  let pendingVisuals = 0;

  for (const post of posts) {
    try {
      // ── Gera o visual conforme formato/provider (marca como raiz) ──
      const needsVisual = fmt !== "none" && !post.media_urls?.length && !post.visual_creation_id;
      if (needsVisual) {
        // VÍDEO via Higgsfield (assíncrono → polling em check_visuals)
        if (fmt === "video" && hfId && hfSecret) {
          try {
            const model = config?.video_model || "kling-video/v2.6/pro/text-to-video";
            const prompt = [brandImageDirective(brandRow), post.text_content.slice(0, 400)].filter(Boolean).join("\n\n");
            const r = await fetch(`${SUPABASE_URL}/functions/v1/higgsfield-proxy`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}`,
                "x-higgsfield-api-id": hfId, "x-higgsfield-api-secret": hfSecret,
              },
              body: JSON.stringify({ tool: "hf_text_to_video_direct", args: { model, prompt, duration: 5, with_audio: true, audio_language: "pt-BR" } }),
            });
            if (r.ok) {
              const v = await r.json();
              if (v.request_id) {
                await sb.from("autopilot_posts").update({ status: "generating_visual", visual_creation_id: v.request_id, visual_provider: "higgsfield", updated_at: new Date().toISOString() }).eq("id", post.id);
                pendingVisuals++; continue;
              }
            }
          } catch (e) { console.error(`[autopilot] HF video for ${post.id}:`, e); }
        }
        // IMAGEM via OpenAI gpt-image-2 (síncrono — já anexa media_urls).
        // Arte 100% gpt-image-2: o estilo (quote/infográfico/etc) vai no prompt.
        else {
          try {
            const styleHint = fmt === "carousel" ? "estilo carrossel, slide único com destaque"
              : fmt === "infographic" ? "estilo infográfico limpo com hierarquia visual"
              : "card de redes sociais com o texto em destaque";
            const prompt = [
              brandImageDirective(brandRow),
              `Crie uma arte para redes sociais (${styleHint}).`,
              `Texto/tema: ${post.text_content.slice(0, 300)}`,
              "Composição profissional, pronta para publicação.",
            ].filter(Boolean).join("\n\n");
            const r = await fetch(`${SUPABASE_URL}/functions/v1/openai-image`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
              body: JSON.stringify({ prompt, size: "1024x1536", quality: "medium", n: 1 }),
            });
            if (r.ok) {
              const data = await r.json();
              const dataUrl = data.images?.[0];
              if (typeof dataUrl === "string" && dataUrl.startsWith("data:")) {
                const url = await uploadDataUrl(sb, userId, dataUrl);
                if (url) {
                  post.media_urls = [url];
                  await sb.from("autopilot_posts").update({ media_urls: [url], visual_provider: "openai", updated_at: new Date().toISOString() }).eq("id", post.id);
                }
              }
            }
          } catch (e) { console.error(`[autopilot] OpenAI image for ${post.id}:`, e); }
        }
      }

      // Schedule via PFM proxy
      const pfmPayload = {
        tool: "pfm_create_post",
        args: {
          caption: post.text_content + (post.hashtags?.length ? "\n\n" + post.hashtags.map((h: string) => `#${h}`).join(" ") : ""),
          social_accounts: config?.social_account_ids || [],
          media: post.media_urls || [],
          scheduled_at: post.scheduled_at,
        },
      };

      const res = await fetch(`${SUPABASE_URL}/functions/v1/postforme-proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pfm-api-key": pfmKey,
          apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")!}`,
        },
        body: JSON.stringify(pfmPayload),
      });

      if (res.ok) {
        const result = await res.json();
        const pfmPostId = result?.data?.id || result?.id || null;

        await sb
          .from("autopilot_posts")
          .update({
            status: "scheduled",
            pfm_post_id: pfmPostId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        scheduled++;
      } else {
        const errText = await res.text();
        await sb
          .from("autopilot_posts")
          .update({
            status: "failed",
            error_message: `PFM ${res.status}: ${errText}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);
      }
    } catch (err) {
      console.error(`[autopilot] Schedule post ${post.id} failed:`, err);
    }
  }

  // Update calendar status
  if (pendingVisuals > 0) {
    // Some posts still generating visuals — mark as "scheduling"
    await sb
      .from("autopilot_calendars")
      .update({ status: "scheduling", updated_at: new Date().toISOString() })
      .eq("id", calendarId);
  } else if (scheduled > 0) {
    // All posts scheduled — mark as "active"
    await sb
      .from("autopilot_calendars")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", calendarId);
  }

  return { scheduled, pending_visuals: pendingVisuals };
}

// ─── Action: Check Visuals ──────────────────────────────────────

async function handleCheckVisuals(calendarId: string) {
  const sb = supabaseAdmin();

  const { data: posts } = await sb
    .from("autopilot_posts")
    .select("*")
    .eq("calendar_id", calendarId)
    .eq("status", "generating_visual");

  if (!posts?.length) return { checked: 0 };

  const userId = posts[0].user_id;
  const { data: userCfg } = await sb
    .from("user_configs")
    .select("blotato_api_key, higgsfield_api_id, higgsfield_api_secret")
    .eq("user_id", userId)
    .single();

  const blotatoKey = userCfg?.blotato_api_key;
  const hfId = userCfg?.higgsfield_api_id;
  const hfSecret = userCfg?.higgsfield_api_secret;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  let updated = 0;

  for (const post of posts) {
    if (!post.visual_creation_id) continue;
    const isHf = post.visual_provider === "higgsfield";

    try {
      let mediaUrls: string[] | null = null;
      let failed: string | null = null;

      if (isHf) {
        if (!hfId || !hfSecret) continue;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/higgsfield-proxy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}`,
            "x-higgsfield-api-id": hfId, "x-higgsfield-api-secret": hfSecret,
          },
          body: JSON.stringify({ tool: "hf_status", args: { request_id: post.visual_creation_id } }),
        });
        if (!res.ok) continue;
        const st = await res.json();
        if (st.status === "completed" && st.video?.url) mediaUrls = [st.video.url];
        else if (st.status === "failed" || st.status === "nsfw") failed = st.error || "Vídeo falhou";
      } else {
        if (!blotatoKey) continue;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/blotato-proxy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json", "x-blotato-api-key": blotatoKey,
            apikey: anon, Authorization: `Bearer ${anon}`,
          },
          body: JSON.stringify({ tool: "blotato_get_visual_status", args: { id: post.visual_creation_id } }),
        });
        if (!res.ok) continue;
        const visual = await res.json();
        if (visual.status === "done") mediaUrls = visual.imageUrls || (visual.mediaUrl ? [visual.mediaUrl] : []);
        else if (visual.status === "failed") failed = visual.failReason || visual.error || "";
      }

      if (mediaUrls) {
        await sb.from("autopilot_posts").update({ status: "visual_ready", media_urls: mediaUrls, updated_at: new Date().toISOString() }).eq("id", post.id);
        updated++;
      } else if (failed !== null) {
        await sb.from("autopilot_posts").update({ status: "approved", error_message: `Visual falhou: ${failed}`, updated_at: new Date().toISOString() }).eq("id", post.id);
        updated++;
      }
    } catch (err) {
      console.error(`[autopilot] Check visual for post ${post.id}:`, err);
    }
  }

  // Sem mais visuais pendentes → devolve o calendário a "approved" para o cron
  // reagendar os posts que ficaram com visual_ready (fecha o ciclo gerar→agendar).
  const { count: stillPending } = await sb
    .from("autopilot_posts")
    .select("id", { count: "exact", head: true })
    .eq("calendar_id", calendarId)
    .eq("status", "generating_visual");
  if (!stillPending) {
    await sb
      .from("autopilot_calendars")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", calendarId);
  }

  return { checked: posts.length, updated };
}

// ─── Action: Confirm Publication ─────────────────────────────────
// Polling PFM pra confirmar publicação real (scheduled → published).

async function handleConfirm(calendarId: string) {
  const sb = supabaseAdmin();
  const { data: posts } = await sb
    .from("autopilot_posts")
    .select("id, pfm_post_id, user_id, platform")
    .eq("calendar_id", calendarId)
    .eq("status", "scheduled");

  if (!posts?.length) return { confirmed: 0 };

  const userId = posts[0].user_id;
  const { data: userCfg } = await sb.from("user_configs").select("postforme_api_key").eq("user_id", userId).single();
  const pfmKey = userCfg?.postforme_api_key;
  if (!pfmKey) return { confirmed: 0, error: "PFM key not found" };

  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  let confirmed = 0;

  // Busca posts recentes processados no PFM
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/postforme-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pfm-api-key": pfmKey, apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify({ tool: "pfm_list_posts", args: { status: "processed", limit: 50 } }),
    });
    if (!res.ok) return { confirmed: 0, error: `PFM ${res.status}` };

    const pfmData = await res.json();
    const processed = pfmData?.data || [];
    const pfmIds = new Set(processed.map((p: { id?: string }) => p.id).filter(Boolean));

    for (const post of posts) {
      if (post.pfm_post_id && pfmIds.has(post.pfm_post_id)) {
        // Busca URL e engagement do post publicado
        const pfmPost = processed.find((p: { id: string }) => p.id === post.pfm_post_id);
        const platformUrl = pfmPost?.platform_url || pfmPost?.results?.[0]?.platform_url || null;
        const engagement = pfmPost?.results?.[0]?.engagement || null;

        await sb.from("autopilot_posts").update({
          status: "published",
          updated_at: new Date().toISOString(),
          // Armazenamos engagement e URL nos campos existentes (source_url para a URL publicada)
          source_url: platformUrl,
          error_message: engagement ? JSON.stringify(engagement) : null,
        }).eq("id", post.id);
        confirmed++;
      }
    }

    // Se todos confirmados, marca calendário como 'completed'
    const { count: stillScheduled } = await sb
      .from("autopilot_posts")
      .select("id", { count: "exact", head: true })
      .eq("calendar_id", calendarId)
      .eq("status", "scheduled");
    if (!stillScheduled) {
      await sb.from("autopilot_calendars")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", calendarId);
    }
  } catch (e) {
    console.error("[autopilot] confirm error:", e instanceof Error ? e.message : e);
  }

  return { confirmed };
}

// ─── Action: Curate (quality gate + scoring) ────────────────────
// Analisa posts draft com IA e marca os que passam como approved; reescreve os que não passam.

async function handleCurate(calendarId: string) {
  const sb = supabaseAdmin();
  const { data: posts } = await sb
    .from("autopilot_posts")
    .select("id, text_content, platform, hashtags, user_id, calendar_id")
    .eq("calendar_id", calendarId)
    .eq("status", "draft");

  if (!posts?.length) return { curated: 0 };

  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) return { curated: 0, error: "LOVABLE_API_KEY not set" };

  let approved = 0;
  let rewritten = 0;

  for (const post of posts) {
    try {
      // IA avalia: passa (approve) ou reescreve (melhora e aprova)
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: `Você é curador de conteúdo. Avalie o post para ${post.platform}. Se estiver BOM (claro, engajador, sem erros, comprimento adequado), responda {"action":"approve"}. Se puder MELHORAR, reescreva e responda {"action":"rewrite","text":"<texto melhorado>"}. Responda APENAS JSON.` },
            { role: "user", content: post.text_content },
          ],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const verdict = JSON.parse(cleaned);
        if (verdict.action === "rewrite" && verdict.text) {
          await sb.from("autopilot_posts").update({
            text_content: verdict.text,
            status: "approved",
            updated_at: new Date().toISOString(),
          }).eq("id", post.id);
          rewritten++;
        } else {
          await sb.from("autopilot_posts").update({
            status: "approved",
            updated_at: new Date().toISOString(),
          }).eq("id", post.id);
          approved++;
        }
      } catch {
        // Não conseguiu parsear → aprova como está
        await sb.from("autopilot_posts").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", post.id);
        approved++;
      }
    } catch (e) {
      console.error(`[autopilot] curate post ${post.id}:`, e instanceof Error ? e.message : e);
    }
  }

  // Se todos curados, atualiza calendário pra approved
  const { count: stillDraft } = await sb
    .from("autopilot_posts")
    .select("id", { count: "exact", head: true })
    .eq("calendar_id", calendarId)
    .eq("status", "draft");
  if (!stillDraft) {
    await sb.from("autopilot_calendars")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", calendarId);
  }

  return { curated: approved + rewritten, approved, rewritten };
}

// ─── Main Handler ───────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const { action, config_id, calendar_id } = await req.json();

    if (!action) {
      return errorResponse("Missing 'action'", 400);
    }

    // Extract user ID from auth header if present
    const authHeader = req.headers.get("authorization");
    let userId: string | undefined;
    if (authHeader) {
      const sb = supabaseForUser(authHeader);
      const { data: { user } } = await sb.auth.getUser();
      userId = user?.id;
    }

    switch (action) {
      case "generate": {
        if (!config_id) return errorResponse("Missing 'config_id'", 400);
        const result = await handleGenerate(config_id, userId);
        return jsonResponse(result);
      }
      case "schedule": {
        if (!calendar_id) return errorResponse("Missing 'calendar_id'", 400);
        const result = await handleSchedule(calendar_id);
        return jsonResponse(result);
      }
      case "check_visuals": {
        if (!calendar_id) return errorResponse("Missing 'calendar_id'", 400);
        const result = await handleCheckVisuals(calendar_id);
        return jsonResponse(result);
      }
      case "confirm": {
        if (!calendar_id) return errorResponse("Missing 'calendar_id'", 400);
        const result = await handleConfirm(calendar_id);
        return jsonResponse(result);
      }
      case "curate": {
        if (!calendar_id) return errorResponse("Missing 'calendar_id'", 400);
        const result = await handleCurate(calendar_id);
        return jsonResponse(result);
      }
      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[autopilot-run] Error:", message);
    return errorResponse(message, 502);
  }
});
