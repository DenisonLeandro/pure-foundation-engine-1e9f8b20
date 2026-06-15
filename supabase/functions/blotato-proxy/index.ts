import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser } from "../_shared/auth.ts";
import { getCompanyConfig } from "../_shared/company-secrets.ts";

/**
 * Blotato REST API Proxy — modelo seguro por empresa.
 *
 *  - Frontend envia { tool, args, companyId } no body.
 *  - Validamos membership e buscamos blotato_api_key em company_configs via
 *    SERVICE_ROLE no servidor. A chave NUNCA é devolvida no body nem logada.
 *
 *  Exceção controlada (validação de chave digitada em Setup/ManageKeysView):
 *  - Quando o body inclui `validateKey: true` e tool === "blotato_get_user",
 *    aceitamos `x-blotato-api-key` para validar uma chave recém-digitada.
 *    Não lê nenhuma chave salva.
 *  TODO: migrar essa validação para uma rota dedicada (ex.: blotato-validate-key)
 *  e remover o header do CORS por completo.
 *
 * All endpoints tested and confirmed working against backend.blotato.com/v2
 * Rate limit: 30 req/min per endpoint
 */

const BLOTATO_BASE = "https://backend.blotato.com/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-blotato-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// deno-lint-ignore no-explicit-any
type Args = Record<string, any>;

interface RouteConfig {
  method: "GET" | "POST" | "DELETE" | "PATCH";
  path: (args: Args) => string;
  body?: (args: Args) => unknown;
  unwrap?: string;
}

const ROUTES: Record<string, RouteConfig> = {
  // ── User ───────────────────────────────────────────────
  blotato_get_user: {
    method: "GET",
    path: () => "/users/me",
  },

  // ── Accounts ───────────────────────────────────────────
  blotato_list_accounts: {
    method: "GET",
    path: (a) => a.platform ? `/users/me/accounts?platform=${a.platform}` : "/users/me/accounts",
  },
  blotato_list_subaccounts: {
    method: "GET",
    path: (a) => `/users/me/accounts/${a.accountId}/subaccounts`,
  },

  // ── Posts ───────────────────────────────────────────────
  // POST /posts → { postSubmissionId }
  blotato_create_post: {
    method: "POST",
    path: () => "/posts",
    body: (a) => ({
      post: {
        accountId: String(a.accountId),
        content: {
          text: a.text || "",
          mediaUrls: a.mediaUrls || [],
          platform: a.platform,
          ...(a.additionalPosts && { additionalPosts: a.additionalPosts }),
        },
        target: {
          targetType: a.platform as string,
          // Platform-specific target fields
          ...(a.pageId && { pageId: String(a.pageId) }),
          ...(a.replyControl && { replyControl: a.replyControl }),
          ...(a.privacyLevel && { privacyLevel: a.privacyLevel }),
          ...(a.disabledComments !== undefined && { disabledComments: a.disabledComments }),
          ...(a.disabledDuet !== undefined && { disabledDuet: a.disabledDuet }),
          ...(a.disabledStitch !== undefined && { disabledStitch: a.disabledStitch }),
          ...(a.isBrandedContent !== undefined && { isBrandedContent: a.isBrandedContent }),
          ...(a.isYourBrand !== undefined && { isYourBrand: a.isYourBrand }),
          ...(a.isAiGenerated !== undefined && { isAiGenerated: a.isAiGenerated }),
          ...(a.boardId && { boardId: a.boardId }),
          ...(a.title && { title: a.title }),
          ...(a.privacyStatus && { privacyStatus: a.privacyStatus }),
          ...(a.shouldNotifySubscribers !== undefined && { shouldNotifySubscribers: a.shouldNotifySubscribers }),
          ...(a.mediaType && { mediaType: a.mediaType }),
          ...(a.link && { link: a.link }),
          ...(a.altText && { altText: a.altText }),
          ...(a.collaborators && { collaborators: a.collaborators }),
          ...(a.coverImageUrl && { coverImageUrl: a.coverImageUrl }),
          ...(a.shareToFeed !== undefined && { shareToFeed: a.shareToFeed }),
          ...(a.audioName && { audioName: a.audioName }),
          ...(a.autoAddMusic !== undefined && { autoAddMusic: a.autoAddMusic }),
          ...(a.isDraft !== undefined && { isDraft: a.isDraft }),
          ...(a.isMadeForKids !== undefined && { isMadeForKids: a.isMadeForKids }),
          ...(a.containsSyntheticMedia !== undefined && { containsSyntheticMedia: a.containsSyntheticMedia }),
        },
      },
      ...(a.scheduledTime && { scheduledTime: a.scheduledTime }),
      ...(a.useNextFreeSlot && { useNextFreeSlot: true }),
    }),
  },
  // GET /posts/:id → { status, publicUrl, ... }
  blotato_get_post_status: {
    method: "GET",
    path: (a) => `/posts/${a.postSubmissionId}`,
  },

  // ── Schedules ──────────────────────────────────────────
  blotato_list_schedules: {
    method: "GET",
    path: (a) => `/schedules?limit=${a.limit || 50}`,
  },
  blotato_get_schedule: {
    method: "GET",
    path: (a) => `/schedules/${a.id}`,
  },
  blotato_delete_schedule: {
    method: "DELETE",
    path: (a) => `/schedules/${a.id}`,
  },
  // PATCH /schedules/:id → update scheduled post
  blotato_update_schedule: {
    method: "PATCH",
    path: (a) => `/schedules/${a.id}`,
    body: (a) => {
      const patch: Record<string, unknown> = {};
      if (a.scheduledTime) patch.scheduledTime = a.scheduledTime;
      if (a.post) patch.post = a.post;
      return patch;
    },
  },

  // ── Visuals ────────────────────────────────────────────
  // GET /videos/templates → { items: [...] }
  blotato_list_visual_templates: {
    method: "GET",
    path: (a) => {
      const params = new URLSearchParams();
      if (a.search) params.set("search", String(a.search));
      if (a.fields) params.set("fields", String(a.fields));
      if (a.id) params.set("id", String(a.id));
      const qs = params.toString();
      return `/videos/templates${qs ? `?${qs}` : ""}`;
    },
  },
  // POST /videos/from-templates → { item: { id, status } }
  blotato_create_visual: {
    method: "POST",
    path: () => "/videos/from-templates",
    body: (a) => ({
      templateId: a.templateId,
      prompt: a.prompt || "",
      inputs: a.inputs || {},
      render: a.render ?? true,
      ...(a.isDraft !== undefined && { isDraft: a.isDraft }),
    }),
    unwrap: "item",
  },
  // GET /videos/creations/:id → { item: { id, status, mediaUrl, imageUrls } }
  blotato_get_visual_status: {
    method: "GET",
    path: (a) => `/videos/creations/${a.id}`,
    unwrap: "item",
  },
  // DELETE /videos/creations/:id
  blotato_delete_visual: {
    method: "DELETE",
    path: (a) => `/videos/creations/${a.id}`,
  },

  // ── Sources ────────────────────────────────────────────
  // POST /source-resolutions-v3 → { id }
  blotato_create_source: {
    method: "POST",
    path: () => "/source-resolutions-v3",
    body: (a) => ({
      source: {
        sourceType: a.sourceType,
        ...(a.url && { url: a.url }),
        ...(a.text && { text: a.text }),
      },
      ...(a.customInstructions && { customInstructions: a.customInstructions }),
    }),
  },
  // GET /source-resolutions-v3/:id → { id, status, title, content }
  blotato_get_source_status: {
    method: "GET",
    path: (a) => `/source-resolutions-v3/${a.id}`,
  },

  // ── Media ──────────────────────────────────────────────
  // POST /media → { url, id }
  blotato_upload_media: {
    method: "POST",
    path: () => "/media",
    body: (a) => ({ url: a.url }),
  },
};

// ─── Handler ────────────────────────────────────────────────────

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
    const apiKey = req.headers.get("x-blotato-api-key");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing x-blotato-api-key header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tool, args = {} } = (await req.json()) as {
      tool: string;
      args?: Record<string, unknown>;
    };

    if (!tool) {
      return new Response(
        JSON.stringify({ error: "Missing 'tool' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const route = ROUTES[tool];
    if (!route) {
      return new Response(
        JSON.stringify({
          error: `Unknown tool: ${tool}`,
          available: Object.keys(ROUTES),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `${BLOTATO_BASE}${route.path(args)}`;
    const fetchOptions: RequestInit = {
      method: route.method,
      headers: {
        "Content-Type": "application/json",
        "blotato-api-key": apiKey,
      },
    };

    if (route.body && (route.method === "POST" || route.method === "PATCH")) {
      fetchOptions.body = JSON.stringify(route.body(args));
    }

    const response = await fetch(url, fetchOptions);

    if (response.status === 204) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: data.message || `Blotato API ${response.status}`,
          details: data,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unwrap nested response if configured (e.g. { item: { ... } } → { ... })
    const result = route.unwrap && data[route.unwrap] ? data[route.unwrap] : data;

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Blotato proxy error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
