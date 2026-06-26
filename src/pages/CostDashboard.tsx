import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";

interface UsageRow {
  service: string;
  operation: string;
  units: number;
  unit_type: string;
  cost_usd: number;
  created_at: string;
}

interface UsageResponse {
  totalUsd: number;
  totalCalls: number;
  byService: Record<string, { calls: number; costUsd: number }>;
  byDay: Record<string, number>;
  recent: UsageRow[];
}

const SERVICE_LABELS: Record<string, string> = {
  openai_image: "OpenAI (imagem)",
  higgsfield: "Higgsfield (vídeo IA)",
  firecrawl: "Firecrawl (pesquisa)",
  postforme: "Post for Me (publicação)",
  blotato: "Blotato (publicação)",
  gemini: "Gemini (texto/imagem IA)",
};

export default function CostDashboard() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageResponse | null>(null);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke("cost-dashboard", {
        body: { password, days: 30 },
      });
      if (fnError) throw fnError;
      if (res?.error) throw new Error(res.error);
      setData(res as UsageResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Acesso negado.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" /> Painel de custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={unlock} className="space-y-3">
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const services = Object.entries(data.byService).sort((a, b) => b[1].costUsd - a[1].costUsd);
  const days = Object.entries(data.byDay).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold">Custo de APIs — últimos 30 dias</h1>
          <span className="text-2xl font-bold">${data.totalUsd.toFixed(2)}</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Por serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
            {services.map(([service, info]) => (
              <div key={service} className="flex items-center justify-between text-sm">
                <span>{SERVICE_LABELS[service] || service}</span>
                <span className="text-muted-foreground">{info.calls} chamadas</span>
                <span className="font-medium">${info.costUsd.toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Por dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {days.map(([day, cost]) => (
              <div key={day} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{day}</span>
                <span>${cost.toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Últimas chamadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.recent.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(r.created_at).toLocaleString("pt-BR")}</span>
                <span>{SERVICE_LABELS[r.service] || r.service} · {r.operation}</span>
                <span>${Number(r.cost_usd).toFixed(4)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
