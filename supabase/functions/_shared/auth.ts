import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Validates the caller's JWT and returns the authenticated user.
 * Returns a Response (401) if the request is unauthenticated; otherwise returns { user, authHeader }.
 *
 * Usage:
 *   const auth = await requireUser(req, corsHeaders);
 *   if (auth instanceof Response) return auth;
 *   const { user } = auth;
 */
export async function requireUser(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | { user: { id: string; email?: string }; authHeader: string }> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) {
    return new Response(JSON.stringify({ error: "Server auth misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return { user: { id: data.user.id, email: data.user.email ?? undefined }, authHeader };
}
