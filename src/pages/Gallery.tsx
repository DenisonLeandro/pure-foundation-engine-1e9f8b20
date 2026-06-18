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
  CheckSquare,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MediaPreviewDialog } from "@/components/MediaPreviewDialog";
import { getCreations, getCreation, deleteCreation, updateCreation, type Creation } from "@/lib/gallery";
import { useCompany } from "@/contexts/CompanyContext";

// ─── Filter types ───────────────────────────────────────────────

type FilterType = "all" | "image" | "video" | "carousel";
type ImageMeta = { width: number; height: number };

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "image", label: "Imagens" },
  { value: "video", label: "Vídeos" },
  { value: "carousel", label: "Carroséis" },
];

function readImageMeta(url: string): Promise<ImageMeta | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const done = () => resolve(img.naturalWidth && img.naturalHeight ? { width: img.naturalWidth, height: img.naturalHeight } : null);
    img.onload = done;
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

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

  // Modo seleção múltipla
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const { activeCompanyId } = useCompany();

  useEffect(() => {
    let cancelled = false;
    if (!activeCompanyId) {
      setCreations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getCreations(activeCompanyId).then((data) => {
      if (!cancelled) {
        setCreations(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [activeCompanyId]);

  const loadCreations = useCallback(async () => {
    if (!activeCompanyId) { setCreations([]); return; }
    setLoading(true);
    const data = await getCreations(activeCompanyId);
    setCreations(data);
    setLoading(false);
  }, [activeCompanyId]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteCreation(id);
    loadCreations();
    toast({ title: "Criação removida" });
  }, [toast, loadCreations]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkDeleting(true);
    const results = await Promise.allSettled(ids.map((id) => deleteCreation(id)));
    setBulkDeleting(false);
    setConfirmBulkOpen(false);
    const okIds = ids.filter((_, i) => results[i].status === "fulfilled" && (results[i] as PromiseFulfilledResult<boolean>).value);
    setCreations((prev) => prev.filter((c) => !okIds.includes(c.id)));
    exitSelectMode();
    toast({
      title: okIds.length === ids.length
        ? `${okIds.length} criações removidas`
        : `${okIds.length} de ${ids.length} removidas`,
    });
  }, [selectedIds, toast, exitSelectMode]);


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
    navigate("/studio", {
      state: {
        mediaUrls: creation.urls,
        fromVisual: true,
        caption: creation.caption ?? null,
      },
    });
  }

  async function handleEditDesign(creation: Creation) {
    const slideIndex = 0;

    // design_doc não vem na listagem (payload pesado) — buscar sob demanda.
    let designDoc = creation.designDoc ?? null;
    let fullCreation: Creation | null = null;
    try {
      fullCreation = await getCreation(creation.id);
      designDoc = fullCreation?.designDoc ?? designDoc;
    } catch {
      // segue com fallback abaixo
    }

    const urls = fullCreation?.urls?.length ? fullCreation.urls : (creation.urls ?? []);
    const thumbnailUrl = fullCreation?.thumbnailUrl ?? creation.thumbnailUrl ?? null;
    const selectedUrl = urls[slideIndex] ?? thumbnailUrl ?? null;
    const fallback = selectedUrl ?? urls[0] ?? thumbnailUrl;
    const finalImageUrls = urls.length ? urls : (fallback ? [fallback] : []);
    const finalImageMeta = await Promise.all(finalImageUrls.map(readImageMeta));

    console.info("[gallery:edit]", {
      creationId: creation.id,
      slideIndex,
      selectedUrl,
      hasDesignDoc: !!designDoc,
      "urls.length": urls.length,
      thumbnailUrl,
    });

    if (!designDoc && !fallback) {
      toast({ title: "Sem imagem para editar", variant: "destructive" });
      return;
    }
    if (!designDoc) {
      toast({
        title: "Este post antigo não possui camadas editáveis.",
        description: "Ele será aberto como imagem final.",
      });
    }
    navigate("/studio", {
      state: {
        mode: "edit",
        designDoc,
        creationId: creation.id,
        fallbackImageUrl: fallback,
        fallbackImageUrls: urls,
        finalImageUrls,
        finalImageMeta,
        slideIndex,
        selectedSlideIndex: slideIndex,
        thumbnailUrl,
        title: creation.templateName ?? null,
        prompt: creation.prompt ?? null,
        caption: creation.caption ?? null,
        returnTo: "/gallery",
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

      {/* Filter + selection bar */}
      <div className="flex flex-wrap items-center gap-2">
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

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!selectMode ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectMode(true)}
              disabled={filtered.length === 0}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Selecionar
            </Button>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selecionado{selectedIds.size === 1 ? "" : "s"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const allIds = filtered.map((c) => c.id);
                  const allSelected = allIds.every((id) => selectedIds.has(id));
                  setSelectedIds(allSelected ? new Set() : new Set(allIds));
                }}
              >
                {filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))
                  ? "Limpar seleção"
                  : "Selecionar tudo"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={selectedIds.size === 0 || bulkDeleting}
                onClick={() => setConfirmBulkOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir ({selectedIds.size})
              </Button>
              <Button size="sm" variant="ghost" onClick={exitSelectMode}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </>
          )}
        </div>
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
              selectMode={selectMode}
              selected={selectedIds.has(creation.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Bulk delete confirmation */}
      <AlertDialog open={confirmBulkOpen} onOpenChange={setConfirmBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} criações?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os posts selecionados serão removidos permanentemente da galeria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleBulkDelete(); }}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

function CreationCard({
  creation,
  onView,
  onUseInPost,
  onDownload,
  onDelete,
  onEditDesign,
  onEditCaption,
  selectMode,
  selected,
  onToggleSelect,
}: CreationCardProps) {
  const thumb = creation.thumbnailUrl ?? creation.urls[0] ?? "";
  const date = new Date(creation.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const captionSnippet = (creation.caption || "").trim().split(/\n+/)[0] ?? "";

  return (
    <Card
      className={`group overflow-hidden border-violet-200/40 transition-shadow hover:shadow-lg dark:border-violet-800/30 ${
        selectMode ? "cursor-pointer" : ""
      } ${selected ? "ring-2 ring-violet-500 border-violet-500" : ""}`}
      onClick={selectMode ? () => onToggleSelect(creation.id) : undefined}
    >
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

        {/* Selection checkbox */}
        {selectMode && (
          <div className="absolute right-2 top-2 z-10 rounded-md bg-black/60 p-1.5">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect(creation.id)}
              onClick={(e) => e.stopPropagation()}
              className="border-white data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
            />
          </div>
        )}

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
        {!selectMode && (
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
        {captionSnippet && (
          <p className="line-clamp-2 text-[11px] text-muted-foreground/90 italic">
            {captionSnippet}
          </p>
        )}
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
