import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Painel oculto de custos — não exige login de usuário, exige apenas a
 * senha guardada em public.app_secrets (key = 'cost_dashboard_password').
 * Lê api_usage_logs e app_secrets com SERVICE_ROLE (ambas têm RLS sem
 * policies, então só esta função consegue ler os dados).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  password: string;
  days?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { password, days = 30 } = (await req.json()) as RequestBody;

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    const { data: secretRow } = await admin
      .from("app_secrets")
      .select("value")
      .eq("key", "cost_dashboard_password")
      .maybeSingle();

    const expected = secretRow?.value;
    if (!expected) {
      return new Response(
        JSON.stringify({ error: "Painel não configurado. Defina a senha na tabela app_secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!password || password !== expected) {
      // Resposta genérica — não diferenciar "senha errada" de "sem acesso".
      return new Response(JSON.stringify({ error: "Acesso negado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from("api_usage_logs")
      .select("service, operation, units, unit_type, cost_usd, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = data || [];
    const totalUsd = rows.reduce((sum, r) => sum + Number(r.cost_usd || 0), 0);

    const byService: Record<string, { calls: number; costUsd: number }> = {};
    for (const r of rows) {
      const key = r.service;
      if (!byService[key]) byService[key] = { calls: 0, costUsd: 0 };
      byService[key].calls += 1;
      byService[key].costUsd += Number(r.cost_usd || 0);
    }

    const byDay: Record<string, number> = {};
    for (const r of rows) {
      const day = r.created_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + Number(r.cost_usd || 0);
    }

    return new Response(
      JSON.stringify({
        totalUsd,
        totalCalls: rows.length,
        byService,
        byDay,
        recent: rows.slice(0, 50),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("cost-dashboard error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
