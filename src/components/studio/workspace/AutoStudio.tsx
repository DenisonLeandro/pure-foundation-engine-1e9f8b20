import { useState, useRef, useEffect } from "react";
import { Wand2, Loader2, ArrowLeft, Sparkles, BookOpen, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useBrands } from "@/hooks/use-brands";
import {
  generateContent, generateOpenAiImage, aiAssist,
  callHiggsfield, hfStatus, type HfGenerationResult,
} from "@/lib/api";
import { brandImageDirective, brandTextProfile, type BrandProfile } from "@/lib/brand";
import { HF_VIDEO_MODELS } from "@/lib/higgsfield-models";
import { saveVisualToGallery } from "@/lib/gallery";
import { composeSlideWithText } from "@/lib/slide-compose";
import { supabase } from "@/integrations/supabase/client";
import { OutputScreen } from "./OutputScreen";
import { emptyDoc } from "./StudioProvider";
import type { StudioDoc, StudioFormat, Slide } from "./types";

type SourceRow = { id: string; title: string | null; source_type: string; content: string | null };

const MAX_PER_SOURCE = 1500;
const MAX_TOTAL = 6000;

function buildSourcesContext(sources: SourceRow[]): string {
  if (!sources.length) return "";
  const parts = sources.map((s, i) => {
    const body = (s.content || "").trim().slice(0, MAX_PER_SOURCE);
    return `[Fonte ${i + 1} — ${s.title || s.source_type}]\n${body}`;
  });
  let joined = parts.join("\n---\n");
  if (joined.length > MAX_TOTAL) joined = joined.slice(0, MAX_TOTAL) + "…";
  return `\n\nCONTEXTO DE REFERÊNCIA (use como base factual, não copie literalmente):\n${joined}`;
}

const EXAMPLES = [
  "Um carrossel de 6 slides sobre o Natal para engajamento",
  "Um post motivacional de segunda-feira para o Instagram",
  "Um card de citação sobre produtividade",
  "Uma imagem promovendo nosso plano anual com desconto",
];

interface Brief {
  format: StudioFormat;
  count: number;
  topic: string;
  objective: string;
  platforms: string[];
}

export function AutoStudio({ onEditInCanvas, onBack }: { onEditInCanvas: (doc: StudioDoc) => void; onBack: () => void }) {
  const { brands, defaultBrand } = useBrands();
  const [brandId, setBrandId] = useState<string | null>(null);
  useEffect(() => { if (!brandId && defaultBrand) setBrandId(defaultBrand.id); }, [defaultBrand, brandId]);
  const brand = (brands.find((b) => b.id === brandId) || defaultBrand || null) as BrandProfile | null;

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [doc, setDoc] = useState<StudioDoc | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const c1 = brand?.colors?.[0] || "#8b5cf6";
  const c2 = brand?.colors?.[1] || "#d946ef";
  const grad = `linear-gradient(135deg, ${c1}, ${c2})`;

  // Auto-save na galeria. saveVisualToGallery agora faz upload de data: URLs automaticamente.
  const autoSave = async (mediaOrDoc: StudioDoc) => {
    try {
      const urls = mediaOrDoc.videoUrl
        ? [mediaOrDoc.videoUrl]
        : mediaOrDoc.slides.map((s) => s.bgImage).filter(Boolean) as string[];
      if (urls.length) await saveVisualToGallery({ urls, prompt: mediaOrDoc.caption || prompt.trim(), templateName: "Studio · Automático" });
    } catch { /* best-effort */ }
  };

  const parseBrief = async (text: string): Promise<Brief> => {
    try {
      const { json } = await aiAssist({
        system: `Extraia da solicitação um JSON com: format ("post"|"carousel"|"image"|"card"|"video"), count (nº de slides; carrossel use o número pedido ou 5, senão 1), topic (tema curto), objective (objetivo/foco; ex: engajamento, vendas), platforms (array; default ["instagram"]). Responda APENAS o JSON.`,
        prompt: text, expectJson: true, temperature: 0.2,
      });
      const j = (json || {}) as Partial<Brief>;
      const format = (["post", "carousel", "image", "card", "video"].includes(j.format as string) ? j.format : "post") as StudioFormat;
      return {
        format,
        count: Math.min(Math.max(Number(j.count) || (format === "carousel" ? 5 : 1), 1), 10),
        topic: j.topic || text,
        objective: j.objective || "engajamento",
        platforms: Array.isArray(j.platforms) && j.platforms.length ? j.platforms : ["instagram"],
      };
    } catch {
      return { format: "post", count: 1, topic: text, objective: "engajamento", platforms: ["instagram"] };
    }
  };

  const slideArt = async (topic: string, objective: string, heading: string, body: string, idx: number, total: number): Promise<string | undefined> => {
    // Pedimos APENAS o cenário visual — NUNCA texto/letras/logos. Os modelos de
    // imagem erram a grafia em pt-BR ("trabaio" no lugar de "trabalho"), então
    // o texto real é desenhado depois via canvas com fonte do navegador.
    const artPrompt = [
      brandImageDirective(brand),
      `Arte vertical (1024x1536) de fundo para post de redes sociais sobre "${topic}" (objetivo: ${objective}). Cenário, ambientação, iconografia simbólica, composição editorial profissional. Use a paleta da marca, com profundidade e atmosfera.`,
      `Deixe a metade inferior MAIS LIMPA e com tom mais escuro, pois será sobreposta por texto. Nada de letras, palavras, números, logotipos ou marca d'água — apenas elementos visuais.`,
      `ABSOLUTAMENTE PROIBIDO: qualquer texto, tipografia, caracteres, palavras ou números renderizados na imagem.`,
    ].filter(Boolean).join("\n\n");

    const { images } = await generateOpenAiImage({ prompt: artPrompt, size: "1024x1536", quality: "medium", n: 1 });
    const bg = images?.[0];
    if (!bg) return undefined;

    try {
      return await composeSlideWithText({
        bgUrl: bg,
        heading,
        body,
        brandColor: brand?.colors?.[0] || "#f59e0b",
        brandHandle: brand?.handle,
        index: idx,
        total,
      });
    } catch {
      return bg;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Descreva o que você quer criar."); return; }
    setGenerating(true); setProgress("Interpretando seu pedido…"); setDoc(null);
    try {
      const brief = await parseBrief(prompt.trim());
      const base = emptyDoc(brief.format, brandId);

      if (brief.format === "video") {
        setProgress("Gerando vídeo (Higgsfield)…");
        const model = HF_VIDEO_MODELS[0].id;
        const vp = [brandImageDirective(brand), `${brief.topic}. ${brief.objective}.`].filter(Boolean).join("\n\n");
        const r = await callHiggsfield("hf_text_to_video_direct", { model, prompt: vp, duration: 5, with_audio: true, audio_language: "pt-BR" }) as HfGenerationResult;
        if (!r?.request_id) throw new Error("Sem request_id do vídeo.");
        pollRef.current = setInterval(async () => {
          try {
            const st = await hfStatus(r.request_id);
            if (st.status === "completed" && st.video?.url) {
              clearInterval(pollRef.current!); pollRef.current = null;
              const videoDoc = { ...base, videoUrl: st.video.url, caption: brief.topic, platforms: brief.platforms as StudioDoc["platforms"] };
              setDoc(videoDoc);
              setGenerating(false); setProgress("");
              toast.success("Vídeo gerado!");
              autoSave(videoDoc);
            } else if (st.status === "failed" || st.status === "nsfw") {
              clearInterval(pollRef.current!); pollRef.current = null;
              setGenerating(false); setProgress(""); toast.error(st.error || "Vídeo falhou.");
            }
          } catch { /* keep polling */ }
        }, 5000);
        return;
      }

      // texto (legenda + hashtags + slides se carrossel)
      setProgress("Escrevendo o conteúdo…");
      const res = await generateContent({
        prompt: `${brief.topic}. Objetivo: ${brief.objective}.${brief.format === "carousel" ? ` Gere um carrossel de ${brief.count} slides.` : ""}`,
        platforms: brief.platforms,
        tone: brand?.tone,
        language: "português brasileiro",
        brandProfile: brandTextProfile(brand),
      });
      const plat = brief.platforms[0];
      const caption = res.posts?.[plat] || Object.values(res.posts || {})[0] || brief.topic;

      let slides: Slide[];
      if (brief.format === "carousel") {
        const specs = (res.carousel?.slides || []).slice(0, brief.count);
        if (!specs.length) throw new Error("A IA não retornou slides.");
        slides = [];
        for (let i = 0; i < specs.length; i++) {
          setProgress(`Gerando arte do slide ${i + 1}/${specs.length}…`);
          const img = await slideArt(brief.topic, brief.objective, specs[i].heading, specs[i].body, i, specs.length);
          slides.push({ bg: grad, bgImage: img, els: [] });
        }
      } else {
        setProgress("Gerando a arte…");
        // headline curto pra estampar na imagem
        const { text: headline } = await aiAssist({
          system: `Escreva uma frase curta e impactante (máx 8 palavras) em pt-BR para estampar numa arte sobre o tema, na voz da marca. Responda só a frase.`,
          prompt: `${brief.topic} (${brief.objective})`, temperature: 0.8,
        });
        const img = await slideArt(brief.topic, brief.objective, (headline || brief.topic).trim(), "", 0, 1);
        slides = [{ bg: grad, bgImage: img, els: [] }];
      }

      const finalDoc: StudioDoc = {
        ...base,
        slides,
        caption,
        captionsByPlatform: res.posts,
        hashtags: res.hashtags || [],
        platforms: brief.platforms as StudioDoc["platforms"],
      };
      setDoc(finalDoc);
      toast.success("Criação pronta!");
      autoSave(finalDoc);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar");
    } finally {
      if (!pollRef.current) { setGenerating(false); setProgress(""); }
    }
  };

  return doc ? (
    <OutputScreen
      doc={doc}
      brand={brand}
      onRestart={() => { setDoc(null); setPrompt(""); }}
      onEditInCanvas={onEditInCanvas}
    />
  ) : (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" /> Modos</Button>
        <h1 className="flex items-center gap-2 text-xl font-bold"><Wand2 className="h-5 w-5 text-violet-500" /> Criar com IA</h1>
      </div>

      <div className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Ex: um carrossel de 6 slides sobre o Natal para engajamento"
          className="text-base"
          disabled={generating}
        />
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => setPrompt(ex)} disabled={generating} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent">
              {ex}
            </button>
          ))}
        </div>
        <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500" size="lg" onClick={handleGenerate} disabled={generating || !prompt.trim()}>
          {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {progress || "Gerando…"}</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar tudo com IA</>}
        </Button>
        {brand?.name && <p className="text-center text-xs text-muted-foreground">A IA usa a marca <span className="font-medium text-violet-600">{brand.name}</span> como base (paleta, tom, voz).</p>}
      </div>
    </div>
  );
}
