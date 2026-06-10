import { useEffect, useState } from "react";
import {
  Sparkles, Undo2, Redo2, Send, Building2, PenSquare, LayoutGrid, Film, Image as ImageIcon,
  PanelLeft, Quote, ArrowLeft, X, Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useBrands } from "@/hooks/use-brands";
import { StudioProvider, useStudio } from "./StudioProvider";
import { DesignCanvas } from "./DesignCanvas";
import { ElementInspector } from "./ElementInspector";
import { Copilot } from "./Copilot";
import { AssetsRail } from "./AssetsRail";
import { FlowBar } from "./FlowBar";
import { PublishDrawer } from "./PublishDrawer";
import { uid, type StudioDoc, type StudioFormat } from "./types";

const FORMATS: { value: StudioFormat; label: string; icon: typeof PenSquare }[] = [
  { value: "post", label: "Post", icon: PenSquare },
  { value: "card", label: "Card (estilo X)", icon: Quote },
  { value: "carousel", label: "Carrossel", icon: LayoutGrid },
  { value: "image", label: "Imagem", icon: ImageIcon },
  { value: "video", label: "Vídeo", icon: Film },
];

export function StudioWorkspace({ initial, creationId, legacy, onBack }: { initial?: StudioDoc; creationId?: string; legacy?: boolean; onBack?: () => void }) {
  return (
    <StudioProvider initial={initial}>
      <WorkspaceInner creationId={creationId} legacy={legacy} onBack={onBack} />
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

function WorkspaceInner({ creationId, legacy, onBack }: { creationId?: string; legacy?: boolean; onBack?: () => void }) {
  const { brands, defaultBrand } = useBrands();
  const { doc, set, undo, redo, canUndo, canRedo, addEl } = useStudio();
  const [publishOpen, setPublishOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const brand = brands.find((b) => b.id === doc.brandId) || null;
  const accent = brand?.colors?.[2] || "#ffffff";

  const addTextElement = () => {
    addEl({
      id: uid(),
      type: "text",
      x: 40,
      y: 180,
      w: 320,
      h: 70,
      text: "Novo texto",
      fontSize: 24,
      color: accent,
      weight: 600,
      align: "left",
    });
  };

  useEffect(() => {
    if (!doc.brandId && defaultBrand) set({ brandId: defaultBrand.id }, false);
  }, [defaultBrand, doc.brandId, set]);

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
          {legacy && !bannerDismissed && (
            <div className="relative mx-auto max-w-2xl px-4 pt-3">
              <div className="flex items-start gap-3 rounded-lg border border-amber-200/60 bg-amber-50/80 p-3 text-sm text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-100">
                <span className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </span>
                <div className="flex-1">
                  <p className="leading-relaxed">
                    Este post foi criado antes da edição avançada — os textos fazem parte da imagem e não podem ser alterados. Você pode adicionar novos textos e elementos por cima, ou recriar o post no Studio.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addTextElement}>
                      <Type className="mr-1 h-3.5 w-3.5" /> Adicionar texto
                    </Button>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setBannerDismissed(true)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          <DesignCanvas />
        </main>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border p-3 xl:block">
          <RightRailContent />
        </aside>
      </div>

      <FlowBar onPublish={() => setPublishOpen(true)} />
      <PublishDrawer open={publishOpen} onOpenChange={setPublishOpen} creationId={creationId} />
    </div>
  );
}
