import { useState } from "react";
import {
  CalendarDays,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  Copy,
  Pencil,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useCompanyPfmPosts } from "@/hooks/use-blotato";
import { useCompany } from "@/contexts/CompanyContext";

import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { isPfmAuthError } from "@/lib/pfm-errors";
import { PfmAuthExpired } from "@/components/PfmAuthExpired";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface PfmPost {
  id: string;
  caption: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  social_accounts: string[];
  platform?: string;
  media?: { url: string }[];
}

/** Formata Date -> "YYYY-MM-DD" em horário local (para <input type="date">). */
function toLocalDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
/** Formata Date -> "HH:MM" em horário local. */
function toLocalTimeInput(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

export default function Schedule() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  const postsQuery = useCompanyPfmPosts(activeCompanyId, { status: "scheduled", limit: 50 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estado do dialog de reagendamento
  const [editing, setEditing] = useState<PfmPost | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const posts: PfmPost[] = ((postsQuery.data as any[]) || []).filter(
    (p: any) => p.status === "scheduled" && p.scheduled_at,
  );

  const pfmAuthExpired = postsQuery.isError && isPfmAuthError(postsQuery.error);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getPostsForDay = (day: number) =>
    posts.filter((p) => {
      if (!p.scheduled_at) return false;
      const d = new Date(p.scheduled_at);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.pfmDeletePost(id);
      postsQuery.refetch();
      toast({ title: "Post removido da agenda" });
      if (editing?.id === id) setEditing(null);
    } catch (err) {
      toast({
        title: "Erro ao remover",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = (post: PfmPost) => {
    navigate("/studio", { state: { sourceContent: post.caption, sourceTitle: "Post duplicado" } });
  };

  const openReschedule = (post: PfmPost) => {
    if (!post.scheduled_at) return;
    const d = new Date(post.scheduled_at);
    setEditing(post);
    setEditDate(toLocalDateInput(d));
    setEditTime(toLocalTimeInput(d));
  };

  const handleSaveReschedule = async () => {
    if (!editing) return;
    if (!editDate || !editTime) {
      toast({ title: "Preencha data e hora", variant: "destructive" });
      return;
    }
    const [y, m, d] = editDate.split("-").map(Number);
    const [hh, mm] = editTime.split(":").map(Number);
    const local = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
    if (Number.isNaN(local.getTime())) {
      toast({ title: "Data/hora inválida", variant: "destructive" });
      return;
    }
    if (local.getTime() < Date.now() - 60_000) {
      toast({ title: "Escolha um horário futuro", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      // PFM exige o CreateSocialPostDto completo no PUT — buscamos o post atual
      // e sobrescrevemos apenas o scheduled_at.
      const current: any = await api.pfmGetPost(editing.id);
      const src = current?.data ?? current ?? {};

      const socialAccounts: string[] = Array.isArray(src.social_accounts)
        ? src.social_accounts
            .map((a: any) => (typeof a === "string" ? a : a?.id))
            .filter((v: any): v is string => typeof v === "string" && v.length > 0)
        : [];

      const media = Array.isArray(src.media)
        ? src.media
            .map((m: any) => (typeof m === "string" ? { url: m } : m?.url ? { url: m.url } : null))
            .filter((m: any) => m !== null)
        : [];

      const payload: Record<string, unknown> = {
        caption: src.caption ?? editing.caption ?? "",
        social_accounts: socialAccounts,
        scheduled_at: local.toISOString(),
        isDraft: false,
      };
      if (media.length > 0) payload.media = media;
      if (src.platform_configurations) payload.platform_configurations = src.platform_configurations;
      if (src.account_configurations) payload.account_configurations = src.account_configurations;

      await api.pfmUpdatePost(editing.id, payload);
      toast({ title: "Post reagendado", description: local.toLocaleString("pt-BR") });
      setEditing(null);
      postsQuery.refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast({
        title: isPfmAuthError(err) ? "Sessão do Post for Me expirou" : "Erro ao reagendar",
        description: isPfmAuthError(err) ? "Reconecte suas contas em Contas." : msg,
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CalendarDays className="h-6 w-6 text-violet-500" />
            Agenda
          </h1>
          <p className="mt-1 text-muted-foreground">Visualize e gerencie seus posts agendados</p>
        </div>
        <Link to="/studio">
          <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-500">
            <Plus className="mr-2 h-4 w-4" />
            Novo Post
          </Button>
        </Link>
      </div>

      {pfmAuthExpired ? (
        <PfmAuthExpired />
      ) : postsQuery.isError ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          Erro ao carregar agenda: {postsQuery.error?.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle className="text-base">{MONTHS[month]} {year}</CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const dayPosts = day ? getPostsForDay(day) : [];
                return (
                  <div
                    key={i}
                    className={`min-h-[80px] rounded-lg border p-1.5 transition-colors ${
                      day
                        ? isToday(day)
                          ? "border-violet-500/50 bg-violet-500/5"
                          : "border-border/50 hover:border-violet-500/30"
                        : "border-transparent"
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-medium ${isToday(day) ? "text-violet-500" : "text-muted-foreground"}`}>
                          {day}
                        </span>
                        <div className="mt-0.5 space-y-0.5">
                          {dayPosts.slice(0, 2).map((p) => (
                            <div
                              key={p.id}
                              onClick={() => openReschedule(p)}
                              className="rounded bg-violet-500/10 px-1 py-0.5 text-[9px] text-violet-600 truncate cursor-pointer hover:bg-violet-500/20 transition-colors"
                              title="Clique para reagendar"
                            >
                              {new Date(p.scheduled_at!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              {" "}{p.caption?.slice(0, 15)}
                            </div>
                          ))}
                          {dayPosts.length > 2 && (
                            <span className="text-[9px] text-muted-foreground">+{dayPosts.length - 2} mais</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-fuchsia-500" />
              Próximos Posts
            </CardTitle>
            <CardDescription>
              {postsQuery.isLoading ? <Skeleton className="h-4 w-24" /> : `${posts.length} post(s) agendado(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {postsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Nenhum post agendado</p>
                <Link to="/studio">
                  <Button variant="outline" size="sm" className="mt-3"><Plus className="mr-2 h-3 w-3" />Criar Post</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => openReschedule(post)}
                    className="rounded-lg border p-3 space-y-2 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-colors"
                    title="Clique para reagendar"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">Agendado</Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); openReschedule(post); }}
                          title="Reagendar"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); handleDuplicate(post); }}
                          title="Duplicar"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover post agendado?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O post será removido da fila de publicação.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(post.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                {deletingId === post.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <p className="text-xs line-clamp-2">{post.caption || "(sem legenda)"}</p>
                    {post.scheduled_at && (
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(post.scheduled_at).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Reagendar */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reagendar post</DialogTitle>
            <DialogDescription>Escolha uma nova data e hora para publicar.</DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                  {editing.caption || "(sem legenda)"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reschedule-date">Data</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reschedule-time">Hora</Label>
                  <Input
                    id="reschedule-time"
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(editing)}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Editar conteúdo no Studio
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover post agendado?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O post será removido da fila de publicação.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(editing.id)}
                        className="bg-destructive text-destructive-foreground"
                      >
                        {deletingId === editing.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveReschedule}
              disabled={savingEdit}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-500"
            >
              {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar novo horário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
