import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PLATFORMS } from "@/lib/platforms";
import { HF_VIDEO_MODELS } from "@/lib/higgsfield-models";
import { usePfmAccounts } from "@/hooks/use-blotato";
import { useSaveAutopilotConfig } from "@/hooks/use-autopilot";
import { useApp } from "@/contexts/use-app";
import type { AutopilotConfig, AutopilotVisualFormat, AutopilotRecurrence, Platform } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface BrandOption {
  id: string;
  name: string;
}

interface Props {
  existingConfig?: AutopilotConfig | null;
  onSaved: (config: AutopilotConfig) => void;
  onCancel: () => void;
}

const STEPS = [
  "Marca",
  "Tópicos",
  "Plataformas",
  "Visual",
  "Recorrência",
  "Aprovação",
  "Resumo",
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

const CONTENT_TYPES = ["educativo", "inspirador", "prático", "case study", "bastidores", "tutorial", "lista/ranking", "opinião"];

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "São Paulo (BRT -3)" },
  { value: "America/Manaus", label: "Manaus (AMT -4)" },
  { value: "America/Noronha", label: "Noronha (FNT -2)" },
  { value: "America/Rio_Branco", label: "Rio Branco (ACT -5)" },
];

const VISUAL_FORMATS: { value: AutopilotVisualFormat; label: string; desc: string }[] = [
  { value: "auto", label: "Automático", desc: "IA escolhe o melhor formato" },
  { value: "carousel", label: "Carrossel", desc: "Slides com texto e imagens" },
  { value: "single", label: "Imagem Única", desc: "Uma imagem por post" },
  { value: "infographic", label: "Infográfico", desc: "Dados visuais" },
  { value: "video", label: "Vídeo IA", desc: "Vídeo gerado via Higgsfield" },
  { value: "none", label: "Sem visual", desc: "Apenas texto" },
];

const RECURRENCE_OPTIONS: { value: AutopilotRecurrence; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
];

export function AutopilotWizard({ existingConfig, onSaved, onCancel }: Props) {
  const { user } = useAuth();
  const { activeCompanyId } = useCompany();
  const { config: appConfig } = useApp();
  const [step, setStep] = useState(0);
  const saveConfig = useSaveAutopilotConfig();
  const pfmAccounts = usePfmAccounts();

  const hasFirecrawlKey = !!appConfig.integrations.firecrawl;
  const hasPfmKey = !!appConfig.integrations.postforme;
  // Visuais agora são OpenAI (sem Blotato)

  // Form state
  const [brandId, setBrandId] = useState(existingConfig?.brand_id || "");
  const [topics, setTopics] = useState<string[]>(existingConfig?.research_topics || []);
  const [topicInput, setTopicInput] = useState("");
  const [researchUrls, setResearchUrls] = useState<string[]>(existingConfig?.research_urls || []);
  const [urlInput, setUrlInput] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(existingConfig?.platforms || []);
  const [accountIds, setAccountIds] = useState<string[]>(existingConfig?.social_account_ids || []);
  const [postsPerCycle, setPostsPerCycle] = useState(existingConfig?.posts_per_cycle || 5);
  const [visualFormat, setVisualFormat] = useState<AutopilotVisualFormat>(existingConfig?.visual_format || "auto");
  const [videoModel, setVideoModel] = useState<string>(existingConfig?.video_model || HF_VIDEO_MODELS[0].id);
  const [contentTypes, setContentTypes] = useState<string[]>(existingConfig?.content_types || ["educativo", "inspirador", "prático"]);
  const [timezone, setTimezone] = useState(existingConfig?.timezone || "America/Sao_Paulo");
  const [recurrence, setRecurrence] = useState<AutopilotRecurrence>(existingConfig?.recurrence || "weekly");
  const [preferredDays, setPreferredDays] = useState<number[]>(existingConfig?.preferred_days || [1, 3, 5]);
  const [preferredTimes, setPreferredTimes] = useState<string[]>(existingConfig?.preferred_times || ["09:00", "18:00"]);
  const [timeInput, setTimeInput] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(existingConfig?.requires_approval ?? true);

  // Load brands
  const [brands, setBrands] = useState<BrandOption[]>([]);
  useEffect(() => {
    if (!activeCompanyId) { setBrands([]); return; }
    supabase
      .from("brand_profiles")
      .select("id, name")
      .eq("company_id", activeCompanyId)
      .then(({ data }) => setBrands(data || []));
  }, [activeCompanyId]);

  function addTopic() {
    const t = topicInput.trim();
    if (t && !topics.includes(t)) {
      setTopics([...topics, t]);
      setTopicInput("");
    }
  }

  function addUrl() {
    const u = urlInput.trim();
    if (u && !researchUrls.includes(u)) {
      setResearchUrls([...researchUrls, u]);
      setUrlInput("");
    }
  }

  function addTime() {
    const t = timeInput.trim();
    if (t && /^\d{2}:\d{2}$/.test(t) && !preferredTimes.includes(t)) {
      setPreferredTimes([...preferredTimes, t].sort());
      setTimeInput("");
    }
  }

  function togglePlatform(p: string) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function toggleAccount(id: string) {
    setAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleDay(d: number) {
    setPreferredDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  async function handleSave() {
    const payload: Partial<AutopilotConfig> = {
      brand_id: brandId || null,
      research_topics: topics,
      research_urls: researchUrls,
      platforms,
      social_account_ids: accountIds,
      posts_per_cycle: postsPerCycle,
      visual_format: visualFormat,
      image_provider: "openai",
      video_model: visualFormat === "video" ? videoModel : null,
      content_types: contentTypes,
      recurrence,
      preferred_days: preferredDays,
      preferred_times: preferredTimes,
      timezone,
      requires_approval: requiresApproval,
    };
    if (existingConfig?.id) {
      (payload as any).id = existingConfig.id;
    }

    saveConfig.mutate(payload as any, {
      onSuccess: (data) => {
        toast.success("Autopilot configurado!");
        onSaved(data);
      },
      onError: (err) => {
        toast.error(`Erro: ${err.message}`);
      },
    });
  }

  const accounts = pfmAccounts.data || [];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              i === step
                ? "bg-violet-600 text-white"
                : i < step
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i < step ? <Check className="h-3 w-3" /> : null}
            {s}
          </button>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {step === 0 && (
            <>
              <Label>Perfil da Marca</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma marca (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A marca define o tom, público e estilo do conteúdo gerado.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <Label>Tópicos de Pesquisa</Label>
              <p className="text-xs text-muted-foreground mb-2">
                O Autopilot vai buscar conteúdo atualizado sobre esses temas.
              </p>
              {!hasFirecrawlKey && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {"Firecrawl API key não configurada. Configure em "}
                    <a href="/setup" className="underline font-medium">{"Configurações"}</a>
                    {" para habilitar a pesquisa automática de conteúdo."}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: marketing digital para PMEs"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
                />
                <Button size="sm" onClick={addTopic}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button onClick={() => setTopics(topics.filter((x) => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <Label className="mt-4">URLs para monitorar (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://blog.exemplo.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                />
                <Button size="sm" onClick={addUrl}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {researchUrls.map((u) => (
                  <Badge key={u} variant="outline" className="gap-1 text-xs">
                    {u}
                    <button onClick={() => setResearchUrls(researchUrls.filter((x) => x !== u))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Label>Plataformas</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.entries(PLATFORMS) as [Platform, typeof PLATFORMS[Platform]][]).map(
                  ([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => togglePlatform(key)}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                        platforms.includes(key)
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <span style={{ color: cfg.color }}>{cfg.icon}</span>
                      {cfg.name}
                    </button>
                  )
                )}
              </div>

              {platforms.length > 0 && accounts.length > 0 && (
                <>
                  <Label className="mt-4">Contas conectadas</Label>
                  <div className="space-y-2">
                    {accounts
                      .filter((a) => platforms.includes(a.platform))
                      .map((a) => (
                        <label
                          key={a.id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={accountIds.includes(a.id)}
                            onCheckedChange={() => toggleAccount(a.id)}
                          />
                          {a.name} (@{a.username})
                        </label>
                      ))}
                  </div>
                </>
              )}

              <Label className="mt-4">Posts por ciclo</Label>
              <Select
                value={String(postsPerCycle)}
                onValueChange={(v) => setPostsPerCycle(Number(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 10, 14].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} posts
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {step === 3 && (
            <>
              <Label>Formato Visual</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {VISUAL_FORMATS.map((vf) => (
                  <button
                    key={vf.value}
                    onClick={() => setVisualFormat(vf.value)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      visualFormat === vf.value
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <p className="font-medium text-sm">{vf.label}</p>
                    <p className="text-xs text-muted-foreground">{vf.desc}</p>
                  </button>
                ))}
              </div>

              {/* Imagens geradas por gpt-image-2 (marca como raiz) */}
              {["auto", "single", "carousel", "infographic"].includes(visualFormat) && (
                <p className="mt-3 text-xs text-muted-foreground">As imagens são geradas por IA (gpt-image-2) com a paleta e o tom da marca.</p>
              )}

              {/* Modelo de vídeo (Higgsfield) */}
              {visualFormat === "video" && (
                <div className="mt-4">
                  <Label>Modelo de vídeo (Higgsfield)</Label>
                  <Select value={videoModel} onValueChange={setVideoModel}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HF_VIDEO_MODELS.filter((m) => m.kind === "text-to-video").map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">Requer credenciais Higgsfield em Configurações.</p>
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Label>Frequência</Label>
              <div className="flex gap-2">
                {RECURRENCE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRecurrence(r.value)}
                    className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                      recurrence === r.value
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <Label className="mt-4">Tipos de conteúdo</Label>
              <div className="flex gap-1.5 flex-wrap">
                {CONTENT_TYPES.map((ct) => (
                  <button key={ct} onClick={() => setContentTypes((p) => p.includes(ct) ? p.filter((x) => x !== ct) : [...p, ct])}>
                    <Badge variant={contentTypes.includes(ct) ? "default" : "secondary"} className={contentTypes.includes(ct) ? "bg-violet-600 hover:bg-violet-700 cursor-pointer text-xs" : "cursor-pointer hover:bg-accent text-xs"}>
                      {ct}
                    </Badge>
                  </button>
                ))}
              </div>

              <Label className="mt-4">Fuso horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Label className="mt-4">Dias da semana</Label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => toggleDay(d.value)}
                    className={`w-10 h-10 rounded-full text-xs font-medium transition-colors ${
                      preferredDays.includes(d.value)
                        ? "bg-violet-600 text-white"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <Label className="mt-4">Horários de publicação</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="w-32"
                />
                <Button size="sm" onClick={addTime}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {preferredTimes.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button onClick={() => setPreferredTimes(preferredTimes.filter((x) => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <Label>Modo de aprovação</Label>
              <div className="flex items-center gap-3 mt-2">
                <Switch
                  checked={requiresApproval}
                  onCheckedChange={setRequiresApproval}
                />
                <div>
                  <p className="text-sm font-medium">
                    {requiresApproval ? "Aprovar manualmente" : "Publicar automaticamente"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {requiresApproval
                      ? "Você revisa e aprova cada post antes de publicar"
                      : "Posts são agendados automaticamente após geração"}
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h3 className="font-semibold">Resumo da Configuração</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Marca:</span>{" "}
                  {brands.find((b) => b.id === brandId)?.name || "Nenhuma"}
                </p>
                <p>
                  <span className="text-muted-foreground">Tópicos:</span>{" "}
                  {topics.join(", ") || "Nenhum"}
                </p>
                <p>
                  <span className="text-muted-foreground">Plataformas:</span>{" "}
                  {platforms.map((p) => PLATFORMS[p as Platform]?.name || p).join(", ")}
                </p>
                <p>
                  <span className="text-muted-foreground">Posts por ciclo:</span>{" "}
                  {postsPerCycle}
                </p>
                <p>
                  <span className="text-muted-foreground">Visual:</span>{" "}
                  {VISUAL_FORMATS.find((v) => v.value === visualFormat)?.label}
                </p>
                <p>
                  <span className="text-muted-foreground">Frequência:</span>{" "}
                  {RECURRENCE_OPTIONS.find((r) => r.value === recurrence)?.label}
                </p>
                <p>
                  <span className="text-muted-foreground">Dias:</span>{" "}
                  {preferredDays.map((d) => DAYS_OF_WEEK[d].label).join(", ")}
                </p>
                <p>
                  <span className="text-muted-foreground">Horários:</span>{" "}
                  {preferredTimes.join(", ")}
                </p>
                <p>
                  <span className="text-muted-foreground">Aprovação:</span>{" "}
                  {requiresApproval ? "Manual" : "Automática"}
                </p>
              </div>

              {/* Checklist de pré-requisitos */}
              <div className="rounded-lg border p-4 space-y-2 mt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pré-requisitos
                </p>
                {[
                  { label: "Firecrawl (pesquisa)", ok: hasFirecrawlKey, required: topics.length > 0 },
                  { label: "Post for Me (publicação)", ok: hasPfmKey, required: true },
                  { label: "Imagens IA (OpenAI)", ok: true, required: false },
                  { label: "Plataformas selecionadas", ok: platforms.length > 0, required: true },
                  { label: "Contas conectadas", ok: accountIds.length > 0, required: true },
                  { label: "Horários definidos", ok: preferredTimes.length > 0, required: true },
                ].map(({ label, ok, required }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    {ok ? (
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                    ) : required ? (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <span className={ok ? "text-green-600 dark:text-green-400" : required ? "text-destructive" : "text-amber-600 dark:text-amber-400"}>
                      {label}
                    </span>
                    {!ok && required && (
                      <span className="ml-auto text-[10px] text-destructive font-medium">faltando</span>
                    )}
                    {!ok && !required && (
                      <span className="ml-auto text-[10px] text-amber-600 font-medium">opcional</span>
                    )}
                  </div>
                ))}
              </div>

              {(!hasPfmKey || platforms.length === 0 || accountIds.length === 0 || preferredTimes.length === 0) && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {"Resolva os itens obrigatórios antes de salvar."}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={step === 0 ? onCancel : () => setStep(step - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 0 ? "Cancelar" : "Voltar"}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saveConfig.isPending || !hasPfmKey || platforms.length === 0 || accountIds.length === 0 || preferredTimes.length === 0}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saveConfig.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Salvar Configuração
          </Button>
        )}
      </div>
    </div>
  );
}
