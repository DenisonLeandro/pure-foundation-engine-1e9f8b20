import { useState } from "react";
import { Bot, Plus, Loader2, CalendarRange } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutopilotPlans } from "@/hooks/use-autopilot";
import { AutopilotWizard } from "@/components/autopilot/AutopilotWizard";
import { AutopilotPlanDetail } from "@/components/autopilot/AutopilotPlanDetail";
import { PlanActionsMenu } from "@/components/autopilot/PlanActionsMenu";
import type { AutopilotPlan, AutopilotPlanStatus } from "@/types";

// Rótulo + cor por status do plano (identidade violeta/fúcsia, theme-aware).
const PLAN_STATUS: Record<AutopilotPlanStatus, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  generating: { label: "Gerando", className: "bg-violet-500/15 text-violet-600 dark:text-violet-300" },
  review: { label: "Pronto p/ revisar", className: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  approved: { label: "Aprovado", className: "bg-violet-500/15 text-violet-600 dark:text-violet-300" },
  active: { label: "Ativo", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  completed: { label: "Concluído", className: "bg-muted text-muted-foreground" },
  failed: { label: "Falhou", className: "bg-red-500/15 text-red-600 dark:text-red-300" },
  paused: { label: "Pausado", className: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  canceled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
};

function formatPeriod(plan: AutopilotPlan): string {
  if (!plan.period_start || !plan.period_end) return "período —";
  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    return `${day}/${m}`;
  };
  return `${fmt(plan.period_start)} – ${fmt(plan.period_end)}`;
}

export default function Autopilot() {
  const plansQuery = useAutopilotPlans();
  const plans = plansQuery.data || [];
  const [creating, setCreating] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const startWizard = () => setCreating(true);

  if (creating) {
    return (
      <AutopilotWizard
        onClose={() => setCreating(false)}
        onCreated={(planId?: string) => {
          setCreating(false);
          plansQuery.refetch();
          if (planId) setSelectedPlanId(planId);
        }}
      />
    );
  }

  if (selectedPlanId) {
    return <AutopilotPlanDetail planId={selectedPlanId} onBack={() => setSelectedPlanId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bot className="h-6 w-6 text-violet-500" />
            Autopilot
          </h1>
          <p className="text-sm text-muted-foreground">
            Cole o plano do mês. O Autopilot cria as artes, escreve as legendas, agenda e publica sozinho.
          </p>
        </div>
        {plans.length > 0 && (
          <Button onClick={startWizard} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="mr-1 h-4 w-4" /> Novo plano
          </Button>
        )}
      </div>

      {plansQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
              <Bot className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Seu Autopilot de conteúdo</h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Cole o plano do mês uma vez. O Autopilot cria as artes, escreve as legendas, agenda no melhor
                horário e publica sozinho — dia após dia.
              </p>
            </div>
            <Button onClick={startWizard} size="lg" className="bg-violet-600 hover:bg-violet-700">
              <Plus className="mr-1 h-4 w-4" /> Configurar Autopilot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const s = PLAN_STATUS[plan.status] ?? PLAN_STATUS.draft;
            return (
              <Card
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className="cursor-pointer transition-colors hover:border-violet-500/40"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{plan.name}</h3>
                    <Badge variant="secondary" className={s.className}>
                      {s.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarRange className="h-3.5 w-3.5" />
                    {formatPeriod(plan)}
                    {plan.platforms.length > 0 && <span>· {plan.platforms.join(", ")}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {plansQuery.isFetching && !plansQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> atualizando…
        </div>
      )}
    </div>
  );
}
