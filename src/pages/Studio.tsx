import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { StudioEntry } from "@/components/studio/workspace/StudioEntry";
import { AutoStudio } from "@/components/studio/workspace/AutoStudio";
import { StudioWorkspace } from "@/components/studio/workspace/StudioWorkspace";
import { emptyDoc } from "@/components/studio/workspace/StudioProvider";
import { getCreation } from "@/lib/gallery";
import { useToast } from "@/hooks/use-toast";
import type { StudioDoc } from "@/components/studio/workspace/types";

interface NavState {
  sourceContent?: string;
  sourceTitle?: string;
  prompt?: string;
  mediaUrls?: string[];
  scheduleAt?: string;
}

function buildInitial(nav: NavState | null): StudioDoc | undefined {
  if (!nav) return undefined;
  const has = nav.sourceContent || nav.prompt || nav.sourceTitle || (nav.mediaUrls?.length ?? 0) > 0;
  if (!has) return undefined;
  const base = emptyDoc("post", null);
  return {
    ...base,
    caption: nav.sourceContent || nav.prompt || "",
    slides: nav.mediaUrls?.length ? [{ bg: base.slides[0].bg, bgImage: nav.mediaUrls[0], els: [] }] : base.slides,
    schedule: nav.scheduleAt ? { when: "schedule", at: nav.scheduleAt } : { when: "now" },
  };
}

export default function Studio() {
  const nav = (useLocation().state as NavState | null) || null;
  const navInitial = useMemo(() => buildInitial(nav), [nav]);
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { toast } = useToast();

  const [mode, setMode] = useState<"entry" | "auto" | "assisted">(
    editId || navInitial ? "assisted" : "entry"
  );
  const [handoffDoc, setHandoffDoc] = useState<StudioDoc | undefined>(undefined);

  // Loaded-from-gallery state
  const [editDoc, setEditDoc] = useState<StudioDoc | undefined>(undefined);
  const [editLegacy, setEditLegacy] = useState(false);
  const [editLoading, setEditLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    setEditLoading(true);
    (async () => {
      const c = await getCreation(editId);
      if (cancelled) return;
      if (!c) {
        toast({ title: "Criação não encontrada", variant: "destructive" });
        setEditLoading(false);
        setMode("entry");
        setSearchParams({}, { replace: true });
        return;
      }
      if (c.doc) {
        setEditDoc(c.doc);
        setEditLegacy(false);
      } else {
        const firstUrl = c.urls[0];
        if (!firstUrl) {
          toast({ title: "Criação não encontrada", variant: "destructive" });
          setEditLoading(false);
          setMode("entry");
          setSearchParams({}, { replace: true });
          return;
        }
        setEditDoc({
          format: "image",
          brandId: null,
          slides: [{ bg: "#0f172a", bgImage: firstUrl, els: [] }],
          caption: c.prompt || "",
          hashtags: [],
          platforms: ["instagram"],
          schedule: { when: "now" },
        });
        setEditLegacy(true);
      }
      setMode("assisted");
      setEditLoading(false);
    })();
    return () => { cancelled = true; };
  }, [editId, toast, setSearchParams]);

  const back = () => { setHandoffDoc(undefined); setMode("entry"); };

  if (editId && editLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center gap-3 px-4 py-10">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm text-muted-foreground">Carregando criação...</p>
      </div>
    );
  }

  if (mode === "entry") {
    return <StudioEntry onPick={setMode} />;
  }

  if (mode === "auto") {
    return (
      <AutoStudio
        onBack={back}
        onEditInCanvas={(d) => { setHandoffDoc(d); setMode("assisted"); }}
      />
    );
  }

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <StudioWorkspace
        initial={handoffDoc ?? editDoc ?? navInitial}
        creationId={editId ?? undefined}
        legacy={editLegacy || undefined}
        onBack={back}
      />
    </div>
  );
}
