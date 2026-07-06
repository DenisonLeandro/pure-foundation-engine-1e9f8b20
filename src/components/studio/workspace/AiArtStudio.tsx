import { useState, useEffect } from "react";
import { Wand2, Loader2, ArrowLeft, Sparkles, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useBrands } from "@/hooks/use-brands";
import { useCompany } from "@/contexts/CompanyContext";
import { generateOpenAiImage } from "@/lib/api";
import { saveVisualToGallery } from "@/lib/gallery";
import type { BrandProfile } from "@/lib/brand";
import { emptyDoc } from "./StudioProvider";
import { applyBrandLogo } from "./brandLogo";
import { renderDocOffscreen } from "./renderDocOffscreen";
import type { StudioDoc } from "./types";

/**
 * Modo 1 — "IA cria a arte completa".
 *
 * A IA gera a imagem inteira do post (arte + texto embutido). A ÚNICA injeção
 * automática de marca é a paleta de cores da empresa ativa — sem presets de
 * objetivo, sem direções prontas. A logo real é sobreposta por cima (nítida),
 * nunca desenhada pela IA.
 *
 * A edição por caixa de texto (reedição da imagem via /edits) chega na próxima
 * fase; por isso guardamos a arte "limpa" separada da versão com a logo.
 */

/** Monta o prompt do Modo 1: descrição do usuário + só as cores da marca. */
function buildArtPrompt(userText: string, brand: BrandProfile | null): string {
  const colors = (brand?.colors || []).filter(Boolean);
  const colorLine = colors.length
    ? `Paleta da marca (use como base das cores da arte): ${colors.join(", ")}.`
    : "";
  const logoHint = brand?.logo_url
    ? "Deixe o canto superior esquerdo relativamente livre — a logo da marca será sobreposta ali."
    : "";
  return [
    userText.trim(),
    colorLine,
    logoHint,
    "Crie a arte final e completa de um post para redes sociais em formato vertical, com o texto já embutido na imagem em português brasileiro, tipografia legível e bem posicionada, e acabamento profissional. A imagem deve ser final, pronta para publicar (sem espaços reservados).",
  ].filter(Boolean).join("\n\n");
}

/** Sobrepõe a logo real da marca sobre a arte gerada, reusando o renderizador do app. */
async function overlayBrandLogo(artUrl: string, brand: BrandProfile | null, brandId: string | null): Promise<string> {
  if (!brand?.logo_url) return artUrl;
  const base = emptyDoc("image", brandId);
  // Canvas em 2:3 (mesma proporção da imagem 1024x1536) para não cortar a arte/texto.
  const doc: StudioDoc = {
    ...base,
    canvas: { width: 360, height: 540, aspectRatio: 360 / 540, source: "finalImage" },
    slides: [{ bg: "#0b0b0f", bgImage: artUrl, bgFit: "cover", els: [] }],
  };
  const withLogo = applyBrandLogo(doc, brand.logo_url);
  try {
    const [rendered] = await renderDocOffscreen(withLogo, {
      logo_url: brand.logo_url, handle: brand.handle, name: brand.name, colors: brand.colors,
    });
    return rendered || artUrl;
  } catch {
    return artUrl; // se a composição falhar, mostra ao menos a arte gerada
  }
}

export function AiArtStudio({ onBack }: { onBack: () => void }) {
  const { brands, defaultBrand } = useBrands();
  const { activeCompanyId } = useCompany();
  const [brandId, setBrandId] = useState<string | null>(null);
  useEffect(() => { if (!brandId && defaultBrand) setBrandId(defaultBrand.id); }, [defaultBrand, brandId]);
  const brand = (brands.find((b) => b.id === brandId) || defaultBrand || null) as BrandProfile | null;

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null); // arte + logo (exibida e salva)

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Descreva o post que você quer criar."); return; }
    setGenerating(true); setResultUrl(null);
    try {
      const { images } = await generateOpenAiImage({
        prompt: buildArtPrompt(prompt, brand), size: "1024x1536", quality: "high", n: 1,
      });
      const art = images?.[0];
      if (!art) { toast.error("A IA não retornou imagem."); return; }
      const composed = await overlayBrandLogo(art, brand, brandId);
      setResultUrl(composed);
      toast.success("Arte gerada!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar a arte");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!resultUrl) return;
    if (!activeCompanyId) { toast.error("Selecione uma empresa antes de salvar."); return; }
    setSaving(true);
    try {
      const created = await saveVisualToGallery({
        urls: [resultUrl],
        prompt: prompt.trim() || undefined,
        templateName: "Studio · IA completa",
        caption: "",
      });
      if (!created?.id) { toast.error("Falha ao salvar na Galeria."); return; }
      toast.success("Salvo na Galeria!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack} title="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <Wand2 className="h-5 w-5 text-violet-500" /> IA cria a arte completa
        </div>
        <Select value={brandId ?? "none"} onValueChange={(v) => setBrandId(v === "none" ? null : v)}>
          <SelectTrigger className="ml-auto h-9 w-[160px]"><SelectValue placeholder="Marca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem marca</SelectItem>
            {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}{b.is_default ? " ★" : ""}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-4">
        <p className="text-sm text-muted-foreground">
          Descreva o post. A IA cria a imagem inteira — arte e texto — {brand?.colors?.length ? "usando as cores da sua marca" : "com um visual profissional"}
          {brand?.logo_url ? " e com a sua logo aplicada por cima." : "."}
        </p>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Ex: Um post sobre direitos trabalhistas explicando o vale-alimentação, tom sério e confiável."
        />
        <Button
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
        >
          {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando a arte…</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar arte</>}
        </Button>
      </div>

      {resultUrl && (
        <div className="space-y-3">
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-border">
            <img src={resultUrl} alt="Arte gerada pela IA" className="block w-full" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={handleGenerate} disabled={generating}>
              <RefreshCw className="mr-2 h-4 w-4" /> Gerar outra
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar na Galeria
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Em breve: pedir alterações nesta arte por uma caixa de texto.
          </p>
        </div>
      )}
    </div>
  );
}
