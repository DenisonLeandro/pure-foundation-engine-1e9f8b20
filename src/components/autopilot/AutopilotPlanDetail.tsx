import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Check,
  RotateCw,
  Pencil,
  Trash2,
  Clock,
  CheckCheck,
  LayoutGrid,
  Calendar as CalendarIcon,
  ImageOff,
  Pause,
  Play,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useAutopilotPlan,
  useAutopilotPosts,
  postProgress,
  useApprovePlan,
  useSetPostApproval,
  useRegenPost,
  useUpdatePost,
  useRemovePost,
  usePausePlan,
  useResumePlan,
  useCancelPlan,
  useDeletePlan,
} from "@/hooks/use-autopilot";
import { useToast } from "@/hooks/use-toast";
import type { AutopilotPlan, AutopilotPost, AutopilotPostStatus } from "@/types";

const POST_STATUS: Record<AutopilotPostStatus, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  generating: { label: "Gerando", className: "bg-violet-500/15 text-violet-600 dark:text-violet-300" },
  ready: { label: "Revisar", className: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  approved: { label: "Aprovado", className: "bg-violet-500/15 text-violet-600 dark:text-violet-300" },
  scheduled: { label: "Agendado", className: "bg-sky-500/15 text-sky-600 dark:text-sky-300" },
  published: { label: "Publicado", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  failed: { label: "Falhou", className: "bg-red-500/15 text-red-600 dark:text-red-300" },
  removed: { label: "Removido", className: "bg-muted text-muted-foreground" },
};

function ddmm(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function hhmm(iso?: string | null): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** ISO (UTC) → valor para <input type="datetime-local"> na hora local. */
function isoToLocalInput(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function AutopilotPlanDetail({ planId, onBack }: { planId: string; onBack: () => void }) {
  const { toast } = useToast();
  const planQuery = useAutopilotPlan(planId);
  const plan = planQuery.data;
  const postsQuery = useAutopilotPosts(planId, plan?.status);
  const posts = useMemo(() => postsQuery.data || [], [postsQuery.data]);

  const approvePlan = useApprovePlan();

  const prog = postProgress(posts);
  const isGenerating = plan?.status === "generating" && prog.doneGenerating < prog.total;

  const header = (
    <div className="flex flex-col gap-1">
      <button onClick={onBack} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="text-2xl font-bold tracking-tight">{plan?.name ?? "Plano"}</h1>
    </div>
  );

  if (planQuery.isLoading || (!plan && planQuery.isFetching)) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> carregando…
      </div>
    );
  }
  if (!plan) {
    return (
      <div className="space-y-4">
        {header}
        <p className="text-sm text-muted-foreground">Plano não encontrado.</p>
      </div>
    );
  }

  // ── Gerando (⑤ progresso) ──────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Criando seus posts…</h2>
                <p className="text-sm text-muted-foreground">
                  Arte + legenda de cada dia. Você pode fechar — avisamos quando terminar.
                </p>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {prog.doneGenerating} / {prog.total}
              </span>
            </div>
            <Progress value={prog.total ? (prog.doneGenerating / prog.total) * 100 : 0} className="h-2" />
            <div className="grid grid-cols-8 gap-2 sm:grid-cols-12">
              {posts.map((p) => {
                const filled = p.status !== "draft" && p.status !== "generating";
                const working = p.status === "generating";
                return (
                  <div
                    key={p.id}
                    className={`aspect-square rounded-md border ${
                      filled
                        ? "border-transparent bg-gradient-to-br from-violet-500 to-fuchsia-500"
                        : working
                          ? "animate-pulse border-violet-400 bg-violet-500/20"
                          : "border-border bg-muted/40"
                    }`}
                    title={`${ddmm(p.post_date)} · ${p.theme}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Revisão / rodando (⑤ cards + calendário) ───────────────────
  const reviewable = posts.filter((p) => p.status === "ready" || p.status === "approved");
  const approvedCount = posts.filter((p) => p.status === "approved").length;
  const scheduledish = posts.filter((p) =>
    ["scheduled", "published"].includes(p.status),
  ).length;
  const isReviewPhase = reviewable.length > 0 && scheduledish === 0;

  async function handleApproveAll() {
    try {
      await approvePlan.mutateAsync(planId);
      toast({ title: "Aprovado ✅", description: "Os posts foram agendados no melhor horário. O ciclo roda sozinho." });
    } catch (e) {
      toast({
        title: "Não foi possível aprovar",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      {header}
      {isReviewPhase ? (
        <ReviewSection
          planName={plan.name}
          posts={posts}
          readyCount={posts.filter((p) => p.status === "ready").length}
          approvedCount={approvedCount}
          showApproveAll
          approving={approvePlan.isPending}
          onApproveAll={handleApproveAll}
        />
      ) : (
        <PlanDashboard plan={plan} posts={posts} />
      )}
    </div>
  );
}

// ─── Dashboard (⑥ rodando sozinho) ──────────────────────────────

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const end = new Date(`${dateStr}T23:59:59`);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

function PlanDashboard({ plan, posts }: { plan: AutopilotPlan; posts: AutopilotPost[] }) {
  const { toast } = useToast();
  const pause = usePausePlan();
  const resume = useResumePlan();
  const cancel = useCancelPlan();

  const count = (s: AutopilotPostStatus) => posts.filter((p) => p.status === s).length;
  const tiles = [
    { label: "Aprovados", value: count("approved"), dot: "bg-violet-500" },
    { label: "Agendados", value: count("scheduled"), dot: "bg-sky-500" },
    { label: "Publicados", value: count("published"), dot: "bg-emerald-500" },
    { label: "Com erro", value: count("failed"), dot: "bg-red-500" },
  ];

  const remaining = daysUntil(plan.period_end);
  const showEnding =
    (plan.status === "active" || plan.status === "approved") &&
    remaining !== null &&
    remaining >= 0 &&
    remaining <= 7;

  const statusBadge =
    plan.status === "active"
      ? { label: "Ativo", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" }
      : plan.status === "paused"
        ? { label: "Pausado", className: "bg-amber-500/15 text-amber-600 dark:text-amber-300" }
        : plan.status === "completed"
          ? { label: "Concluído", className: "bg-muted text-muted-foreground" }
          : plan.status === "canceled"
            ? { label: "Cancelado", className: "bg-muted text-muted-foreground" }
            : { label: "Aprovado", className: "bg-violet-500/15 text-violet-600 dark:text-violet-300" };

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast({ title: ok });
    } catch (e) {
      toast({ title: "Ação falhou", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }

  const canPause = plan.status === "active" || plan.status === "approved";
  const canResume = plan.status === "paused";
  const canCancel = !["completed", "canceled"].includes(plan.status);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {plan.platforms.length > 0 && <span>{plan.platforms.join(", ")}</span>}
          <Badge variant="secondary" className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {canPause && (
            <Button variant="outline" size="sm" disabled={pause.isPending} onClick={() => run(() => pause.mutateAsync(plan.id), "Plano pausado")}>
              <Pause className="mr-1 h-4 w-4" /> Pausar
            </Button>
          )}
          {canResume && (
            <Button variant="outline" size="sm" disabled={resume.isPending} onClick={() => run(() => resume.mutateAsync(plan.id), "Plano retomado")}>
              <Play className="mr-1 h-4 w-4" /> Retomar
            </Button>
          )}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                  <XCircle className="mr-1 h-4 w-4" /> Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar este plano?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Os posts ainda não publicados são desagendados. O que já publicou é preservado. Não dá pra
                    retomar depois.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => run(() => cancel.mutateAsync(plan.id), "Plano cancelado")}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancelar plano
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <p className="text-3xl font-bold">{t.value}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${t.dot}`} /> {t.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendário do mês */}
      <Card>
        <CardContent className="p-4">
          <MiniCalendar posts={posts} />
        </CardContent>
      </Card>

      {/* Aviso de 7 dias */}
      {showEnding && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-semibold text-amber-600 dark:text-amber-300">
              Seu plano termina em {remaining} dia{remaining === 1 ? "" : "s"} ({plan.period_end}).
            </p>
            <p className="text-muted-foreground">
              Cole o próximo plano pra não parar de postar. Avisamos também por e-mail.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Seção de revisão (cards + calendário) ──────────────────────

function ReviewSection({
  planName,
  posts,
  readyCount,
  approvedCount,
  showApproveAll,
  approving,
  onApproveAll,
}: {
  planName: string;
  posts: AutopilotPost[];
  readyCount: number;
  approvedCount: number;
  showApproveAll: boolean;
  approving: boolean;
  onApproveAll: () => void;
}) {
  const [view, setView] = useState<"cards" | "calendar">("cards");

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Revisar posts — {planName}</h2>
            <p className="text-sm text-muted-foreground">
              {readyCount} prontos · {approvedCount} aprovados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border p-0.5">
              <button
                onClick={() => setView("cards")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm ${
                  view === "cards" ? "bg-violet-600 text-white" : "text-muted-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Cards
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm ${
                  view === "calendar" ? "bg-violet-600 text-white" : "text-muted-foreground"
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" /> Calendário
              </button>
            </div>
            {showApproveAll && (
              <Button onClick={onApproveAll} disabled={approving} className="bg-violet-600 hover:bg-violet-700">
                {approving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-1 h-4 w-4" />}
                Aprovar tudo
              </Button>
            )}
          </div>
        </div>

        {view === "cards" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <ReviewCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <MiniCalendar posts={posts} />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Card de post ───────────────────────────────────────────────

function ReviewCard({ post }: { post: AutopilotPost }) {
  const { toast } = useToast();
  const setApproval = useSetPostApproval();
  const regen = useRegenPost();
  const update = useUpdatePost();
  const remove = useRemovePost();

  const [editCaption, setEditCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(post.caption ?? "");
  const [editTime, setEditTime] = useState(false);
  const [timeDraft, setTimeDraft] = useState(isoToLocalInput(post.scheduled_at));

  const s = POST_STATUS[post.status] ?? POST_STATUS.draft;
  const busy = post.status === "generating";
  const isApproved = post.status === "approved";

  async function saveCaption() {
    await update.mutateAsync({ id: post.id, caption: captionDraft });
    setEditCaption(false);
    toast({ title: "Legenda atualizada" });
  }
  async function saveTime() {
    const iso = new Date(timeDraft).toISOString();
    await update.mutateAsync({ id: post.id, scheduled_at: iso, time_locked: true });
    setEditTime(false);
    toast({ title: "Horário ajustado" });
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      {/* Arte */}
      <div className="relative aspect-[4/5] bg-gradient-to-br from-violet-600 to-fuchsia-600">
        {post.image_url ? (
          <img src={post.image_url} alt={post.theme} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-white">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageOff className="h-6 w-6 opacity-70" />}
            <span className="text-sm font-semibold leading-tight">{post.theme}</span>
          </div>
        )}
        <Badge variant="secondary" className={`absolute right-2 top-2 ${s.className}`}>
          {s.label}
        </Badge>
      </div>

      {/* Meta + legenda */}
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {ddmm(post.post_date)} · {hhmm(post.scheduled_at)}
          </span>
          {post.category && <span className="rounded bg-muted px-1.5 py-0.5">{post.category}</span>}
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">{post.caption || "— sem legenda —"}</p>
        {post.error && <p className="text-xs text-red-500">{post.error}</p>}

        {/* Ações */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button
            size="sm"
            variant={isApproved ? "outline" : "default"}
            className={isApproved ? "" : "bg-violet-600 hover:bg-violet-700"}
            disabled={busy || setApproval.isPending || !(post.status === "ready" || isApproved)}
            onClick={() => setApproval.mutate({ id: post.id, approved: !isApproved })}
          >
            {isApproved ? <RotateCw className="mr-1 h-3.5 w-3.5" /> : <Check className="mr-1 h-3.5 w-3.5" />}
            {isApproved ? "Reabrir" : "Aprovar"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditCaption(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Legenda
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || regen.isPending}
            onClick={() => regen.mutate({ postId: post.id, kind: "image" })}
          >
            <RotateCw className="mr-1 h-3.5 w-3.5" /> Arte
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditTime(true)}>
            <Clock className="mr-1 h-3.5 w-3.5" /> Horário
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-red-500"
            disabled={remove.isPending}
            onClick={() => remove.mutate(post.id)}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
          </Button>
        </div>
      </div>

      {/* Dialog: editar legenda */}
      <Dialog open={editCaption} onOpenChange={setEditCaption}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar legenda</DialogTitle>
          </DialogHeader>
          <Textarea
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            className="min-h-[160px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCaption(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCaption} disabled={update.isPending} className="bg-violet-600 hover:bg-violet-700">
              {update.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: ajustar horário */}
      <Dialog open={editTime} onOpenChange={setEditTime}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar data e horário</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Publicar em (seu fuso)</Label>
            <Input type="datetime-local" value={timeDraft} onChange={(e) => setTimeDraft(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTime(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTime} disabled={update.isPending} className="bg-violet-600 hover:bg-violet-700">
              {update.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Mini calendário (chips coloridos por status) ───────────────

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function MiniCalendar({ posts }: { posts: AutopilotPost[] }) {
  const byDate = useMemo(() => {
    const m = new Map<string, AutopilotPost[]>();
    for (const p of posts) {
      const arr = m.get(p.post_date) || [];
      arr.push(p);
      m.set(p.post_date, arr);
    }
    return m;
  }, [posts]);

  const dates = [...byDate.keys()].sort();
  if (dates.length === 0) return <p className="text-sm text-muted-foreground">Sem posts.</p>;

  // Constrói uma grade mensal a partir do 1º ao último dia do período.
  const first = new Date(`${dates[0]}T12:00:00`);
  const last = new Date(`${dates[dates.length - 1]}T12:00:00`);
  const gridStart = new Date(first);
  gridStart.setDate(1);
  const startPad = gridStart.getDay();
  const totalDays = last.getDate() > first.getDate() || last.getMonth() !== first.getMonth()
    ? new Date(last.getFullYear(), last.getMonth() + 1, 0).getDate()
    : new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const iso = `${gridStart.getFullYear()}-${String(gridStart.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push(iso);
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[560px] grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-1 pb-1 text-xs font-medium text-muted-foreground">
            {w}
          </div>
        ))}
        {cells.map((iso, i) => {
          const dayPosts = iso ? byDate.get(iso) || [] : [];
          return (
            <div
              key={i}
              className={`min-h-[64px] rounded-lg border p-1 ${iso ? "border-border/60" : "border-transparent"}`}
            >
              {iso && <div className="mb-1 text-[10px] text-muted-foreground">{Number(iso.slice(-2))}</div>}
              <div className="space-y-1">
                {dayPosts.map((p) => {
                  const s = POST_STATUS[p.status] ?? POST_STATUS.draft;
                  return (
                    <div key={p.id} className={`truncate rounded px-1 py-0.5 text-[10px] ${s.className}`} title={p.theme}>
                      {p.theme}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
