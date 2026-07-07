import { useState, useEffect } from "react";
import { Wand2, Loader2, ArrowLeft, Sparkles, RefreshCw, Save, Undo2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useBrands } from "@/hooks/use-brands";
import { useCompany } from "@/contexts/CompanyContext";
import { generateOpenAiImage, editOpenAiImage } from "@/lib/api";
import { saveVisualToGallery } from "@/lib/gallery";
import type { BrandProfile } from "@/lib/brand";

/**
 * Modo 1 — "IA cria a arte completa".
 *
 * A IA gera a imagem inteira do post (arte + texto embutido). A ÚNICA injeção
 * automática de marca é a paleta de cores da empresa ativa — sem presets de
 * objetivo, sem direções prontas. A logo real é sobreposta por cima (nítida),
 * nunca desenhada pela IA.
 *
 * A edição é conversacional: o usuário descreve a mudança numa caixa de texto e
 * a IA REEDITA a imagem (`/v1/images/edits`). A edição opera sempre sobre a arte
 * "limpa" (sem logo) e a logo real é recolocada por cima a cada versão.
 */

// 4:5 (feed do Instagram). O gpt-image-2 aceita dims custom múltiplas de 16;
// 1024×1280 é 4:5 exato. Antes era 1024×1536 (2:3), mais alto que o feed, o
// que cortava topo/rodapé (logo e chamada) ao publicar.
const IMG_SIZE = "1024x1280" as const;
const IMG_QUALITY = "high" as const;

const QUICK_EDITS = [
  "Deixe o título maior e mais legível",
  "Torne o visual mais minimalista",
  "Troque o fundo mantendo o texto",
  "Deixe as cores mais vibrantes",
];

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

/**
 * Prompt de EDIÇÃO. Precisa ANCORAR o tema original do post — senão a IA, ao
 * repintar a imagem inteira, perde a amarração com o assunto e pode trocar o
 * tema do nada. Carrega também as restrições da geração (paleta e manter o
 * canto superior esquerdo livre p/ a logo).
 */
function buildEditPrompt(instruction: string, brand: BrandProfile | null, originalTopic: string): string {
  const colors = (brand?.colors || []).filter(Boolean);
  const colorLine = colors.length ? `Mantenha a paleta da marca: ${colors.join(", ")}.` : "";
  const logoHint = brand?.logo_url
    ? "Deixe o canto superior esquerdo relativamente livre (sem título, texto nem elementos importantes ali) — a logo da marca fica sobreposta nesse canto."
    : "";
  const topic = originalTopic.trim();
  const topicLine = topic
    ? `IMPORTANTE: esta arte é um post sobre "${topic}". Mantenha EXATAMENTE o mesmo tema, mensagem e textos — não invente outro assunto.`
    : "";
  return [
    topicLine,
    `Alteração pedida: ${instruction.trim()}. Aplique SOMENTE essa mudança e preserve todo o resto da arte.`,
    colorLine,
    logoHint,
    "Mantenha a imagem como um post final e completo para redes sociais, com o texto embutido em português brasileiro e acabamento profissional.",
  ].filter(Boolean).join("\n\n");
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Sobrepõe a logo real da marca sobre a arte, em RESOLUÇÃO NATIVA, via canvas 2D
 * direto (`drawImage`). Evita o html2canvas do renderizador do app, que
 * re-rasterizava a imagem inteira e borrava a arte/texto do gpt-image-2.
 * A arte é desenhada 1:1 (sem reescala) e só a logo é carimbada no canto.
 */
async function composeImageWithLogo(artUrl: string, logoUrl?: string | null): Promise<string> {
  const art = await loadImg(artUrl);
  const w = art.naturalWidth || 1024;
  const h = art.naturalHeight || 1280;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return artUrl;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(art, 0, 0, w, h);
  if (logoUrl) {
    try {
      const logo = await loadImg(logoUrl);
      // Mesmo posicionamento do brandLogo.ts: topo-esquerda, ~11% da largura,
      // logo "contida" na caixa (preserva a proporção).
      const box = Math.max(48, Math.round(w * 0.11));
      const margin = clamp(Math.round(w * 0.04), 14, 48);
      const lw0 = logo.naturalWidth || box;
      const lh0 = logo.naturalHeight || box;
      const scale = Math.min(box / lw0, box / lh0);
      const lw = lw0 * scale;
      const lh = lh0 * scale;
      ctx.drawImage(logo, margin + (box - lw) / 2, margin + (box - lh) / 2, lw, lh);
    } catch { /* logo é opcional — segue só com a arte */ }
  }
  return canvas.toDataURL("image/png");
}

export function AiArtStudio({ onBack }: { onBack: () => void }) {
  const { brands, defaultBrand } = useBrands();
  const { activeCompanyId } = useCompany();
  const [brandId, setBrandId] = useState<string | null>(null);
  useEffect(() => { if (!brandId && defaultBrand) setBrandId(defaultBrand.id); }, [defaultBrand, brandId]);
  const brand = (brands.find((b) => b.id === brandId) || defaultBrand || null) as BrandProfile | null;

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");

  const [art, setArt] = useState<string | null>(null);        // arte limpa (sem logo) — base das edições
  const [resultUrl, setResultUrl] = useState<string | null>(null); // arte + logo (exibida e salva)
  const [past, setPast] = useState<string[]>([]);             // versões limpas anteriores (desfazer)

  const busy = generating || editing;

  /** Aplica a logo sobre a arte limpa e atualiza a imagem exibida. */
  const composeAndShow = async (cleanArt: string) => {
    setArt(cleanArt);
    const composed = await composeImageWithLogo(cleanArt, brand?.logo_url);
    setResultUrl(composed);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Descreva o post que você quer criar."); return; }
    setGenerating(true); setResultUrl(null); setArt(null); setPast([]);
    try {
      const { images } = await generateOpenAiImage({
        prompt: buildArtPrompt(prompt, brand), size: IMG_SIZE, quality: IMG_QUALITY, n: 1,
      });
      const newArt = images?.[0];
      if (!newArt) { toast.error("A IA não retornou imagem."); return; }
      await composeAndShow(newArt);
      toast.success("Arte gerada!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar a arte");
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = async (instruction: string) => {
    const instr = instruction.trim();
    if (!instr) { toast.error("Descreva a mudança que você quer."); return; }
    if (!art) return;
    setEditing(true);
    try {
      const { images } = await editOpenAiImage({
        image: art, prompt: buildEditPrompt(instr, brand, prompt), size: IMG_SIZE, quality: IMG_QUALITY,
      });
      const newArt = images?.[0];
      if (!newArt) { toast.error("A IA não retornou a imagem editada."); return; }
      setPast((p) => [...p, art]);
      await composeAndShow(newArt);
      setEditPrompt("");
      toast.success("Arte atualizada!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao editar a arte");
    } finally {
      setEditing(false);
    }
  };

  const handleUndo = async () => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    await composeAndShow(prev);
    toast.message("Desfeita a última mudança.");
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
          disabled={busy || !prompt.trim()}
        >
          {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando a arte…</> : <><Sparkles className="mr-2 h-4 w-4" /> {resultUrl ? "Gerar do zero" : "Gerar arte"}</>}
        </Button>
      </div>

      {resultUrl && (
        <div className="space-y-4">
          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-border">
            <img src={resultUrl} alt="Arte gerada pela IA" className="block w-full" />
            {editing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
              </div>
            )}
          </div>

          {/* Editor conversacional */}
          <div className="space-y-2 rounded-xl border border-border p-4">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Peça uma mudança nesta arte
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EDITS.map((q) => (
                <button key={q} onClick={() => !busy && handleEdit(q)} disabled={busy}>
                  <Badge variant="secondary" className="cursor-pointer text-[11px] hover:bg-accent">{q}</Badge>
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <Textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={2}
                placeholder="Ex: deixe o fundo mais escuro e destaque a palavra 'direito' em laranja."
                className="flex-1"
              />
              <Button onClick={() => handleEdit(editPrompt)} disabled={busy || !editPrompt.trim()} title="Aplicar mudança">
                {editing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              A IA repinta a imagem a cada pedido (pode variar levemente outras partes). A logo é recolocada por cima automaticamente.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={handleUndo} disabled={busy || !past.length}>
              <Undo2 className="mr-2 h-4 w-4" /> Desfazer
            </Button>
            <Button variant="outline" onClick={handleGenerate} disabled={busy}>
              <RefreshCw className="mr-2 h-4 w-4" /> Gerar outra
            </Button>
            <Button onClick={handleSave} disabled={busy || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar na Galeria
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
