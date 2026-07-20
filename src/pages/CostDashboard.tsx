import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronDown, ChevronRight, Info, Loader2, Lock, RefreshCw, Save,
} from "lucide-react";

/**
 * Painel oculto de custos — /painel-custos-interno (sem link no menu).
 *
 * ATENÇÃO — o que este painel mostra nesta versão (Lovable):
 * A IA passa pelo Lovable AI Gateway, que cobra em CRÉDITOS e não publica o
 * consumo por chamada. Então os valores de IA aqui são o CUSTO-EQUIVALENTE ao
 * preço de tabela do provedor (Google/OpenAI) — precisos e comparáveis ao
 * painel do app direto, mas NÃO são o que o Lovable te cobra. Para o custo real
 * e o markup, use o cartão "Calibração de crédito" (você informa 1 número do
 * billing do Lovable).
 */

interface UsageRow {
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

interface UsageResponse {
  days: number;
  fxRate: number;
  totalUsd: number;
  totalCalls: number;
  exactUsd: number;
  estimatedUsd: number;
  tokensIn: number;
  tokensOut: number;
  byService: Record<string, ServiceAgg>;
  byDay: Record<string, number>;
  recent: UsageRow[];
  truncated: boolean;
}

const SERVICE_LABELS: Record<string, string> = {
  gemini: "Gemini via Lovable (texto)",
  openai_image: "Imagem via Lovable (gpt-image-2)",
  higgsfield: "Higgsfield — Vídeo/IA",
  postforme: "Post for Me — Publicação",
  apify: "Apify — Analytics",
  firecrawl: "Firecrawl — Pesquisa",
  pexels: "Pexels — Fotos (grátis)",
  blotato: "Blotato (legado)",
};

const OPERATION_LABELS: Record<string, string> = {
  default: "geração",
  edit: "edição de imagem",
  image: "geração de imagem",
  image_edit: "edição de imagem",
  autopilot: "Autopilot (imagem)",
  autopilot_brief: "Autopilot (briefing)",
  autopilot_caption: "Autopilot (legenda)",
  autopilot_parse: "Autopilot (plano colado)",
  autopilot_review: "Autopilot (curadoria)",
  generate_content: "conteúdo do Studio",
  ai_assist: "assistente de texto",
  analytics_insights: "insights de analytics",
  brand_suggest: "sugestão de marca",
  article: "artigo de blog",
  source_extract: "resumo de fonte",
  search: "busca",
  publish: "post publicado",
  "text-to-image": "texto → imagem",
  "text-to-video": "texto → vídeo",
  "image-to-video": "imagem → vídeo",
};

const PERIODS = [7, 30, 90] as const;

function fmtUsd(v: number, digits = 2): string {
  return "$" + v.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtBrl(v: number, digits = 2): string {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtInt(v: number): string {
  return v.toLocaleString("pt-BR");
}

export default function CostDashboard() {
  const [password, setPassword] = useState(() => sessionStorage.getItem("cost_pw") || "");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageResponse | null>(null);
  const [days, setDays] = useState<number>(30);
  const [fxInput, setFxInput] = useState("");
  const [savingFx, setSavingFx] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Calibração de crédito (mede o markup real do Lovable)
  const [creditsDebited, setCreditsDebited] = useState("");
  const [creditValue, setCreditValue] = useState("0.25");

  const fetchData = useCallback(async (pw: string, period: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke("cost-dashboard", {
        body: { password: pw, days: period },
      });
      if (fnError) throw fnError;
      if (res?.error) throw new Error(res.error);
      const parsed = res as UsageResponse;
      setData(parsed);
      setFxInput(String(parsed.fxRate));
      setUnlocked(true);
      sessionStorage.setItem("cost_pw", pw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Acesso negado.");
      if (!unlocked) setData(null);
    } finally {
      setLoading(false);
    }
  }, [unlocked]);

  useEffect(() => {
    const saved = sessionStorage.getItem("cost_pw");
    if (saved && !unlocked && !loading && !data) void fetchData(saved, days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveFx() {
    const rate = Number(fxInput.replace(",", "."));
    if (!Number.isFinite(rate) || rate <= 0) return;
    setSavingFx(true);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke("cost-dashboard", {
        body: { password, action: "set_fx", fxRate: rate },
      });
      if (fnError) throw fnError;
      if (res?.error) throw new Error(res.error);
      setData((d) => (d ? { ...d, fxRate: rate } : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar câmbio.");
    } finally {
      setSavingFx(false);
    }
  }

  const fx = data?.fxRate || 5.4;
  const brl = useCallback((usd: number) => usd * fx, [fx]);

  const services = useMemo(
    () => Object.entries(data?.byService || {}).sort((a, b) => b[1].costUsd - a[1].costUsd),
    [data],
  );

  // Custo de IA equivalente-provedor (só gemini + imagem) — base da calibração.
  const aiEquivUsd = useMemo(() => {
    if (!data) return 0;
    return ["gemini", "openai_image"].reduce((s, k) => s + (data.byService[k]?.costUsd || 0), 0);
  }, [data]);

  const dailySeries = useMemo(() => {
    if (!data) return [] as Array<{ day: string; usd: number }>;
    const out: Array<{ day: string; usd: number }> = [];
    for (let i = data.days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: key, usd: data.byDay[key] || 0 });
    }
    return out;
  }, [data]);

  const maxDay = Math.max(0.0001, ...dailySeries.map((d) => d.usd));

  // Markup real: créditos debitados × valor do crédito vs equivalente-provedor.
  const realLovableUsd = (Number(creditsDebited.replace(",", ".")) || 0) * (Number(creditValue.replace(",", ".")) || 0);
  const markup = aiEquivUsd > 0 && realLovableUsd > 0 ? realLovableUsd / aiEquivUsd : null;

  if (!unlocked || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" /> Painel de custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void fetchData(password, days);
              }}
              className="space-y-3"
            >
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading || !password.trim()} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Custos do app (versão Lovable)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              IA pela via do Lovable Gateway (Gemini). Valores = custo-equivalente ao preço de tabela do provedor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-card/60">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setDays(p);
                    void fetchData(password, p);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    days === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p} dias
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => void fetchData(password, days)} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Aviso do modelo de custo */}
        <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <p>
            O Lovable cobra a IA em <b>créditos</b> e não revela o consumo por chamada. Os valores de IA abaixo são o
            <b> preço de tabela do provedor</b> (Google/OpenAI) sobre os tokens reais — a mesma conta do painel do app
            direto, ideal para comparar. O que o Lovable <i>realmente</i> te cobra sai no cartão de calibração.
          </p>
        </div>

        {/* Totais */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-violet-500/30">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">Equivalente-provedor · {data.days} dias</p>
              <p className="text-2xl font-bold tabular-nums mt-1">{fmtBrl(brl(data.totalUsd))}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{fmtUsd(data.totalUsd)} · {fmtInt(data.totalCalls)} chamadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">Só IA (Gemini + imagem)</p>
              <p className="text-2xl font-bold tabular-nums mt-1">{fmtBrl(brl(aiEquivUsd))}</p>
              <p className="text-xs text-muted-foreground tabular-nums">base da calibração de markup</p>
            </CardContent>
          </Card>
          <Card className={markup ? "border-fuchsia-500/40" : ""}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">Custo real Lovable (créditos)</p>
              <p className="text-2xl font-bold tabular-nums mt-1">{realLovableUsd > 0 ? fmtBrl(brl(realLovableUsd)) : "—"}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {markup ? `${markup.toFixed(1)}× o preço de tabela` : "preencha a calibração"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">Precisão do registro</p>
              <p className="text-2xl font-bold tabular-nums mt-1">
                {data.totalUsd > 0 ? Math.round((data.exactUsd / data.totalUsd) * 100) : 100}% exato
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                tokens: {fmtInt(data.tokensIn + data.tokensOut)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Evolução diária */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Gasto por dia (equivalente-provedor)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[2px] h-28">
              {dailySeries.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 rounded-t bg-gradient-to-t from-violet-600 to-fuchsia-500 min-h-[2px] opacity-90 hover:opacity-100"
                  style={{ height: `${(d.usd / maxDay) * 100}%` }}
                  title={`${d.day.split("-").reverse().join("/")} — ${fmtBrl(brl(d.usd))} (${fmtUsd(d.usd, 4)})`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
              <span>{dailySeries[0]?.day.split("-").reverse().join("/")}</span>
              <span>pico: {fmtBrl(brl(maxDay))}</span>
              <span>{dailySeries[dailySeries.length - 1]?.day.split("-").reverse().join("/")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Por serviço */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Por API</h2>
          {services.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhum gasto registrado no período. Use o app e os custos aparecem aqui.
              </CardContent>
            </Card>
          )}
          {services.map(([service, s]) => {
            const isOpen = !!expanded[service];
            const ops = Object.entries(s.byOperation).sort((a, b) => b[1].costUsd - a[1].costUsd);
            const share = data.totalUsd > 0 ? (s.costUsd / data.totalUsd) * 100 : 0;
            const allExact = s.estimatedCalls === 0;
            return (
              <Card key={service} className="border-border/50 overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => setExpanded((e) => ({ ...e, [service]: !e[service] }))}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm">{SERVICE_LABELS[service] || service}</span>
                          {allExact ? (
                            <Badge className="bg-emerald-600/90 text-[10px] px-1.5 py-0 h-4">exato</Badge>
                          ) : (
                            <Badge className="bg-amber-600/90 text-[10px] px-1.5 py-0 h-4">
                              {s.exactCalls > 0 ? "parcialmente estimado" : "estimado"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                          {fmtInt(s.calls)} chamadas
                          {s.tokensIn + s.tokensOut > 0 && <> · {fmtInt(s.tokensIn)} tokens entrada · {fmtInt(s.tokensOut)} saída</>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold tabular-nums">{fmtBrl(brl(s.costUsd))}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{fmtUsd(s.costUsd)} · {share.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${share}%` }} />
                    </div>
                  </CardContent>
                </button>
                {isOpen && (
                  <div className="border-t border-border/50 bg-muted/20 px-4 py-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left font-medium pb-1.5">Operação</th>
                          <th className="text-right font-medium pb-1.5">Chamadas</th>
                          <th className="text-right font-medium pb-1.5">Unidades</th>
                          <th className="text-right font-medium pb-1.5">R$</th>
                          <th className="text-right font-medium pb-1.5">US$</th>
                        </tr>
                      </thead>
                      <tbody className="tabular-nums">
                        {ops.map(([op, o]) => (
                          <tr key={op} className="border-t border-border/30">
                            <td className="py-1.5">{OPERATION_LABELS[op] || op}</td>
                            <td className="py-1.5 text-right">{fmtInt(o.calls)}</td>
                            <td className="py-1.5 text-right">{fmtInt(Math.round(o.units))} {o.unitType}</td>
                            <td className="py-1.5 text-right font-medium">{fmtBrl(brl(o.costUsd))}</td>
                            <td className="py-1.5 text-right text-muted-foreground">{fmtUsd(o.costUsd, 4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Calibração de crédito + câmbio */}
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="border-fuchsia-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Calibração de crédito (markup real)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                No billing do Lovable, veja quantos <b>créditos de IA</b> foram debitados neste período e informe abaixo.
                O painel calcula o custo real e o markup sobre o preço de tabela.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Créditos debitados:</span>
                <Input value={creditsDebited} onChange={(e) => setCreditsDebited(e.target.value)} className="w-28 tabular-nums" inputMode="decimal" placeholder="ex: 40" />
                <span className="text-muted-foreground">× valor:</span>
                <select
                  value={creditValue}
                  onChange={(e) => setCreditValue(e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="0.25">$0,25 (Pro)</option>
                  <option value="0.50">$0,50 (Business)</option>
                  <option value="0.30">$0,30 (top-up Pro)</option>
                  <option value="0.60">$0,60 (top-up Business)</option>
                </select>
              </div>
              {realLovableUsd > 0 && (
                <div className="rounded-md bg-muted/40 p-3 text-sm tabular-nums space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Custo real Lovable</span><span className="font-semibold">{fmtBrl(brl(realLovableUsd))} ({fmtUsd(realLovableUsd)})</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Equivalente-provedor (IA)</span><span>{fmtBrl(brl(aiEquivUsd))}</span></div>
                  {markup && (
                    <div className="flex justify-between border-t border-border/50 pt-1 font-semibold text-fuchsia-500">
                      <span>Markup do Lovable</span><span>{markup.toFixed(1)}× ({fmtBrl(brl(realLovableUsd - aiEquivUsd))} a mais)</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Câmbio US$ → R$</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">1 US$ =</span>
                <Input value={fxInput} onChange={(e) => setFxInput(e.target.value)} className="w-28 tabular-nums" inputMode="decimal" />
                <Button size="sm" onClick={() => void saveFx()} disabled={savingFx}>
                  {savingFx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Salvar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Usado em todas as conversões desta página. Fica salvo no servidor.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                <b>Infra do Lovable:</b> o hosting e o banco estão embutidos na assinatura do Lovable (créditos),
                não em Supabase/Vercel separados — por isso não há linha de "infra fixa" aqui.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Últimos eventos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Últimos eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-medium pb-1.5">Quando</th>
                    <th className="text-left font-medium pb-1.5">API</th>
                    <th className="text-left font-medium pb-1.5">Operação</th>
                    <th className="text-right font-medium pb-1.5">Tokens</th>
                    <th className="text-right font-medium pb-1.5">R$</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {data.recent.map((r, i) => {
                    const meta = r.metadata || {};
                    const tk = Number(meta.tokens_in || 0) + Number(meta.tokens_out || 0);
                    return (
                      <tr key={i} className="border-t border-border/30">
                        <td className="py-1.5 text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-1.5">{(SERVICE_LABELS[r.service] || r.service).split(" — ")[0].split(" (")[0]}</td>
                        <td className="py-1.5 text-muted-foreground">
                          {OPERATION_LABELS[r.operation] || r.operation}
                          {meta.exactness === "estimated" && <span className="text-amber-500"> ~</span>}
                        </td>
                        <td className="py-1.5 text-right text-muted-foreground">{tk > 0 ? fmtInt(tk) : "—"}</td>
                        <td className="py-1.5 text-right font-medium">{fmtBrl(brl(Number(r.cost_usd)), 4)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ~ = custo estimado. Todos os valores de IA são preço de tabela do provedor (não o débito de créditos do Lovable).
              Registros anteriores a 20/07/2026 usavam a tabela antiga.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
