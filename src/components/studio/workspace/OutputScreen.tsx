/**
 * OutputScreen — tela dedicada de resultado do modo automático.
 * Preview grande dos slides/vídeo, legenda editável (com geração IA),
 * seleção de redes, placement IG, publicar agora ou agendar.
 */
import { useState } from "react";
import {
  Send, CalendarClock, Loader2, CheckCircle2, Wand2, RotateCcw, PenTool,
  ChevronLeft, ChevronRight, Copy, Users, Link2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePfmAccounts, usePfmCreatePost } from "@/hooks/use-blotato";
import { pfmCreateUploadUrl, aiAssist } from "@/lib/api";
import { PLATFORMS } from "@/lib/platforms";
import { brandTextHint, type BrandProfile } from "@/lib/brand";
import { saveVisualToGallery, saveUploadToGallery, markAsPublishedByUrls, updateCreation, sanitizeDesignDoc, persistDesignDoc } from "@/lib/gallery";
import type { Platform } from "@/types";
import type { StudioDoc } from "./types";

function isHttp(u?: string): boolean { return !!u && /^https?:\/\//.test(u); }

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head)?.[1] || "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function OutputScreen({
  doc, brand, onRestart, onEditInCanvas, renderedUrls, creationId, onSaved,
}: {
  doc: StudioDoc;
  brand: BrandProfile | null;
  onRestart: () => void;
  onEditInCanvas: (doc: StudioDoc) => void;
  /** URLs renderizadas pelo MESMO renderer que salva na Galeria. Quando presente,
   *  são usadas como preview/upload em vez de `slide.bgImage` (que é o fundo limpo). */
  renderedUrls?: string[];
  /** ID da `creation` já salva nesta sessão. Quando presente, "Salvar na galeria"
   *  ATUALIZA a entrada existente em vez de criar uma nova (evita duplicatas). */
  creationId?: string;
  /** Avisa o pai quando uma nova `creation` é criada, para reaproveitar o ID. */
  onSaved?: (id: string) => void;
}) {
  const { user } = useAuth();
  const { data: accounts = [], isLoading: acctLoading } = usePfmAccounts();
  const createPost = usePfmCreatePost();

  const [slideIdx, setSlideIdx] = useState(0);
  const [caption, setCaption] = useState(doc.caption || "");
  const [selected, setSelected] = useState<string[]>([]);
  const [igPlacement, setIgPlacement] = useState<"timeline" | "reels" | "stories">("timeline");
  const [when, setWhen] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const [genCap, setGenCap] = useState(false);
  const [saving, setSaving] = useState(false);

  const isVideo = !!doc.videoUrl;
  const media = isVideo
    ? [doc.videoUrl!]
    : (renderedUrls && renderedUrls.length
        ? renderedUrls
        : doc.slides.map((s) => s.bgImage).filter((u): u is string => !!u));
  const hasIg = selected.some((id) => accounts.find((a) => a.id === id)?.platform === "instagram");

  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const generateCaption = async () => {
    setGenCap(true);
    try {
      const { text } = await aiAssist({
        system: `Você é redator de redes sociais. Escreva uma legenda envolvente em português brasileiro, com gancho, 1 CTA e 5-8 hashtags relevantes no final. ${brandTextHint(brand)} Responda APENAS com a legenda.`,
        prompt: doc.caption || "post de redes sociais", temperature: 0.8,
      });
      if (text) { setCaption(text); toast.success("Legenda gerada pela IA"); }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setGenCap(false); }
  };

  const uploadMedia = async (): Promise<string[]> => {
    if (!user) return [];
    const out: string[] = [];
    for (const url of media) {
      // Validação: descarta URLs vazias/inválidas antes de enviar pro Post for Me.
      if (!url || typeof url !== "string") continue;
      if (url.startsWith("data:") && url.length < 200) continue;
      try {
        if (url.startsWith("data:")) {
          const blob = dataUrlToBlob(url);
          if (!blob.size) continue;
          const path = `studio/${user.id}/pub_${crypto.randomUUID()}.png`;
          const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: "image/png" });
          if (error) throw error;
          const pub = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
          const { media_url, upload_url } = await pfmCreateUploadUrl();
          const hosted = await fetch(pub).then((r) => r.blob());
          await fetch(upload_url, { method: "PUT", body: hosted, headers: { "Content-Type": "image/png" } });
          out.push(media_url);
        } else if (isHttp(url)) {
          const { media_url, upload_url } = await pfmCreateUploadUrl();
          const blob = await (await fetch(url)).blob();
          await fetch(upload_url, { method: "PUT", body: blob, headers: { "Content-Type": blob.type || "application/octet-stream" } });
          out.push(media_url);
        }
      } catch { if (isHttp(url)) out.push(url); }
    }
    return out.filter(isHttp);
  };

  const publish = async () => {
    if (!selected.length) { toast.error("Selecione ao menos uma conta."); return; }
    if (when === "schedule" && !scheduledAt) { toast.error("Defina data e hora do agendamento."); return; }
    setPublishing(true); setDone(false);
    try {
      const hosted = media.length ? await uploadMedia() : [];
      if (hosted.length) saveUploadToGallery(hosted);

      const cfgs = selected.map((id) => {
        const acc = accounts.find((a) => a.id === id);
        const cfg: Record<string, unknown> = {
          caption: (acc && doc.captionsByPlatform?.[acc.platform]) || caption,
        };
        if (acc?.platform === "instagram") cfg.placement = igPlacement;
        return { social_account_id: id, configuration: cfg };
      });

      const payload: Record<string, unknown> = { caption, social_accounts: selected, account_configurations: cfgs };
      if (when === "schedule") payload.scheduled_at = new Date(scheduledAt).toISOString();
      if (hosted.length) payload.media = hosted.map((url) => ({ url }));

      await createPost.mutateAsync(payload as unknown as Parameters<typeof createPost.mutateAsync>[0]);
      if (hosted.length) markAsPublishedByUrls(hosted);
      setDone(true);
      toast.success(when === "schedule" ? "Post agendado!" : "Publicado com sucesso!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao publicar"); }
    finally { setPublishing(false); }
  };

  const handleSaveGallery = async () => {
    if (!user) { toast.error("Faça login para salvar"); return; }
    if (!media.length) { toast.error("Nenhuma mídia para salvar"); return; }
    setSaving(true);
    try {
      const urls: string[] = [];
      for (const url of media) {
        try {
          if (url.startsWith("data:")) {
            const blob = dataUrlToBlob(url);
            const mime = blob.type || "image/png";
            const ext = mime.split("/")[1]?.split(";")[0] || "png";
            const path = `studio/${user.id}/gal_${crypto.randomUUID()}.${ext}`;
            const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: mime });
            if (error) { console.error("[gallery] upload data:", error); continue; }
            urls.push(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
          } else if (url.startsWith("blob:")) {
            const resp = await fetch(url);
            const blob = await resp.blob();
            const mime = blob.type || "image/png";
            const ext = mime.split("/")[1]?.split(";")[0] || "png";
            const path = `studio/${user.id}/gal_${crypto.randomUUID()}.${ext}`;
            const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: mime });
            if (error) { console.error("[gallery] upload blob:", error); continue; }
            urls.push(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
          } else if (isHttp(url)) {
            urls.push(url);
          }
        } catch (err) {
          console.error("[gallery] item failed:", err);
        }
      }
      if (!urls.length) {
        toast.error("Não foi possível preparar a mídia");
        return;
      }
      const persistedDoc = (await persistDesignDoc(doc)) ?? sanitizeDesignDoc(doc);
      const saved = await saveVisualToGallery({ urls, prompt: doc.caption, templateName: "Studio · Automático", designDoc: persistedDoc });
      if (!saved) {
        toast.error("Falha ao salvar na galeria");
        return;
      }
      toast.success("Salvo na galeria");
    } catch (e) {
      console.error("[gallery] save error:", e);
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onRestart}><RotateCcw className="mr-1.5 h-4 w-4" /> Recomeçar</Button>
        <Button variant="ghost" size="sm" onClick={() => onEditInCanvas(doc)}><PenTool className="mr-1.5 h-4 w-4" /> Refinar no canvas</Button>
        <h1 className="ml-auto text-lg font-semibold text-muted-foreground">Resultado</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* ── Preview ── */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-3">
              {isVideo ? (
                <video src={doc.videoUrl} controls className="block h-full w-full rounded-xl object-cover" style={{ aspectRatio: "4 / 5" }} />
              ) : media.length === 1 ? (
                <img src={media[0]} alt="Arte" className="block h-full w-full rounded-xl object-cover object-center" style={{ aspectRatio: "4 / 5", background: "#0b0b12" }} />
              ) : (
                <div className="space-y-2">
                  <img src={media[slideIdx] || media[0]} alt={`Slide ${slideIdx + 1}`} className="block h-full w-full rounded-xl object-cover object-center" style={{ aspectRatio: "4 / 5", background: "#0b0b12" }} />
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setSlideIdx(Math.max(0, slideIdx - 1))} disabled={slideIdx === 0}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-xs text-muted-foreground">{slideIdx + 1}/{media.length}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setSlideIdx(Math.min(media.length - 1, slideIdx + 1))} disabled={slideIdx === media.length - 1}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                  {/* thumbs */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {media.map((m, i) => (
                      <button key={i} onClick={() => setSlideIdx(i)} className={`shrink-0 overflow-hidden rounded-lg border-2 ${i === slideIdx ? "border-violet-500" : "border-transparent"}`}>
                        <img src={m} alt="" className="h-14 w-14 object-cover object-center" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" size="sm" className="w-full" onClick={handleSaveGallery} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />} Salvar na galeria
          </Button>
        </div>

        {/* ── Publicação ── */}
        <div className="space-y-4">
          {/* Legenda */}
          <Card>
            <CardContent className="space-y-3 p-4">
              <Label className="flex items-center justify-between text-xs font-medium">
                Legenda
                <Button variant="ghost" size="sm" className="h-6 text-violet-600 text-[11px]" onClick={generateCaption} disabled={genCap}>
                  {genCap ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />} Gerar com IA
                </Button>
              </Label>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} />
              {doc.hashtags?.length ? (
                <div className="flex flex-wrap gap-1">
                  {doc.hashtags.map((h) => (
                    <button key={h} onClick={() => setCaption((c) => `${c}\n#${h.replace(/^#/, "")}`)}>
                      <Badge variant="secondary" className="cursor-pointer text-[10px] hover:bg-accent">#{h.replace(/^#/, "")}</Badge>
                    </button>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Separator />

          {/* Contas */}
          <Card>
            <CardContent className="space-y-3 p-4">
              <Label className="text-xs font-medium">Publicar em</Label>
              {acctLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
              ) : accounts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
                  <Users className="mx-auto mb-2 h-5 w-5 opacity-50" /> Nenhuma conta conectada.
                  <div className="mt-2"><Button asChild variant="outline" size="sm"><Link to="/accounts"><Link2 className="mr-1.5 h-3.5 w-3.5" /> Conectar</Link></Button></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {accounts.map((a) => {
                    const cfg = PLATFORMS[a.platform as Platform];
                    const on = selected.includes(a.id);
                    return (
                      <button key={a.id} onClick={() => toggle(a.id)}>
                        <Badge variant={on ? "default" : "secondary"} className={on ? "bg-violet-600 hover:bg-violet-700 cursor-pointer gap-1" : "cursor-pointer hover:bg-accent gap-1"}>
                          {cfg?.icon} {a.username || cfg?.name || a.platform}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}

              {hasIg && (
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Posição no Instagram</Label>
                  <div className="flex gap-1.5">
                    {([["timeline", "Feed"], ["reels", "Reels"], ["stories", "Stories"]] as const).map(([v, lbl]) => (
                      <Button key={v} variant={igPlacement === v ? "default" : "outline"} size="sm" className={igPlacement === v ? "bg-violet-600 hover:bg-violet-700" : ""} onClick={() => setIgPlacement(v)}>{lbl}</Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agendamento */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={when === "now" ? "default" : "outline"} size="sm" className={when === "now" ? "bg-violet-600 hover:bg-violet-700" : ""} onClick={() => setWhen("now")}>Publicar agora</Button>
            <Button variant={when === "schedule" ? "default" : "outline"} size="sm" className={when === "schedule" ? "bg-violet-600 hover:bg-violet-700" : ""} onClick={() => setWhen("schedule")}>
              <CalendarClock className="mr-1.5 h-3.5 w-3.5" /> Agendar
            </Button>
            {when === "schedule" && <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="h-9 w-auto" />}
          </div>

          {/* CTA principal */}
          <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500" size="lg" onClick={publish} disabled={publishing || !selected.length}>
            {publishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
              : done ? <><CheckCircle2 className="mr-2 h-4 w-4" /> {when === "schedule" ? "Agendado ✓ — enviar de novo" : "Publicado ✓ — enviar de novo"}</>
              : <><Send className="mr-2 h-4 w-4" /> {when === "schedule" ? "Agendar post" : "Publicar agora"}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
