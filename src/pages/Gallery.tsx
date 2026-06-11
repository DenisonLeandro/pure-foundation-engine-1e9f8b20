import { useState, useCallback, useEffect } from "react";
import {
  Image,
  Film,
  LayoutGrid,
  Eye,
  Send,
  Download,
  Trash2,
  ImageOff,
  Loader2,
  Pencil,
  MessageSquareText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MediaPreviewDialog } from "@/components/MediaPreviewDialog";
import { getCreations, deleteCreation, updateCreation, type Creation } from "@/lib/gallery";

// ─── Filter types ───────────────────────────────────────────────

type FilterType = "all" | "image" | "video" | "carousel";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "image", label: "Imagens" },
  { value: "video", label: "Vídeos" },
  { value: "carousel", label: "Carroséis" },
];

// ─── Component ──────────────────────────────────────────────────

export default function Gallery() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCreation, setPreviewCreation] = useState<Creation | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);

  // Edição de legenda
  const [captionEditing, setCaptionEditing] = useState<Creation | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [captionSaving, setCaptionSaving] = useState(false);

  const loadCreations = useCallback(async () => {
    setLoading(true);
    const data = await getCreations();
    setCreations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCreations();
  }, [loadCreations]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteCreation(id);
    loadCreations();
    toast({ title: "Criação removida" });
  }, [toast, loadCreations]);

  const filtered =
    activeFilter === "all"
      ? creations
      : creations.filter((c) => c.type === activeFilter);

  // ── Handlers ────────────────────────────────────────────────

  function handleView(creation: Creation) {
    setPreviewCreation(creation);
    setPreviewOpen(true);
  }

  function handleUseInPost(creation: Creation) {
    navigate("/studio", { state: { mediaUrls: creation.urls, fromVisual: true } });
  }

  function handleEditDesign(creation: Creation) {
    const urls = creation.urls ?? [];
    const fallback = urls[0] ?? creation.thumbnailUrl ?? null;
    if (!creation.designDoc && !fallback) {
      toast({ title: "Sem imagem para editar", variant: "destructive" });
      return;
    }
    if (!creation.designDoc) {
      toast({
        title: "Item gerado como imagem estática",
        description: "Vamos abrir o editor usando esta imagem como fundo. Você pode adicionar textos e salvar como versão editável.",
      });
    }
    navigate("/studio", {
      state: {
        designDoc: creation.designDoc ?? null,
        creationId: creation.id,
        fallbackImageUrl: fallback,
        fallbackImageUrls: urls,
      },
    });
  }

  async function handleDownload(creation: Creation) {
    const urls = creation.urls?.length ? creation.urls : (creation.thumbnailUrl ? [creation.thumbnailUrl] : []);
    if (!urls.length) { toast({ title: "Nada para baixar" }); return; }

    const safeName = (creation.templateName || "criacao").replace(/[^\w\-]+/g, "_");

    // 1 arquivo só → download direto
    if (urls.length === 1) {
      const a = document.createElement("a");
      a.href = urls[0];
      a.download = safeName;
      a.target = "_blank";
      a.click();
      toast({ title: "Download iniciado" });
      return;
    }

    // Vários (carrossel) → empacota em .zip
    toast({ title: `Preparando ${urls.length} arquivos…` });
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const folder = zip.folder(safeName) || zip;

      await Promise.all(urls.map(async (url, i) => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const ext = (blob.type.split("/")[1] || "png").split(";")[0].replace("jpeg", "jpg");
          folder.file(`${String(i + 1).padStart(2, "0")}.${ext}`, blob);
        } catch {
          /* pula arquivos que falharem (ex: CORS) */
        }
      }));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${safeName}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      toast({ title: "Download iniciado", description: `${urls.length} arquivos em .zip` });
    } catch (e) {
      toast({ title: "Erro ao empacotar", description: e instanceof Error ? e.message : "tente novamente", variant: "destructive" });
    }
  }


  function handleDeleteCreation(creation: Creation) {
    handleDelete(creation.id);
  }

  function handleEditCaption(creation: Creation) {
    setCaptionEditing(creation);
    setCaptionDraft(creation.caption ?? "");
  }

  async function handleSaveCaption() {
    if (!captionEditing) return;
    setCaptionSaving(true);
    const updated = await updateCreation(captionEditing.id, { caption: captionDraft });
    setCaptionSaving(false);
    if (!updated) {
      toast({ title: "Falha ao salvar legenda", variant: "destructive" });
      return;
    }
    setCreations((prev) => prev.map((c) => (c.id === updated.id ? { ...c, caption: updated.caption } : c)));
    setCaptionEditing(null);
    toast({ title: "Legenda atualizada" });
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Image className="h-6 w-6 text-violet-500" />
          Galeria de Criações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas as suas criações salvas — imagens, vídeos e carroséis
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={activeFilter === f.value ? "default" : "outline"}
            className={
              activeFilter === f.value
                ? "bg-violet-600 hover:bg-violet-700 text-white"
                : ""
            }
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Grid or empty state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-violet-300/40 bg-violet-50/30 py-20 text-center dark:bg-violet-950/10">
          <ImageOff className="mb-4 h-12 w-12 text-violet-400/60" />
          <p className="max-w-md text-sm text-muted-foreground">
            Nenhuma criação salva ainda. Crie visuais na aba{" "}
            <span className="font-medium text-violet-600">Criar Visual</span> e
            eles aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((creation) => (
            <CreationCard
              key={creation.id}
              creation={creation}
              onView={handleView}
              onUseInPost={handleUseInPost}
              onDownload={handleDownload}
              onDelete={handleDeleteCreation}
              onEditDesign={handleEditDesign}
              onEditCaption={handleEditCaption}
            />
          ))}
        </div>
      )}

      {/* Caption edit dialog */}
      <Dialog open={!!captionEditing} onOpenChange={(o) => { if (!o) setCaptionEditing(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar legenda</DialogTitle>
            <DialogDescription>
              A legenda será usada quando você publicar/agendar este post. A imagem não é alterada.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            rows={8}
            placeholder="Escreva a legenda…"
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCaptionEditing(null)} disabled={captionSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCaption} disabled={captionSaving} className="bg-violet-600 hover:bg-violet-700">
              {captionSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar legenda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Preview Dialog */}
      {previewCreation && (
        <MediaPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          urls={previewCreation.urls}
          title={previewCreation.templateName}
          onUseInPost={() => handleUseInPost(previewCreation)}
        />
      )}
    </div>
  );
}

// ─── Creation Card ────────────────────────────────────────────────

interface CreationCardProps {
  creation: Creation;
  onView: (c: Creation) => void;
  onUseInPost: (c: Creation) => void;
  onDownload: (c: Creation) => void;
  onDelete: (c: Creation) => void;
  onEditDesign: (c: Creation) => void;
  onEditCaption: (c: Creation) => void;
}

function CreationCard({
  creation,
  onView,
  onUseInPost,
  onDownload,
  onDelete,
  onEditDesign,
  onEditCaption,
}: CreationCardProps) {
  const thumb = creation.thumbnailUrl ?? creation.urls[0] ?? "";
  const date = new Date(creation.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const captionSnippet = (creation.caption || "").trim().split(/\n+/)[0] ?? "";

  return (
    <Card className="group overflow-hidden border-violet-200/40 transition-shadow hover:shadow-lg dark:border-violet-800/30">
      {/* Thumbnail wrapper */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {thumb ? (
          <img
            src={thumb}
            alt={creation.templateName ?? "Criação"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Image className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Type overlay icon */}
        {creation.type === "video" && (
          <div className="absolute left-2 top-2 rounded-md bg-black/60 p-1">
            <Film className="h-4 w-4 text-white" />
          </div>
        )}
        {creation.type === "carousel" && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-1">
            <LayoutGrid className="h-4 w-4 text-white" />
            <span className="text-xs font-medium text-white">
              {creation.urls.length}
            </span>
          </div>
        )}

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
            title="Ver"
            onClick={() => onView(creation)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
            title="Usar em Post"
            onClick={() => onUseInPost(creation)}
          >
            <Send className="h-4 w-4" />
          </Button>
          {creation.type !== "video" && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              title={creation.designDoc ? "Editar design" : "Editar design (criar versão editável)"}
              onClick={() => onEditDesign(creation)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
            title="Editar legenda"
            onClick={() => onEditCaption(creation)}
          >
            <MessageSquareText className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
            title="Baixar"
            onClick={() => onDownload(creation)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-red-500/40 hover:text-white"
            title="Excluir"
            onClick={() => onDelete(creation)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info below thumbnail */}
      <CardContent className="space-y-1 p-3">
        <p className="truncate text-sm font-medium">
          {creation.templateName ?? "Sem nome"}
        </p>
        <p className="text-xs text-muted-foreground">{date}</p>
        <div>
          {creation.published ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
              Publicado
            </Badge>
          ) : (
            <Badge variant="secondary">Rascunho</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
