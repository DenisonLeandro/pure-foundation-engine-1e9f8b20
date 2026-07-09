import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * True quando a chamada é uma requisição INTERNA de serviço (worker/tick),
 * autenticada pela service role key no header Authorization. Usado por funções
 * que normalmente exigem usuário (openai-image, generate-content) para permitir
 * que o Autopilot as reuse em 2º plano — mantendo o mesmo caminho de geração do
 * Studio, sem um JWT de usuário.
 */
export function isInternalServiceCall(req: Request): boolean {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || req.headers.get("authorization") || "";
  return !!key && auth === `Bearer ${key}`;
}

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
