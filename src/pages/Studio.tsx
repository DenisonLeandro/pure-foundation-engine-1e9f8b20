import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { StudioEntry } from "@/components/studio/workspace/StudioEntry";
import { AutoStudio } from "@/components/studio/workspace/AutoStudio";
import { StudioWorkspace } from "@/components/studio/workspace/StudioWorkspace";
import { emptyDoc } from "@/components/studio/workspace/StudioProvider";
import type { StudioDoc } from "@/components/studio/workspace/types";

interface NavState {
  sourceContent?: string;
  sourceTitle?: string;
  prompt?: string;
  mediaUrls?: string[];
  scheduleAt?: string;
  /** Full StudioDoc to rehydrate into the canvas (re-edit from gallery). */
  studioDoc?: StudioDoc;
  /** Id of the existing creation being edited; re-export updates that row. */
  creationId?: string;
  /** True when the doc was synthesized from a legacy gallery item (no saved doc). */
  legacy?: boolean;
}

function buildInitial(nav: NavState | null): StudioDoc | undefined {
  if (!nav) return undefined;
  if (nav.studioDoc) return nav.studioDoc;
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

  // Deep-link com estado abre direto no modo assistido (canvas) pré-preenchido.
  const [mode, setMode] = useState<"entry" | "auto" | "assisted">(navInitial ? "assisted" : "entry");
  const [handoffDoc, setHandoffDoc] = useState<StudioDoc | undefined>(undefined);

  const back = () => { setHandoffDoc(undefined); setMode("entry"); };

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

  // assisted — full-bleed (cancela o padding do AppLayout)
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <StudioWorkspace initial={handoffDoc ?? navInitial} creationId={nav?.creationId} legacy={nav?.legacy} onBack={back} />
    </div>
  );
}
