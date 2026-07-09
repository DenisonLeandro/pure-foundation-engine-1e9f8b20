import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Trash2,
  Plus,
  Check,
  Sparkles,
  Play,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useParsePlan, useCreatePlan } from "@/hooks/use-autopilot";
import { useBrands } from "@/hooks/use-brands";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { listCompanySocialAccounts } from "@/lib/api/company-accounts";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/types";

interface EditRow {
  id: string;
  date: string; // YYYY-MM-DD ou ""
  theme: string;
  category: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function weekdayOf(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "—" : WEEKDAYS[d.getDay()];
}

function ddmm(dateStr: string): string {
  if (!dateStr) return "—";
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

const STEPS = ["Plano", "Grade", "Marca", "Gerar"] as const;

let rowSeq = 0;
const newRow = (r?: Partial<EditRow>): EditRow => ({
  id: `r${rowSeq++}`,
  date: r?.date ?? "",
  theme: r?.theme ?? "",
  category: r?.category ?? "",
});

export function AutopilotWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (planId?: string) => void;
}) {
  const { toast } = useToast();
  const { activeCompanyId } = useCompany();
  const { brands, defaultBrand, loading: brandsLoading } = useBrands();

  const parse = useParsePlan();
  const create = useCreatePlan();

  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<EditRow[]>([]);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [requiresApproval, setRequiresApproval] = useState(true);

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
    } catch {
      return "America/Sao_Paulo";
    }
  }, []);

  const accountsQuery = useQuery({
    queryKey: ["autopilot", "accounts", activeCompanyId],
    queryFn: () => listCompanySocialAccounts(activeCompanyId!),
    enabled: !!activeCompanyId && step >= 3,
  });
  const accounts = useMemo(() => accountsQuery.data || [], [accountsQuery.data]);

  const selectedBrand = brands.find((b) => b.id === brandId) || null;
  const selectedPlatforms = useMemo(() => {
    const set = new Set<string>();
    accounts.filter((a) => accountIds.includes(a.pfm_account_id)).forEach((a) => set.add(a.platform));
    return [...set];
  }, [accounts, accountIds]);

  const validRows = rows.filter((r) => r.date && r.theme.trim());
  const dates = validRows.map((r) => r.date).sort();
  const period = dates.length ? `${ddmm(dates[0])} – ${ddmm(dates[dates.length - 1])}` : "—";

  // ─── Ações ────────────────────────────────────────────────────
  async function handleParse() {
    if (!rawText.trim()) return;
    try {
      const { rows: parsed } = await parse.mutateAsync(rawText);
      setRows(parsed.map((r) => newRow({ date: r.date ?? "", theme: r.theme, category: r.category ?? "" })));
      setStep(2);
    } catch (e) {
      toast({
        title: "Não consegui interpretar o plano",
        description: e instanceof Error ? e.message : "Tente colar em um formato mais claro (uma linha por dia).",
        variant: "destructive",
      });
    }
  }

  function updateRow(id: string, patch: Partial<EditRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRow(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }
  function addRow() {
    setRows((rs) => [...rs, newRow()]);
  }

  function toggleAccount(pfmId: string) {
    setAccountIds((ids) => (ids.includes(pfmId) ? ids.filter((i) => i !== pfmId) : [...ids, pfmId]));
  }

  async function handleGenerate() {
    if (!activeCompanyId) return;
    try {
      const res = await create.mutateAsync({
        brand_id: brandId,
        name: undefined,
        platforms: selectedPlatforms,
        social_account_ids: accountIds,
        timezone,
        requires_approval: requiresApproval,
        rows: validRows.map((r) => ({ date: r.date, theme: r.theme.trim(), category: r.category.trim() || null })),
      });
      const planId = (res as { plan?: { id?: string } })?.plan?.id;
      toast({
        title: "Geração iniciada",
        description: `O Autopilot vai criar ${validRows.length} posts em segundo plano. Você pode sair e voltar quando estiver pronto.`,
      });
      onCreated(planId);
    } catch (e) {
      toast({
        title: "Não foi possível iniciar a geração",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  }

  // ─── Guardas de avanço ────────────────────────────────────────
  const canContinueGrid = validRows.length > 0 && validRows.length === rows.length;
  const canContinueBrand = !!brandId && accountIds.length > 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho + passos */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo plano</h1>
          <p className="text-sm text-muted-foreground">
            Cole o plano do mês. O Autopilot cria as artes, escreve as legendas, agenda e publica sozinho.
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
                  active
                    ? "bg-violet-600 text-white"
                    : done
                      ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <span className="font-semibold">{n}</span>}
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="text-muted-foreground">·</span>}
            </div>
          );
        })}
      </div>

      {/* ① Colar o plano */}
      {step === 1 && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cole seu plano de conteúdo
              </Label>
              <p className="text-xs text-muted-foreground">
                Qualquer formato — tabela, lista ou texto corrido. Período livre. Só <strong>data</strong> e{" "}
                <strong>tema</strong> são obrigatórios.
              </p>
            </div>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={"Agenda de Conteúdo — Julho/2026\n\nData        Categoria           Tema\n01/07/2026  IA e Tecnologia     Como a IA está mudando os empregos\n02/07/2026  Acidente Trabalho   Hérnia de disco pode ser acidente?\n..."}
              className="min-h-[240px] font-mono text-sm"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleParse}
                disabled={!rawText.trim() || parse.isPending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {parse.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-4 w-4" />
                )}
                Interpretar plano
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ② Confirmar a grade */}
      {step === 2 && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <p className="text-sm text-muted-foreground">
              A IA mostra como interpretou. Tabela <strong>editável</strong>: corrija um tema, ajuste uma data,
              remova ou adicione um dia — antes de gerar nada.
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left font-medium">Data</th>
                    <th className="p-2 text-left font-medium">Dia</th>
                    <th className="p-2 text-left font-medium">Categoria</th>
                    <th className="p-2 text-left font-medium">Tema</th>
                    <th className="w-10 p-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-1.5 align-top">
                        <Input
                          type="date"
                          value={r.date}
                          onChange={(e) => updateRow(r.id, { date: e.target.value })}
                          className={`h-8 w-[9.5rem] ${!r.date ? "border-red-400" : ""}`}
                        />
                      </td>
                      <td className="p-1.5 align-middle text-xs text-muted-foreground">{weekdayOf(r.date)}</td>
                      <td className="p-1.5 align-top">
                        <Input
                          value={r.category}
                          onChange={(e) => updateRow(r.id, { category: e.target.value })}
                          placeholder="—"
                          className="h-8 min-w-[9rem]"
                        />
                      </td>
                      <td className="p-1.5 align-top">
                        <Input
                          value={r.theme}
                          onChange={(e) => updateRow(r.id, { theme: e.target.value })}
                          placeholder="Tema do post"
                          className={`h-8 min-w-[14rem] ${!r.theme.trim() ? "border-red-400" : ""}`}
                        />
                      </td>
                      <td className="p-1.5 text-right align-middle">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => removeRow(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <strong>{rows.length} dias.</strong>{" "}
                {rows.length !== validRows.length && (
                  <span className="text-red-500">Complete data e tema de todas as linhas.</span>
                )}
              </span>
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar dia
              </Button>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canContinueGrid}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Está certo, continuar <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ③ Marca & contas */}
      {step === 3 && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <p className="text-sm text-muted-foreground">
              Tudo que o Autopilot precisa pra agir sozinho: a marca (define arte, logo e tom) e onde publicar.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Marca */}
              <div className="space-y-2 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">Marca</h3>
                {brandsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> carregando…
                  </div>
                ) : brands.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma marca cadastrada. Crie uma marca primeiro.</p>
                ) : (
                  <div className="space-y-2">
                    {brands.map((b) => {
                      const active = (brandId ?? defaultBrand?.id) === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBrandId(b.id)}
                          className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-left transition-colors ${
                            active ? "border-violet-500 ring-1 ring-violet-500" : "hover:border-violet-500/40"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="h-5 w-5 rounded"
                              style={{ background: b.colors?.[0] || "#7c3aed" }}
                            />
                            <span className="text-sm font-medium">{b.name}</span>
                          </span>
                          {active && <Check className="h-4 w-4 text-violet-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Define paleta da arte, logo carimbada e tom da legenda.</p>
              </div>

              {/* Contas */}
              <div className="space-y-2 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">Plataformas &amp; contas</h3>
                {accountsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> carregando…
                  </div>
                ) : accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma conta conectada. Conecte uma conta em Contas antes de seguir.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {accounts.map((a) => {
                      const active = accountIds.includes(a.pfm_account_id);
                      const cfg = PLATFORMS[a.platform as Platform];
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleAccount(a.pfm_account_id)}
                          className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-left transition-colors ${
                            active ? "border-violet-500 ring-1 ring-violet-500" : "hover:border-violet-500/40"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm">
                            {cfg?.icon}
                            <span className="font-medium">{cfg?.name ?? a.platform}</span>
                            <span className="text-muted-foreground">· {a.username}</span>
                          </span>
                          {active && <Check className="h-4 w-4 text-violet-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">O mesmo post vai igual para as contas marcadas.</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={() => {
                  if (!brandId && defaultBrand) setBrandId(defaultBrand.id);
                  setStep(4);
                }}
                disabled={!(canContinueBrand || (!!defaultBrand && accountIds.length > 0))}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Continuar <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ④ Revisar & gerar */}
      {step === 4 && (
        <Card>
          <CardContent className="space-y-5 p-5">
            <p className="text-sm text-muted-foreground">
              Transparência antes de acionar a IA: mostra quantos posts serão gerados (na chave da própria empresa).
            </p>
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="text-3xl font-bold">
                O Autopilot vai gerar{" "}
                <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                  {validRows.length} posts
                </span>
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>Marca: <strong>{selectedBrand?.name ?? defaultBrand?.name ?? "—"}</strong></span>
                <span>
                  Redes:{" "}
                  <strong>{selectedPlatforms.map((p) => PLATFORMS[p as Platform]?.name ?? p).join(", ") || "—"}</strong>
                </span>
                <span>Período: <strong>{period}</strong></span>
              </div>

              <div className="mx-auto mt-4 flex max-w-sm items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <div className="text-left">
                  <p className="text-sm font-medium">Exigir aprovação antes de publicar</p>
                  <p className="text-xs text-muted-foreground">Revisa tudo em lote antes de agendar.</p>
                </div>
                <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
              </div>

              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={create.isPending || validRows.length === 0}
                className="mt-5 bg-violet-600 hover:bg-violet-700"
              >
                {create.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-1 h-4 w-4" />
                )}
                {create.isPending ? "Criando plano…" : `Gerar os ${validRows.length} posts`}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Cada post = 1 arte + 1 legenda. Roda em segundo plano — você pode sair e volta quando estiver pronto.
              </p>
            </div>
            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setStep(3)} disabled={create.isPending}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
