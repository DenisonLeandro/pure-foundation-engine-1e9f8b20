import { Sparkles, Wand2, PenTool, ArrowRight } from "lucide-react";
import { useBrands } from "@/hooks/use-brands";

export function StudioEntry({ onPick }: { onPick: (mode: "auto" | "assisted") => void }) {
  const { defaultBrand } = useBrands();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
          <Sparkles className="h-7 w-7 text-violet-500" /> Studio
        </h1>
        <p className="mt-2 text-muted-foreground">Como você quer criar hoje?</p>
        {defaultBrand && (
          <p className="mt-1 text-xs text-muted-foreground">
            Marca-base: <span className="font-medium text-violet-600">{defaultBrand.name}</span>
          </p>
        )}
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        {/* Automático */}
        <button
          onClick={() => onPick("auto")}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-6 text-left transition-all hover:border-violet-500/60 hover:shadow-lg hover:shadow-violet-500/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-md">
            <Wand2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Criar com IA</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Descreva o que quer (ex: “um carrossel de 6 slides sobre o Natal para engajamento”) e a IA cria tudo — texto e arte — sozinha.
            </p>
          </div>
          <span className="mt-auto flex items-center gap-1 text-sm font-medium text-violet-600 group-hover:gap-2 transition-all">
            Começar automático <ArrowRight className="h-4 w-4" />
          </span>
        </button>

        {/* Assistido */}
        <button
          onClick={() => onPick("assisted")}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-border p-6 text-left transition-all hover:border-violet-500/60 hover:shadow-lg hover:shadow-violet-500/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-violet-600">
            <PenTool className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Criação assistida</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monte no canvas e personalize cada detalhe — com a IA ajudando a gerar texto, imagens e arte quando você quiser.
            </p>
          </div>
          <span className="mt-auto flex items-center gap-1 text-sm font-medium text-violet-600 group-hover:gap-2 transition-all">
            Abrir o canvas <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </div>
  );
}
