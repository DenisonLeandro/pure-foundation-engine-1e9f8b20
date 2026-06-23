import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBrands } from "@/hooks/use-brands";
import { PublishPanel } from "@/components/studio/PublishPanel";
import { saveVisualToGallery, sanitizeDesignDoc, persistDesignDoc } from "@/lib/gallery";
import { useStudio } from "./StudioProvider";

export function PublishDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { doc, exportSlides } = useStudio();
  const { brands } = useBrands();
  const brand = brands.find((b) => b.id === doc.brandId) || null;

  const [media, setMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creationId, setCreationId] = useState<string | undefined>(undefined);
  // Garante que só salvamos uma vez por (sessão do drawer + doc atual).
  const savedSigRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const m = doc.format === "video" ? (doc.videoUrl ? [doc.videoUrl] : []) : await exportSlides();
        if (alive) {
          setMedia(m);
          // saveVisualToGallery agora deduplica por (empresa, prompt): se já existe
          // uma criação com este prompt, ele atualiza em vez de criar uma nova.
          // Mesmo assim evitamos chamadas redundantes guardando uma "assinatura" da sessão.
          const sig = `${doc.brandId || ""}::${doc.caption || ""}::${m.length}`;
          if (m.length && savedSigRef.current !== sig) {
            savedSigRef.current = sig;
            const persisted = (await persistDesignDoc(doc)) ?? sanitizeDesignDoc(doc);
            const saved = await saveVisualToGallery({
              urls: m,
              prompt: doc.caption,
              templateName: "Studio · Canvas",
              designDoc: persisted,
              caption: doc.caption ?? "",
            });
            if (alive && saved?.id) setCreationId(saved.id);
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, doc, exportSlides]);


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Revisar e publicar</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
              <p className="mt-3 text-sm">Preparando a mídia…</p>
            </div>
          ) : (
            <>
              {/* Revisar — preview da mídia */}
              {media.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
                  <div className={media.length > 1 ? "grid grid-cols-3 gap-2" : ""}>
                    {media.map((m, i) =>
                      /\.(mp4|mov|webm)/i.test(m) || m.startsWith("blob:")
                        ? <video key={i} src={m} controls className="block h-full w-full rounded-lg border border-border object-cover" style={{ aspectRatio: "4 / 5" }} />
                        : <img key={i} src={m} alt={`Mídia ${i + 1}`} loading="lazy" className="block h-full w-full rounded-lg border border-border object-cover object-center" style={{ aspectRatio: "4 / 5", background: "#0b0b12" }} />
                    )}
                  </div>
                </div>
              )}

              {/* Postar / Agendar */}
              <PublishPanel
                media={media}
                captionsByPlatform={doc.captionsByPlatform}
                defaultCaption={doc.caption}
                brand={brand}
                captionTopic={doc.caption}
                defaultScheduledAt={doc.schedule.at}
                creationId={creationId}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
