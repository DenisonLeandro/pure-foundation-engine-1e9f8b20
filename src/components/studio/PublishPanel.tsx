import { useState } from "react";
import { Loader2, Send, CheckCircle2, CalendarClock, Link2, Users, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { usePfmAccounts, usePfmCreatePost } from "@/hooks/use-blotato";
import { pfmCreateUploadUrl, aiAssist } from "@/lib/api";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/types";
import { brandTextHint, type BrandProfile } from "@/lib/brand";
import { saveUploadToGallery, markAsPublishedByUrls } from "@/lib/gallery";
import { isPfmAuthError } from "@/lib/pfm-errors";
import { PfmAuthExpired } from "@/components/PfmAuthExpired";
import { useArticles } from "@/hooks/use-articles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function isHttp(u?: string): boolean {
  return !!u && /^https?:\/\//.test(u);
}

/**
 * Publicação direta no Post for Me — reutilizável por todas as abas do Studio.
 * Seleção de contas conectadas, legenda (com override por plataforma), publicar
 * agora ou agendar, e upload de mídia (data:/http) para o CDN do PFM.
 */
export function PublishPanel({
  defaultCaption = "",
  captionsByPlatform,
  media = [],
  defaultScheduledAt,
  brand,
  captionTopic,
}: {
  defaultCaption?: string;
  captionsByPlatform?: Record<string, string>;
  media?: string[];
  defaultScheduledAt?: string;
  brand?: BrandProfile | null;
  captionTopic?: string;
}) {
  const { data: accounts = [], isLoading, isError, error } = usePfmAccounts();
  const pfmAuthExpired = isError && isPfmAuthError(error);
  const createPost = usePfmCreatePost();
  const { articles } = useArticles();
  const [selected, setSelected] = useState<string[]>([]);
  const [caption, setCaption] = useState(defaultCaption);
  const [when, setWhen] = useState<"now" | "schedule">(defaultScheduledAt ? "schedule" : "now");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt ? defaultScheduledAt.slice(0, 16) : "");
  const [igPlacement, setIgPlacement] = useState<"timeline" | "reels" | "stories">("timeline");
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const [genCap, setGenCap] = useState(false);
  const [linkedArticleId, setLinkedArticleId] = useState<string>("");

  const generateCaption = async () => {
    const topic = (captionTopic || caption || "").trim();
    if (!topic) { toast.error("Sem contexto para a legenda."); return; }
    setGenCap(true);
    try {
      const { text } = await aiAssist({
        system: [
          "Você é redator sênior de redes sociais em português brasileiro.",
          "Escreva uma legenda envolvente, clara e natural.",
          "REGRAS OBRIGATÓRIAS:",
          "- NÃO comece com 'Você sabia?', 'Fique atento!', 'Salve este post' ou 'Procure um advogado'.",
          "- Varie a abertura (contexto, observação, pergunta).",
          "- Tom informativo, responsável, sem sensacionalismo ou promessa de resultado.",
          "- Sem captação comercial agressiva.",
          "- No máximo 2 emojis pontuais. No máximo 5 hashtags relevantes no final.",
          "- Para tema jurídico: educativo, sem prometer direito, sem induzir contratação.",
          "Estrutura: abertura contextual → explicação curta → ponto prático → chamada leve para refletir/salvar/compartilhar.",
          brandTextHint(brand),
          "Responda APENAS com a legenda final.",
        ].join("\n"),
        prompt: topic, temperature: 0.85,
      });
      if (text) { setCaption(text.trim()); toast.success("Legenda gerada pela IA"); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar legenda");
    } finally { setGenCap(false); }
  };

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const hasInstagram = selected.some((id) => accounts.find((a) => a.id === id)?.platform === "instagram");

  const uploadMedia = async (): Promise<string[]> => {
    const out: string[] = [];
    for (const url of media) {
      try {
        const { media_url, upload_url } = await pfmCreateUploadUrl();
        const blob = await (await fetch(url)).blob();
        await fetch(upload_url, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": blob.type || "application/octet-stream" },
        });
        out.push(media_url);
      } catch {
        if (isHttp(url)) out.push(url);
      }
    }
    return out.filter(isHttp);
  };

  const publish = async () => {
    if (!selected.length) { toast.error("Selecione ao menos uma conta."); return; }
    if (when === "schedule" && !scheduledAt) { toast.error("Defina data e hora do agendamento."); return; }
    if (!caption.trim()) {
      const ok = typeof window !== "undefined" && window.confirm("Este post está sem legenda. Deseja continuar?");
      if (!ok) return;
    }
    setPublishing(true);
    setDone(false);
    try {
      const hosted = media.length ? await uploadMedia() : [];
      if (hosted.length) saveUploadToGallery(hosted);

      const account_configurations = selected.map((id) => {
        const acc = accounts.find((a) => a.id === id);
        const cfg: Record<string, unknown> = {
          caption: (acc && captionsByPlatform?.[acc.platform]) || caption,
        };
        if (acc?.platform === "instagram") cfg.placement = igPlacement;
        return { social_account_id: id, configuration: cfg };
      });

      const payload: Record<string, unknown> = {
        caption,
        social_accounts: selected,
        account_configurations,
      };
      if (when === "schedule") payload.scheduled_at = new Date(scheduledAt).toISOString();
      if (hosted.length) payload.media = hosted.map((url) => ({ url }));

      await createPost.mutateAsync(payload as unknown as Parameters<typeof createPost.mutateAsync>[0]);
      if (hosted.length) markAsPublishedByUrls(hosted);

      // Se publicando "agora" com um artigo vinculado, publicar o artigo também
      if (linkedArticleId && when === "now") {
        try {
          const { getSupabaseUrl, baseHeaders } = await import("@/lib/api/_shared");
          const url = `${getSupabaseUrl()}/functions/v1/publish-article`;
          const headers = await baseHeaders();
          const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ article_id: linkedArticleId }),
          });
          if (!res.ok) throw new Error("Falha ao publicar artigo");
        } catch (err) {
          console.error("Erro ao publicar artigo:", err);
          toast.warning("Post publicado, mas falha ao publicar o artigo. Publique manualmente.");
        }
      }

      setDone(true);
      toast.success(when === "schedule" ? "Post agendado!" : "Publicado!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao publicar");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Send className="h-4 w-4 text-violet-500" /> Publicar no Post for Me
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando contas…</div>
        ) : pfmAuthExpired ? (
          <PfmAuthExpired compact />
        ) : accounts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            <Users className="mx-auto mb-2 h-6 w-6 opacity-50" />
            Nenhuma conta conectada.
            <div className="mt-2">
              <Button asChild variant="outline" size="sm"><Link to="/accounts"><Link2 className="mr-1.5 h-3.5 w-3.5" /> Conectar contas</Link></Button>
            </div>
          </div>
        ) : (
          <>
            {/* Account selection */}
            <div className="flex flex-wrap gap-1.5">
              {accounts.map((a) => {
                const cfg = PLATFORMS[a.platform as Platform];
                const on = selected.includes(a.id);
                return (
                  <button key={a.id} type="button" onClick={() => toggle(a.id)}>
                    <Badge variant={on ? "default" : "secondary"} className={on ? "bg-violet-600 hover:bg-violet-700 cursor-pointer gap-1" : "cursor-pointer hover:bg-accent gap-1"}>
                      {cfg?.icon} {a.username || cfg?.name || a.platform}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Caption */}
            <div className="space-y-1.5">
              <Label className="flex items-center justify-between text-xs">
                <span>Legenda{captionsByPlatform ? " (padrão; cada rede usa a sua quando houver)" : ""}</span>
                <Button variant="ghost" size="sm" className="h-6 text-violet-600 text-[11px]" onClick={generateCaption} disabled={genCap}>
                  {genCap ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                  Gerar com IA
                </Button>
              </Label>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="Escreva a legenda…" />
            </div>

            {/* Instagram placement */}
            {hasInstagram && (
              <div className="space-y-1.5">
                <Label className="text-xs">Posição no Instagram</Label>
                <div className="flex gap-1.5">
                  {([["timeline", "Feed"], ["reels", "Reels"], ["stories", "Stories"]] as const).map(([v, lbl]) => (
                    <Button key={v} variant={igPlacement === v ? "default" : "outline"} size="sm" className={igPlacement === v ? "bg-violet-600 hover:bg-violet-700" : ""} onClick={() => setIgPlacement(v)}>
                      {lbl}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Link article */}
            <div className="space-y-1.5">
              <Label className="flex items-center justify-between text-xs">
                <span>Subir artigo junto? (opcional)</span>
              </Label>
              <Select value={linkedArticleId || "none"} onValueChange={(v) => setLinkedArticleId(v === "none" ? "" : v)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Nenhum artigo vinculado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {articles
                    .filter((a) => a.status !== "published")
                    .map((article) => (
                      <SelectItem key={article.id} value={article.id}>
                        {article.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={when === "now" ? "default" : "outline"} size="sm" onClick={() => setWhen("now")} className={when === "now" ? "bg-violet-600 hover:bg-violet-700" : ""}>
                Publicar agora
              </Button>
              <Button variant={when === "schedule" ? "default" : "outline"} size="sm" onClick={() => setWhen("schedule")} className={when === "schedule" ? "bg-violet-600 hover:bg-violet-700" : ""}>
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" /> Agendar
              </Button>
              {when === "schedule" && (
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="h-9 w-auto" />
              )}
            </div>

            <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500" onClick={publish} disabled={publishing || !selected.length}>
              {publishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
                : done ? <><CheckCircle2 className="mr-2 h-4 w-4" /> {when === "schedule" ? "Agendado" : "Publicado"} — enviar de novo</>
                : <><Send className="mr-2 h-4 w-4" /> {when === "schedule" ? "Agendar post" : "Publicar agora"}</>}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
