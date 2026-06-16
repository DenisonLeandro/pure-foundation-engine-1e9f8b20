import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Undo2, Redo2, Send, Building2, PenSquare, LayoutGrid, Film, Image as ImageIcon,
  PanelLeft, Quote, ArrowLeft, Save, Loader2, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useBrands } from "@/hooks/use-brands";
import { updateCreation, sanitizeDesignDoc, persistDesignDoc, saveVisualToGallery, getGalleryActiveCompany } from "@/lib/gallery";
import { StudioProvider, useStudio } from "./StudioProvider";
import { DesignCanvas } from "./DesignCanvas";
import { ElementInspector } from "./ElementInspector";
import { Copilot } from "./Copilot";
import { AssetsRail } from "./AssetsRail";
import { CaptionPanel } from "./CaptionPanel";
import { FlowBar } from "./FlowBar";
import { PublishDrawer } from "./PublishDrawer";
import type { StudioDoc, StudioFormat } from "./types";
import { ensureDocHasVisualFallbacks } from "@/pages/Studio";
import { ensureReadableTextLayers } from "./designReadability";
import { refineDesignAesthetics, STYLE_PRESETS, type StylePreset } from "./designAesthetics";
import { saveStudioDraft, clearStudioDrafts, type StudioDraftInput } from "./studioDraft";

const FORMATS: { value: StudioFormat; label: string; icon: typeof PenSquare }[] = [
  { value: "post", label: "Post", icon: PenSquare },
  { value: "card", label: "Card (estilo X)", icon: Quote },
  { value: "carousel", label: "Carrossel", icon: LayoutGrid },
  { value: "image", label: "Imagem", icon: ImageIcon },
  { value: "video", label: "Vídeo", icon: Film },
];

interface WorkspaceProps {
  initial?: StudioDoc;
  onBack?: () => void;
  editingCreationId?: string;
  fallbackImageUrl?: string;
  fallbackImageUrls?: string[];
  /** Habilita autosave local do rascunho (chave por usuário/marca). */
  draftUserId?: string;
  /** Slide restaurado do rascunho local. */
  initialSlide?: number;
  /** Estilo visual restaurado do rascunho local. */
  initialStylePreset?: StylePreset;
  /** Chamado após descartar o rascunho (Studio reseta para a entrada). */
  onDraftDiscarded?: () => void;
  /** Rota para a qual o "Salvar e voltar" / "Voltar para Galeria" navega. */
  returnTo?: string;
}

export function StudioWorkspace({ initial, ...rest }: WorkspaceProps) {
  return (
    <StudioProvider initial={initial}>
      <WorkspaceInner {...rest} />
    </StudioProvider>
  );
}

function FormatPicker() {
  const { doc, setFormat } = useStudio();
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Formato</p>
      <div className="grid gap-1.5">
        {FORMATS.map((f) => {
          const on = doc.format === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                on ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300" : "border-border hover:bg-accent"
              }`}
            >
              <f.icon className="h-4 w-4" /> {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LeftRailContent({ brandName, brandHandle }: { brandName?: string; brandHandle?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <FormatPicker />
      <div className="rounded-lg border border-border p-3">
        <p className="text-xs text-muted-foreground">Marca-base</p>
        <p className="truncate text-sm font-medium">{brandName || "Sem marca"}</p>
        {brandHandle && <p className="truncate text-xs text-muted-foreground">{brandHandle}</p>}
      </div>
      <AssetsRail />
    </div>
  );
}

function RightRailContent() {
  return (
    <div className="flex flex-col gap-3">
      <CaptionPanel />
      <Copilot />
      <ElementInspector />
    </div>
  );
}

function WorkspaceInner({
  onBack, editingCreationId, fallbackImageUrl, fallbackImageUrls,
  draftUserId, initialSlide, initialStylePreset, onDraftDiscarded, returnTo,
}: Omit<WorkspaceProps, "initial">) {
  const navigate = useNavigate();
  const { brands, defaultBrand } = useBrands();
  const { doc, set, replaceDoc, undo, redo, canUndo, canRedo, exportSlides, currentSlide, setCurrentSlide } = useStudio();
  const [publishOpen, setPublishOpen] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);
  const [stylePreset, setStylePreset] = useState<StylePreset>(initialStylePreset ?? "auto");
  // creationId pode nascer aqui (após "Salvar na Galeria" de um design novo)
  const [creationId, setCreationId] = useState<string | undefined>(editingCreationId);
  useEffect(() => { setCreationId(editingCreationId); }, [editingCreationId]);

  const currentBrand = brands.find((b) => b.id === doc.brandId) || null;
  const brandPalette = { colors: currentBrand?.colors };
  const galleryReturn = returnTo || "/gallery";

  // ── Dirty tracking (alterações não salvas) ──────────────────────
  const dirtyRef = useRef(false);
  const skipFirstDirtyRef = useRef(true);
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (skipFirstDirtyRef.current) { skipFirstDirtyRef.current = false; return; }
    dirtyRef.current = true;
    forceTick((n) => n + 1);
  }, [doc, currentSlide, stylePreset]);
  const markClean = () => { dirtyRef.current = false; forceTick((n) => n + 1); };

  // ── Rascunho local (autosave) ──────────────────────────────────
  const discardedRef = useRef(false);
  const draftPayloadRef = useRef<StudioDraftInput | null>(null);

  // Restaura o slide ativo do rascunho — uma única vez, na montagem.
  const slideRestoredRef = useRef(false);
  useEffect(() => {
    if (slideRestoredRef.current) return;
    slideRestoredRef.current = true;
    if (typeof initialSlide === "number" && initialSlide > 0 && initialSlide < doc.slides.length) {
      setCurrentSlide(initialSlide);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave com debounce (700ms) sempre que doc/slide/estilo mudarem.
  useEffect(() => {
    if (!draftUserId || discardedRef.current) return;
    const fallbacks = (fallbackImageUrls && fallbackImageUrls.length)
      ? fallbackImageUrls
      : (fallbackImageUrl ? [fallbackImageUrl] : []);
    draftPayloadRef.current = { doc, currentSlide, stylePreset, creationId, fallbackImageUrls: fallbacks };
    const t = setTimeout(() => {
      if (!discardedRef.current && draftPayloadRef.current) saveStudioDraft(draftUserId, draftPayloadRef.current);
    }, 700);
    return () => clearTimeout(t);
  }, [doc, currentSlide, stylePreset, draftUserId, creationId, fallbackImageUrl, fallbackImageUrls]);

  // Flush no desmonte (troca de rota/aba interna) — garante que edições <700ms não se percam.
  useEffect(() => {
    return () => {
      if (draftUserId && !discardedRef.current && draftPayloadRef.current) {
        saveStudioDraft(draftUserId, draftPayloadRef.current);
      }
    };
  }, [draftUserId]);

  const handleDiscardDraft = () => {
    discardedRef.current = true;
    if (draftUserId) clearStudioDrafts(draftUserId);
    toast.success("Rascunho descartado");
    onDraftDiscarded?.();
  };

  const handleFixReadability = () => {
    const readable = ensureReadableTextLayers(doc, brandPalette);
    const refined = refineDesignAesthetics(readable, brandPalette, stylePreset);
    replaceDoc(refined);
    toast.success("Legibilidade ajustada");
  };

  const handleApplyStyle = (preset: StylePreset) => {
    setStylePreset(preset);
    const readable = ensureReadableTextLayers(doc, brandPalette);
    const refined = refineDesignAesthetics(readable, brandPalette, preset);
    replaceDoc(refined);
    toast.success(`Estilo aplicado: ${STYLE_PRESETS.find((s) => s.value === preset)?.label}`);
  };

  /** Exporta as imagens do doc atual sem modificar nada. */
  const composeAndExport = async (): Promise<{ safeDoc: StudioDoc; urls: string[] } | null> => {
    const safeDoc = doc;
    const urls = safeDoc.format === "video"
      ? (safeDoc.videoUrl ? [safeDoc.videoUrl] : [])
      : await exportSlides();
    if (!urls.length) return null;
    return { safeDoc, urls };
  };

  /** Salva alterações em criação existente. */
  const handleSaveDesign = async (): Promise<boolean> => {
    if (!creationId) return false;
    setSavingDesign(true);
    try {
      const out = await composeAndExport();
      if (!out) { toast.error("Nada para salvar"); return false; }
      const fallbackList = (fallbackImageUrls && fallbackImageUrls.length)
        ? fallbackImageUrls
        : (fallbackImageUrl ? [fallbackImageUrl] : []);
      const docToPersist = ensureDocHasVisualFallbacks(out.safeDoc, fallbackList);
      const persistedDoc = (await persistDesignDoc(docToPersist)) ?? sanitizeDesignDoc(docToPersist);
      const updated = await updateCreation(creationId, {
        urls: out.urls,
        thumbnailUrl: out.urls[0],
        designDoc: persistedDoc,
        caption: out.safeDoc.caption ?? "",
      });
      if (!updated) { toast.error("Falha ao salvar alterações"); return false; }
      toast.success("Design atualizado");
      markClean();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      return false;
    } finally {
      setSavingDesign(false);
    }
  };

  /** Cria nova entrada na Galeria a partir do design atual. */
  const handleSaveToGallery = async (): Promise<boolean> => {
    if (creationId) return handleSaveDesign();
    if (!getGalleryActiveCompany()) {
      toast.error("Selecione uma empresa antes de salvar.");
      return false;
    }
    setSavingDesign(true);
    try {
      const out = await composeAndExport();
      if (!out) { toast.error("Nada para salvar"); return false; }
      const created = await saveVisualToGallery({
        urls: out.urls,
        prompt: out.safeDoc.caption || undefined,
        templateName: "Studio",
        designDoc: sanitizeDesignDoc(out.safeDoc),
        caption: out.safeDoc.caption ?? "",
      });
      if (!created?.id) { toast.error("Falha ao salvar na Galeria"); return false; }
      setCreationId(created.id);
      toast.success("Design salvo na Galeria");
      markClean();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      return false;
    } finally {
      setSavingDesign(false);
    }
  };

  const exitToGallery = () => {
    if (draftUserId) { discardedRef.current = true; clearStudioDrafts(draftUserId); }
    navigate(galleryReturn);
  };

  const handleSaveAndExit = async () => {
    const ok = creationId ? await handleSaveDesign() : await handleSaveToGallery();
    if (ok) exitToGallery();
  };

  // Diálogo "alterações não salvas" controlado por estado
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const exitTargetRef = useRef<"gallery" | "back">("gallery");
  const requestExit = (target: "gallery" | "back") => {
    exitTargetRef.current = target;
    if (dirtyRef.current) { setConfirmExitOpen(true); return; }
    doExit(target);
  };
  const doExit = (target: "gallery" | "back") => {
    setConfirmExitOpen(false);
    if (target === "gallery") exitToGallery();
    else onBack?.();
  };

  useEffect(() => {
    if (!doc.brandId && defaultBrand) set({ brandId: defaultBrand.id }, false);
  }, [defaultBrand, doc.brandId, set]);

  const brand = brands.find((b) => b.id === doc.brandId) || null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:h-screen">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => requestExit("back")}
            title={creationId ? "Voltar" : "Trocar modo"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {/* mobile: abrir rail de ferramentas */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden"><PanelLeft className="h-4 w-4" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 overflow-y-auto">
            <SheetHeader><SheetTitle>Ferramentas</SheetTitle></SheetHeader>
            <div className="mt-4"><LeftRailContent brandName={brand?.name} brandHandle={brand?.handle} /></div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-violet-500" /> <span className="hidden sm:inline">Studio</span>
        </div>

        <Select value={doc.brandId ?? "none"} onValueChange={(v) => set({ brandId: v === "none" ? null : v })}>
          <SelectTrigger className="ml-1 h-9 w-[150px] sm:w-[200px]">
            <div className="flex min-w-0 items-center gap-2">
              {brand?.logo_url ? <img src={brand.logo_url} alt="" className="h-5 w-5 rounded object-cover" /> : <Building2 className="h-4 w-4 shrink-0 text-violet-500" />}
              <SelectValue placeholder="Marca" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem marca</SelectItem>
            {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}{b.is_default ? " ★" : ""}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={undo} disabled={!canUndo} title="Desfazer"><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={redo} disabled={!canRedo} title="Refazer"><Redo2 className="h-4 w-4" /></Button>
          {/* mobile: abrir copiloto */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 xl:hidden"><Sparkles className="h-4 w-4 text-violet-500" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
              <SheetHeader><SheetTitle>Copiloto IA</SheetTitle></SheetHeader>
              <div className="mt-4"><RightRailContent /></div>
            </SheetContent>
          </Sheet>
          <Select value={stylePreset} onValueChange={(v) => handleApplyStyle(v as StylePreset)}>
            <SelectTrigger className="hidden h-9 w-[170px] md:flex" title="Estilo visual">
              <SelectValue placeholder="Estilo visual" />
            </SelectTrigger>
            <SelectContent>
              {STYLE_PRESETS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {draftUserId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" title="Descartar rascunho">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Descartar rascunho</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja descartar este rascunho? O design atual será removido e o Studio voltará vazio.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDiscardDraft}>Descartar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            onClick={creationId ? handleSaveDesign : handleSaveToGallery}
            disabled={savingDesign}
            title="Salvar"
          >
            {savingDesign ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            <span className="hidden sm:inline">Salvar</span>
          </Button>
          <Button className="ml-1 bg-gradient-to-r from-violet-600 to-fuchsia-500" onClick={() => setPublishOpen(true)}>
            <Send className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Postar / Agendar</span>
          </Button>
        </div>
      </header>

      {/* Confirmação ao sair com alterações não salvas */}
      <AlertDialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Deseja salvar antes de sair?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="ghost"
              onClick={() => doExit(exitTargetRef.current)}
            >
              Sair sem salvar
            </Button>
            <AlertDialogAction
              onClick={async () => {
                const ok = creationId ? await handleSaveDesign() : await handleSaveToGallery();
                if (ok) doExit(exitTargetRef.current);
                else setConfirmExitOpen(false);
              }}
            >
              Salvar e sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Middle */}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-border p-3 lg:block">
          <LeftRailContent brandName={brand?.name} brandHandle={brand?.handle} />
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden bg-muted/30">
          <DesignCanvas />
        </main>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border p-3 xl:block">
          <RightRailContent />
        </aside>
      </div>

      <FlowBar onPublish={() => setPublishOpen(true)} />
      <PublishDrawer open={publishOpen} onOpenChange={setPublishOpen} />
    </div>
  );
}
