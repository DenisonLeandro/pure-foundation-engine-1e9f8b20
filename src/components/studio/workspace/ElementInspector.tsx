import { Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStudio } from "./StudioProvider";

export function ElementInspector() {
  const { selectedEl, patchEl, delEl, slide, patchSlide, currentSlide } = useStudio();

  if (!selectedEl) {
    return (
      <div className="space-y-2 rounded-lg border border-border p-3">
        <Label className="text-xs">Fundo do slide</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            defaultValue="#8b5cf6"
            onChange={(e) => patchSlide(currentSlide, { bg: e.target.value, bgImage: undefined })}
            className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
          />
          {slide?.bgImage && (
            <Button variant="outline" size="sm" onClick={() => patchSlide(currentSlide, { bgImage: undefined })}>Limpar fundo</Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">Clique num elemento do canvas para editá-lo, ou arraste para mover.</p>
      </div>
    );
  }

  const e = selectedEl;
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium capitalize">{e.type}</span>
        <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => delEl(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>

      {e.type === "text" && (
        <>
          <Textarea value={e.text} onChange={(ev) => patchEl(e.id, { text: ev.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[11px]">Tamanho</Label><Input type="number" value={e.fontSize} onChange={(ev) => patchEl(e.id, { fontSize: Number(ev.target.value) })} /></div>
            <div><Label className="text-[11px]">Cor</Label><Input type="color" value={e.color} onChange={(ev) => patchEl(e.id, { color: ev.target.value })} className="h-9 p-1" /></div>
          </div>
          <div><Label className="text-[11px]">Fonte</Label><Input value={e.fontFamily ?? ""} onChange={(ev) => patchEl(e.id, { fontFamily: ev.target.value || undefined })} placeholder="Ex: Arial, Inter, serif" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[11px]">Altura linha</Label><Input type="number" step="0.05" value={e.lineHeight ?? 1.15} onChange={(ev) => patchEl(e.id, { lineHeight: Number(ev.target.value) })} /></div>
            <div><Label className="text-[11px]">Espaçamento</Label><Input type="number" value={e.letterSpacing ?? 0} onChange={(ev) => patchEl(e.id, { letterSpacing: Number(ev.target.value) })} /></div>
          </div>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((a) => (
              <Button key={a} variant={e.align === a ? "default" : "outline"} size="icon" className={`h-7 w-7 ${e.align === a ? "bg-violet-600" : ""}`} onClick={() => patchEl(e.id, { align: a })}>
                {a === "left" ? <AlignLeft className="h-3.5 w-3.5" /> : a === "center" ? <AlignCenter className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
              </Button>
            ))}
            <Button variant={e.weight === 700 ? "default" : "outline"} size="sm" className={`h-7 ${e.weight === 700 ? "bg-violet-600" : ""}`} onClick={() => patchEl(e.id, { weight: e.weight === 700 ? 400 : 700 })}>B</Button>
          </div>

          <div>
            <Label className="text-[11px] mb-1.5 block">Sombra de Texto</Label>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-1">
                <Button
                  size="sm"
                  variant={e.shadowPreset === "discrete" ? "default" : "outline"}
                  className={`text-[10px] h-7 ${e.shadowPreset === "discrete" ? "bg-violet-600" : ""}`}
                  onClick={() => patchEl(e.id, { shadow: "0 1px 0 rgba(0,0,0,0.6), 0 0 1px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)", shadowPreset: "discrete" })}
                >
                  Discreto
                </Button>
                <Button
                  size="sm"
                  variant={e.shadowPreset === "medium" ? "default" : "outline"}
                  className={`text-[10px] h-7 ${e.shadowPreset === "medium" ? "bg-violet-600" : ""}`}
                  onClick={() => patchEl(e.id, { shadow: "0 1px 0 rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.35)", shadowPreset: "medium" })}
                >
                  Médio
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  size="sm"
                  variant={e.shadowPreset === "strong" ? "default" : "outline"}
                  className={`text-[10px] h-7 ${e.shadowPreset === "strong" ? "bg-violet-600" : ""}`}
                  onClick={() => patchEl(e.id, { shadow: "0 1px 0 rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.55), 0 10px 28px rgba(0,0,0,0.4)", shadowPreset: "strong" })}
                >
                  Forte
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-7"
                  onClick={() => patchEl(e.id, { shadow: "", shadowPreset: undefined })}
                >
                  Limpar
                </Button>
              </div>
              <Input
                value={e.shadow ?? ""}
                onChange={(ev) => patchEl(e.id, { shadow: ev.target.value || undefined, shadowPreset: "custom" })}
                placeholder="CSS customizado (text-shadow)"
                className="text-[10px] h-8 font-mono"
              />
              <p className="text-[9px] text-muted-foreground">
                Drop-shadow em camadas garante legibilidade em qualquer fundo. Formato: <code>offset-x offset-y blur color</code>
              </p>
            </div>
          </div>
        </>
      )}

      {e.type === "image" && (
        <>
          <Label className="text-[11px]">URL da imagem</Label>
          <Input value={e.src} onChange={(ev) => patchEl(e.id, { src: ev.target.value })} placeholder="https://…" />
          <div><Label className="text-[11px]">Arredondamento</Label><Input type="number" value={e.radius} onChange={(ev) => patchEl(e.id, { radius: Number(ev.target.value) })} /></div>
        </>
      )}

      {e.type === "shape" && (
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[11px]">Cor</Label><Input type="color" value={e.bg} onChange={(ev) => patchEl(e.id, { bg: ev.target.value })} className="h-9 p-1" /></div>
          <div><Label className="text-[11px]">Arredond.</Label><Input type="number" value={e.radius} onChange={(ev) => patchEl(e.id, { radius: Number(ev.target.value) })} /></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-[11px]">X</Label><Input type="number" value={e.x} onChange={(ev) => patchEl(e.id, { x: Number(ev.target.value) })} /></div>
        <div><Label className="text-[11px]">Y</Label><Input type="number" value={e.y} onChange={(ev) => patchEl(e.id, { y: Number(ev.target.value) })} /></div>
        <div><Label className="text-[11px]">Largura</Label><Input type="number" value={e.w} onChange={(ev) => patchEl(e.id, { w: Number(ev.target.value) })} /></div>
        <div><Label className="text-[11px]">Altura</Label><Input type="number" value={e.h} onChange={(ev) => patchEl(e.id, { h: Number(ev.target.value) })} /></div>
        <div><Label className="text-[11px]">Opacidade</Label><Input type="number" min="0" max="1" step="0.05" value={e.opacity ?? 1} onChange={(ev) => patchEl(e.id, { opacity: Number(ev.target.value) })} /></div>
        <div><Label className="text-[11px]">Rotação</Label><Input type="number" value={e.rotation ?? 0} onChange={(ev) => patchEl(e.id, { rotation: Number(ev.target.value) })} /></div>
      </div>
    </div>
  );
}
