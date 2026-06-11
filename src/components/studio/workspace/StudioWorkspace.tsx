import { useEffect, useState } from "react";
import {
  Sparkles, Undo2, Redo2, Send, Building2, PenSquare, LayoutGrid, Film, Image as ImageIcon,
  PanelLeft, Quote, ArrowLeft, Save, Loader2, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useBrands } from "@/hooks/use-brands";
import { updateCreation, sanitizeDesignDoc } from "@/lib/gallery";
import { StudioProvider, useStudio } from "./StudioProvider";
import { DesignCanvas } from "./DesignCanvas";
import { ElementInspector } from "./ElementInspector";
import { Copilot } from "./Copilot";
import { AssetsRail } from "./AssetsRail";
import { FlowBar } from "./FlowBar";
import { PublishDrawer } from "./PublishDrawer";
import type { StudioDoc, StudioFormat } from "./types";
import { ensureDocHasVisualFallbacks } from "@/pages/Studio";
import { ensureReadableTextLayers } from "./designReadability";
import { refineDesignAesthetics, STYLE_PRESETS, type StylePreset } from "./designAesthetics";

const FORMATS: { value: StudioFormat; label: string; icon: typeof PenSquare }[] = [
  { value: "post", label: "Post", icon: PenSquare },
  { value: "card", label: "Card (estilo X)", icon: Quote },
  { value: "carousel", label: "Carrossel", icon: LayoutGrid },
  { value: "image", label: "Imagem", icon: ImageIcon },
  { value: "video", label: "Vídeo", icon: Film },
];

export function StudioWorkspace({
  initial, onBack, editingCreationId, fallbackImageUrl, fallbackImageUrls,
}: { initial?: StudioDoc; onBack?: () => void; editingCreationId?: string; fallbackImageUrl?: string; fallbackImageUrls?: string[] }) {
  return (
    <StudioProvider initial={initial}>
      <WorkspaceInner
        onBack={onBack}
        editingCreationId={editingCreationId}
        fallbackImageUrl={fallbackImageUrl}
        fallbackImageUrls={fallbackImageUrls}
      />
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
      <Copilot />
      <ElementInspector />
    </div>
  );
}

function WorkspaceInner({ onBack, editingCreationId, fallbackImageUrl, fallbackImageUrls }: { onBack?: () => void; editingCreationId?: string; fallbackImageUrl?: string; fallbackImageUrls?: string[] }) {
  const { brands, defaultBrand } = useBrands();
  const { doc, set, replaceDoc, undo, redo, canUndo, canRedo, exportSlides } = useStudio();
  const [publishOpen, setPublishOpen] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);
  const [stylePreset, setStylePreset] = useState<StylePreset>("auto");

  const currentBrand = brands.find((b) => b.id === doc.brandId) || null;
  const brandPalette = { colors: currentBrand?.colors };

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

  const handleSaveDesign = async () => {
    if (!editingCreationId) return;
    setSavingDesign(true);
    try {
      // Reaplica legibilidade antes de exportar (idempotente; mantém edições manuais consistentes)
      const safeDoc = ensureReadableTextLayers(doc, brandPalette);
      if (safeDoc !== doc) replaceDoc(safeDoc);
      const urls = safeDoc.format === "video"
        ? (safeDoc.videoUrl ? [safeDoc.videoUrl] : [])
        : await exportSlides();
      if (!urls.length) {
        toast.error("Nada para salvar");
        return;
      }
      const fallbackList = (fallbackImageUrls && fallbackImageUrls.length)
        ? fallbackImageUrls
        : (fallbackImageUrl ? [fallbackImageUrl] : []);
      const docToPersist = ensureDocHasVisualFallbacks(safeDoc, fallbackList);
      const updated = await updateCreation(editingCreationId, {
        urls,
        thumbnailUrl: urls[0],
        designDoc: sanitizeDesignDoc(docToPersist),
      });
      if (!updated) {
        toast.error("Falha ao salvar alterações");
        return;
      }
      toast.success("Design atualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingDesign(false);
    }
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
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack} title="Trocar modo"><ArrowLeft className="h-4 w-4" /></Button>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFixReadability}
            title="Corrigir legibilidade dos textos"
            className="hidden h-9 sm:inline-flex"
          >
            <Eye className="mr-2 h-4 w-4" /> Corrigir legibilidade
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFixReadability}
            title="Corrigir legibilidade dos textos"
            className="h-9 w-9 sm:hidden"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {editingCreationId && (
            <Button
              variant="outline"
              onClick={handleSaveDesign}
              disabled={savingDesign}
              title="Salvar alterações nesta criação"
            >
              {savingDesign ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              <span className="hidden sm:inline">Salvar alterações</span>
            </Button>
          )}
          <Button className="ml-1 bg-gradient-to-r from-violet-600 to-fuchsia-500" onClick={() => setPublishOpen(true)}>
            <Send className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Postar / Agendar</span>
          </Button>
        </div>
      </header>

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
