import { useState } from "react";
import {
  Bot,
  Play,
  Pause,
  RefreshCw,
  Calendar,
  Settings2,
  History,
  Activity,
  Plus,
  Loader2,
  CheckCheck,
  Send,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutopilotWizard } from "@/components/autopilot/AutopilotWizard";
import { AutopilotCalendarView } from "@/components/autopilot/AutopilotCalendarView";
import { CalendarStatusBadge } from "@/components/autopilot/AutopilotStatusBadge";
import {
  useAutopilotConfigs,
  useAutopilotCalendars,
  useToggleAutopilot,
  useRunAutopilot,
  useApproveCalendar,
  useScheduleCalendar,
  useConfirmCalendar,
  useCurateCalendar,
} from "@/hooks/use-autopilot";
import { useApp } from "@/contexts/AppContext";
import type { AutopilotConfig, AutopilotCalendar } from "@/types";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Autopilot() {
  const [showWizard, setShowWizard] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AutopilotConfig | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

  const { config: appConfig } = useApp();
  const configsQuery = useAutopilotConfigs();
  const calendarsQuery = useAutopilotCalendars(selectedConfigId);
  const toggleAutopilot = useToggleAutopilot();
  const runAutopilot = useRunAutopilot();
  const approveCalendar = useApproveCalendar();
  const scheduleCalendar = useScheduleCalendar();
  const confirmCalendar = useConfirmCalendar();
  const curateCalendar = useCurateCalendar();

  const configs = configsQuery.data || [];
  const calendars = calendarsQuery.data || [];
  const activeConfig = configs.find((c) => c.id === selectedConfigId) || configs[0] || null;
  const latestCalendar = calendars[0] || null;
  const activeCalendarId = selectedCalendarId || latestCalendar?.id || null;

  // Auto-select first config
  if (!selectedConfigId && configs.length > 0 && !showWizard) {
    setSelectedConfigId(configs[0].id);
  }

  function handleConfigSaved(config: AutopilotConfig) {
    setShowWizard(false);
    setEditingConfig(null);
    setSelectedConfigId(config.id);
  }

  function handleToggle(config: AutopilotConfig) {
    toggleAutopilot.mutate(
      { id: config.id, is_active: !config.is_active },
      {
        onSuccess: () =>
          toast.success(config.is_active ? "Autopilot pausado" : "Autopilot ativado!"),
      }
    );
  }

  function handleGenerate(configId: string) {
    runAutopilot.mutate(configId, {
      onSuccess: () => {
        toast.success("Ciclo gerado! Confira na aba Calendário.");
        calendarsQuery.refetch();
      },
      onError: (err) => toast.error(`Erro: ${err.message}`),
    });
  }

  function handleApproveAll(calendarId: string) {
    approveCalendar.mutate(calendarId, {
      onSuccess: () => toast.success("Todos os posts aprovados!"),
      onError: (err) => toast.error(`Erro: ${err.message}`),
    });
  }

  function handleScheduleAll(calendarId: string) {
    scheduleCalendar.mutate(calendarId, {
      onSuccess: () => toast.success("Posts agendados!"),
      onError: (err) => toast.error(`Erro: ${err.message}`),
    });
  }

  // Loading state
  if (configsQuery.isLoading) {
    return (
      <div className="space-y-4 p-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Wizard mode
  if (showWizard || editingConfig) {
    return (
      <div className="space-y-6 p-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {editingConfig ? "Editar Autopilot" : "Configurar Autopilot"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure a automação de conteúdo passo a passo
            </p>
          </div>
        </div>
        <AutopilotWizard
          existingConfig={editingConfig}
          onSaved={handleConfigSaved}
          onCancel={() => {
            setShowWizard(false);
            setEditingConfig(null);
          }}
        />
      </div>
    );
  }

  // Empty state
  if (configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg">
          <Bot className="h-10 w-10" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Autopilot</h1>
          <p className="text-muted-foreground max-w-md">
            Automatize sua presença nas redes sociais. O Autopilot pesquisa conteúdo,
            cria roteiros, gera visuais e agenda publicações recorrentes.
          </p>
        </div>
        <Button
          size="lg"
          className="bg-violet-600 hover:bg-violet-700 gap-2"
          onClick={() => setShowWizard(true)}
        >
          <Plus className="h-5 w-5" />
          Configurar Autopilot
        </Button>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Autopilot</h1>
            <p className="text-sm text-muted-foreground">
              Automação inteligente de conteúdo
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova Config
          </Button>
        </div>
      </div>

      {/* Alertas de keys faltando */}
      {(() => {
        const missing: string[] = [];
        if (!appConfig.postformeApiKey) missing.push("Post for Me");
        if (!appConfig.firecrawlApiKey && activeConfig?.research_topics?.length) missing.push("Firecrawl");
        if (missing.length === 0) return null;
        return (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {"API keys não configuradas: "}{missing.join(", ")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {"O Autopilot precisa dessas keys para funcionar. "}
                  <Link to="/setup" className="text-violet-500 hover:underline font-medium">
                    {"Configurar agora"}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Active config card */}
      {activeConfig && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Badge
                  variant={activeConfig.is_active ? "default" : "secondary"}
                  className={activeConfig.is_active ? "bg-green-600" : ""}
                >
                  {activeConfig.is_active ? "Ativo" : "Pausado"}
                </Badge>
                <span className="text-sm font-medium">
                  {activeConfig.platforms.length} plataformas
                  {" · "}
                  {activeConfig.posts_per_cycle} posts/{activeConfig.recurrence === "weekly" ? "semana" : activeConfig.recurrence === "biweekly" ? "quinzena" : "mês"}
                </span>
                {activeConfig.next_run_at && activeConfig.is_active && (
                  <span className="text-xs text-muted-foreground">
                    Próximo ciclo:{" "}
                    {new Date(activeConfig.next_run_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggle(activeConfig)}
                  disabled={toggleAutopilot.isPending}
                >
                  {activeConfig.is_active ? (
                    <><Pause className="h-3.5 w-3.5 mr-1" /> Pausar</>
                  ) : (
                    <><Play className="h-3.5 w-3.5 mr-1" /> Ativar</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate(activeConfig.id)}
                  disabled={runAutopilot.isPending || !appConfig.postformeApiKey}
                >
                  {runAutopilot.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  )}
                  Gerar Agora
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingConfig(activeConfig)}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1">
            <Calendar className="h-3.5 w-3.5" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <History className="h-3.5 w-3.5" /> Histórico
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-1">
            <Activity className="h-3.5 w-3.5" /> Status
          </TabsTrigger>
        </TabsList>

        {/* Calendar tab */}
        <TabsContent value="calendar" className="space-y-4">
          {latestCalendar && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Ciclo {latestCalendar.cycle_start} — {latestCalendar.cycle_end}
                </span>
                <CalendarStatusBadge status={latestCalendar.status} />
              </div>
              <div className="flex gap-2">
                {latestCalendar.status === "draft" && (
                  <Button
                    size="sm"
                    onClick={() => handleApproveAll(latestCalendar.id)}
                    disabled={approveCalendar.isPending}
                    className="gap-1"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Aprovar Tudo
                  </Button>
                )}
                {latestCalendar.status === "approved" && (
                  <Button
                    size="sm"
                    onClick={() => handleScheduleAll(latestCalendar.id)}
                    disabled={scheduleCalendar.isPending}
                    className="gap-1 bg-violet-600 hover:bg-violet-700"
                  >
                    {scheduleCalendar.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Agendar Tudo
                  </Button>
                )}
                {latestCalendar.status === "draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => curateCalendar.mutate(latestCalendar.id, { onSuccess: () => toast.success("Curadoria IA concluída!") })}
                    disabled={curateCalendar.isPending}
                    className="gap-1"
                  >
                    {curateCalendar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
                    Curar com IA
                  </Button>
                )}
                {latestCalendar.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => confirmCalendar.mutate(latestCalendar.id, { onSuccess: () => toast.success("Publicações confirmadas!") })}
                    disabled={confirmCalendar.isPending}
                    className="gap-1"
                  >
                    {confirmCalendar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                    Confirmar publicações
                  </Button>
                )}
              </div>
            </div>
          )}
          <AutopilotCalendarView calendarId={activeCalendarId} />
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="space-y-3">
          {calendars.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum ciclo gerado ainda.
            </p>
          ) : (
            calendars.map((cal) => (
              <Card
                key={cal.id}
                className={`cursor-pointer transition-colors ${
                  activeCalendarId === cal.id ? "border-violet-500" : ""
                }`}
                onClick={() => setSelectedCalendarId(cal.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {cal.cycle_start} — {cal.cycle_end}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cal.research_results?.length || 0} fontes pesquisadas
                    </p>
                  </div>
                  <CalendarStatusBadge status={cal.status} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Status tab */}
        <TabsContent value="status" className="space-y-4">
          {activeConfig && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={activeConfig.is_active ? "default" : "secondary"}
                    className={activeConfig.is_active ? "bg-green-600" : ""}
                  >
                    {activeConfig.is_active ? "Ativo" : "Pausado"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Última execução</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {activeConfig.last_run_at
                      ? new Date(activeConfig.last_run_at).toLocaleString("pt-BR")
                      : "Nunca"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Próxima execução</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {activeConfig.next_run_at && activeConfig.is_active
                      ? new Date(activeConfig.next_run_at).toLocaleString("pt-BR")
                      : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tópicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {activeConfig.research_topics.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ciclos gerados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{calendars.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Aprovação</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {activeConfig.requires_approval ? "Manual" : "Automática"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
