import { Sparkles, Wand2, Image as ImageIcon, ArrowRight } from "lucide-react";
import { useBrands } from "@/hooks/use-brands";

export function StudioEntry({ onPick }: { onPick: (imageSource: "pexels" | "ai") => void }) {
  const { defaultBrand } = useBrands();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
          <Sparkles className="h-7 w-7 text-violet-500" /> Studio
        </h1>
        <p className="mt-2 text-muted-foreground">Como você quer criar seu post hoje?</p>
        {defaultBrand && (
          <p className="mt-1 text-xs text-muted-foreground">
            Marca-base: <span className="font-medium text-violet-600">{defaultBrand.name}</span>
          </p>
        )}
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        {/* Modo 1 — IA cria a arte completa (em construção; ativa na próxima fase) */}
        <div
          aria-disabled="true"
          className="group relative flex cursor-not-allowed flex-col items-start gap-3 rounded-2xl border border-dashed border-border p-6 text-left opacity-70"
        >
          <span className="absolute right-4 top-4 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Em breve
          </span>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-violet-600">
            <Wand2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">IA cria a arte completa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A IA gera a imagem inteira do post — arte e texto — nas cores da sua marca. Você refina pedindo mudanças numa caixa de texto.
            </p>
          </div>
        </div>

        {/* Modo 2 — Foto real + texto editável */}
        <button
          onClick={() => onPick("pexels")}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-6 text-left transition-all hover:border-violet-500/60 hover:shadow-lg hover:shadow-violet-500/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-md">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Foto real + texto editável</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Usa uma foto real (Pexels) de fundo e a IA escreve o texto por cima — que você edita, move e ajusta livremente no canvas.
            </p>
          </div>
          <span className="mt-auto flex items-center gap-1 text-sm font-medium text-violet-600 group-hover:gap-2 transition-all">
            Começar <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </div>
  );
}
