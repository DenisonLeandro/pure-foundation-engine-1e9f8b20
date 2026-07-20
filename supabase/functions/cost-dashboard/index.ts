import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Painel oculto de custos (/painel-custos-interno) — não exige login de
 * usuário, exige apenas a senha guardada em public.app_secrets
 * (key = 'cost_dashboard_password'). Lê api_usage_logs e app_secrets com
 * SERVICE_ROLE (ambas têm RLS sem policies, então só esta função lê).
 *
 * Ações:
 *  - (default): agrega o período — total, por serviço, por operação, por dia,
 *    tokens, exato vs estimado, câmbio salvo.
 *  - action "set_fx": salva o câmbio USD→BRL (app_secrets.usd_brl_rate).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_FX = 5.4;

interface RequestBody {
  password: string;
  days?: number;
  action?: "summary" | "set_fx";
  fxRate?: number;
}

interface LogRow {
  service: string;
  operation: string;
  units: number;
  unit_type: string;
  cost_usd: number;
  created_at: string;
  company_id: string | null;
  metadata: Record<string, unknown> | null;
}

interface OpAgg {
  calls: number;
  costUsd: number;
  units: number;
  unitType: string;
  estimatedCalls: number;
}

interface ServiceAgg {
  calls: number;
  costUsd: number;
  exactCalls: number;
  estimatedCalls: number;
  estimatedUsd: number;
  tokensIn: number;
  tokensOut: number;
  unconfirmedPricing: boolean;
  byOperation: Record<string, OpAgg>;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as RequestBody;
    const days = Math.min(Math.max(Number(body.days) || 30, 1), 365);

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
      return json({ error: "Painel não configurado. Defina a senha na tabela app_secrets." }, 500);
    }
    if (!body.password || body.password !== expected) {
      // Resposta genérica — não diferenciar "senha errada" de "sem acesso".
      return json({ error: "Acesso negado." }, 401);
    }

    // ── Ação: salvar câmbio ─────────────────────────────────────────
    if (body.action === "set_fx") {
      const rate = Number(body.fxRate);
      if (!Number.isFinite(rate) || rate <= 0 || rate > 100) {
        return json({ error: "Câmbio inválido." }, 400);
      }
      await admin.from("app_secrets").upsert({ key: "usd_brl_rate", value: String(rate) }, { onConflict: "key" });
      return json({ ok: true, fxRate: rate }, 200);
    }

    // ── Câmbio salvo ────────────────────────────────────────────────
    const { data: fxRow } = await admin
      .from("app_secrets")
      .select("value")
      .eq("key", "usd_brl_rate")
      .maybeSingle();
    const fxRate = Number(fxRow?.value) > 0 ? Number(fxRow?.value) : DEFAULT_FX;

    // ── Logs do período ─────────────────────────────────────────────
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from("api_usage_logs")
      .select("service, operation, units, unit_type, cost_usd, created_at, company_id, metadata")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20000);

    if (error) throw error;
    const rows = (data || []) as LogRow[];

    let totalUsd = 0;
    let estimatedUsd = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    const byService: Record<string, ServiceAgg> = {};
    const byDay: Record<string, number> = {};

    for (const r of rows) {
      const cost = Number(r.cost_usd || 0);
      const meta = r.metadata || {};
      const exactness = meta.exactness === "exact" ? "exact" : "estimated";
      const tIn = Number(meta.tokens_in || 0);
      const tOut = Number(meta.tokens_out || 0);

      totalUsd += cost;
      if (exactness === "estimated") estimatedUsd += cost;
      totalTokensIn += tIn;
      totalTokensOut += tOut;

      const s = (byService[r.service] ??= {
        calls: 0,
        costUsd: 0,
        exactCalls: 0,
        estimatedCalls: 0,
        estimatedUsd: 0,
        tokensIn: 0,
        tokensOut: 0,
        unconfirmedPricing: false,
        byOperation: {},
      });
      s.calls += 1;
      s.costUsd += cost;
      s.tokensIn += tIn;
      s.tokensOut += tOut;
      if (exactness === "exact") s.exactCalls += 1;
      else {
        s.estimatedCalls += 1;
        s.estimatedUsd += cost;
      }
      if (meta.credits_confirmed === false) s.unconfirmedPricing = true;

      const op = (s.byOperation[r.operation || "default"] ??= {
        calls: 0,
        costUsd: 0,
        units: 0,
        unitType: r.unit_type || "",
        estimatedCalls: 0,
      });
      op.calls += 1;
      op.costUsd += cost;
      op.units += Number(r.units || 0);
      if (exactness === "estimated") op.estimatedCalls += 1;

      const day = r.created_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + cost;
    }

    return json(
      {
        days,
        fxRate,
        totalUsd,
        totalCalls: rows.length,
        exactUsd: totalUsd - estimatedUsd,
        estimatedUsd,
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
        byService,
        byDay,
        recent: rows.slice(0, 60),
        truncated: rows.length >= 20000,
      },
      200,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("cost-dashboard error:", message);
    return json({ error: message }, 502);
  }
});
