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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const auth = await requireUser(req, corsHeaders);
    if (auth instanceof Response) return auth;

    const { article_id } = await req.json();

    if (!article_id) {
      return errorResponse("Missing 'article_id'", 400);
    }

    const sb = supabaseAdmin();

    // Confirma a que empresa o artigo pertence antes de checar membership —
    // nunca confiar em um company_id vindo do client para essa validação.
    const { data: existing, error: fetchErr } = await sb
      .from("articles")
      .select("company_id")
      .eq("id", article_id)
      .maybeSingle();

    if (fetchErr) return errorResponse(`Failed to load article: ${fetchErr.message}`, 400);
    if (!existing) return errorResponse("Article not found", 404);

    const membership = await validateCompanyMembership(existing.company_id, auth.user.id, corsHeaders);
    if (membership instanceof Response) return membership;

    const now = new Date().toISOString();

    const { data, error } = await sb
      .from("articles")
      .update({
        status: "published",
        published_at: now,
        updated_at: now,
      })
      .eq("id", article_id)
      .select()
      .single();

    if (error) {
      return errorResponse(`Failed to publish article: ${error.message}`, 400);
    }

    console.log(`[publish-article] Article ${article_id} published`);

    return jsonResponse({ published: true, article: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[publish-article] Error:", message);
    return errorResponse(message, 502);
  }
});
