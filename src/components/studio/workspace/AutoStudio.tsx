import { useState, useRef, useEffect } from "react";
import { Wand2, Loader2, ArrowLeft, Sparkles, BookOpen, X, Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useBrands } from "@/hooks/use-brands";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import {
  generateContent, generateOpenAiImage, searchStockImages, aiAssist,
  callHiggsfield, hfStatus, type HfGenerationResult,
} from "@/lib/api";
import { brandImageDirective, brandTextProfile, type BrandProfile } from "@/lib/brand";
import { HF_VIDEO_MODELS } from "@/lib/higgsfield-models";
import { saveVisualToGallery, sanitizeDesignDoc, persistDesignDoc, persistUrls } from "@/lib/gallery";
import { composeSlideWithText, SLIDE_TEMPLATES, preferredCleanArea, type SlideTemplate } from "@/lib/slide-compose";
import { supabase } from "@/integrations/supabase/client";
import { OutputScreen } from "./OutputScreen";
import { emptyDoc } from "./StudioProvider";
import { buildEditableEls } from "./editableEls";
import { renderDocOffscreen } from "./renderDocOffscreen";
import type { StudioDoc, StudioFormat, Slide } from "./types";
import { ensureReadableTextLayers } from "./designReadability";
import { refineDesignAesthetics, STYLE_PRESETS, type StylePreset } from "./designAesthetics";
import { saveStudioFlowDraft, clearStudioFlowDraft, type AutoFormDraft } from "./studioDraft";

const ART_STYLES: { value: string; label: string; hint: string }[] = [
  { value: "auto", label: "Auto (IA escolhe)", hint: "" },
  { value: "editorial", label: "Editorial fotográfico", hint: "fotografia editorial premium, luz natural, profundidade de campo, sensação de revista" },
  { value: "cinematic", label: "Cinematográfico", hint: "iluminação cinematográfica dramática, grão sutil, paleta coesa, sensação de still de filme" },
  { value: "3d", label: "3D render", hint: "render 3D moderno, materiais suaves (clay/glass), iluminação volumétrica, sombras macias" },
  { value: "minimal", label: "Minimalista", hint: "design minimalista, muito espaço negativo, formas geométricas simples, elegante" },
  { value: "poster", label: "Pôster tipográfico", hint: "estética de pôster impresso, composição ousada, alto contraste, texturas de papel" },
  { value: "flat", label: "Flat ilustrado", hint: "ilustração flat vetorial, formas chapadas, contornos limpos, sem gradientes pesados" },
  { value: "watercolor", label: "Aquarela", hint: "ilustração em aquarela, traços orgânicos, papel texturizado, manchas suaves" },
];

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

interface AutoStudioProps {
  onEditInCanvas: (doc: StudioDoc) => void;
  onBack: () => void;
  initialForm?: AutoFormDraft;
  initialDoc?: StudioDoc;
}

export function AutoStudio({ onEditInCanvas, onBack, initialForm, initialDoc }: AutoStudioProps) {
  const { brands, defaultBrand } = useBrands();
  const { user } = useAuth();
  const { activeCompanyId } = useCompany();
  const userId = user?.id;
  const [brandId, setBrandId] = useState<string | null>(initialForm?.brandId ?? null);
  useEffect(() => { if (!brandId && defaultBrand) setBrandId(defaultBrand.id); }, [defaultBrand, brandId]);
  const brand = (brands.find((b) => b.id === brandId) || defaultBrand || null) as BrandProfile | null;

  const [prompt, setPrompt] = useState(initialForm?.prompt ?? "");
  const [artStyle, setArtStyle] = useState<string>(initialForm?.artStyle ?? "auto");
  const [artDirection, setArtDirection] = useState(initialForm?.artDirection ?? "");
  const [imageSource, setImageSource] = useState<"pexels" | "ai">(initialForm?.imageSource ?? "pexels");
  const [layoutMode, setLayoutMode] = useState<string>(initialForm?.layoutMode ?? "auto");
  const [stylePreset, setStylePreset] = useState<StylePreset>(initialForm?.stylePreset ?? "auto");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [doc, setDoc] = useState<StudioDoc | null>(initialDoc ?? null);
  const [renderedUrls, setRenderedUrls] = useState<string[] | null>(null);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(initialForm?.selectedSourceIds ?? []);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Persistência do fluxo (sobrevive a troca de aba/rota) ──
  // Salva o estado do formulário do "Criar com IA" + doc gerado, com debounce.
  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(() => {
      saveStudioFlowDraft(userId, {
        mode: "auto",
        autoForm: { prompt, artStyle, artDirection, imageSource, layoutMode, stylePreset, selectedSourceIds, brandId },
        autoDoc: doc ?? undefined,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [userId, prompt, artStyle, artDirection, imageSource, layoutMode, stylePreset, selectedSourceIds, brandId, doc]);

  const handleBack = () => {
    if (userId) clearStudioFlowDraft(userId);
    onBack();
  };

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("saved_sources")
        .select("id,title,source_type,content")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      setSources(data || []);
    })();
  }, []);

  const selectedSources = sources.filter((s) => selectedSourceIds.includes(s.id));
  const toggleSource = (id: string) =>
    setSelectedSourceIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const c1 = brand?.colors?.[0] || "#8b5cf6";
  const c2 = brand?.colors?.[1] || "#d946ef";
  const grad = `linear-gradient(135deg, ${c1}, ${c2})`;

  // Auto-save na galeria. As `urls` finais são geradas pelo MESMO renderer do
  // editor (renderDocOffscreen), garantindo que abrir o post no Editar mostre
  // exatamente a mesma arte da Galeria — sem duplicar texto e sem mismatch.
  const autoSave = async (mediaOrDoc: StudioDoc): Promise<string[]> => {
    try {
      let urls: string[] = [];
      if (mediaOrDoc.videoUrl) {
        urls = [mediaOrDoc.videoUrl];
      } else {
        const rendered = await renderDocOffscreen(mediaOrDoc, brand);
        urls = rendered.length ? await persistUrls(rendered) : [];
      }
      if (urls.length) await saveVisualToGallery({
        urls,
        prompt: mediaOrDoc.caption || prompt.trim(),
        templateName: "Studio · Automático",
        designDoc: (await persistDesignDoc(mediaOrDoc)) ?? sanitizeDesignDoc(mediaOrDoc),
        caption: mediaOrDoc.caption ?? "",
      });
      return urls;
    } catch (e) { console.warn("[autoSave] falhou", e); return []; }
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

  /** Gera N scene briefs únicos para um carrossel — garante variação visual entre slides. */
  const generateSceneBriefs = async (topic: string, objective: string, headings: string[], styleHint: string): Promise<string[]> => {
    try {
      const { json } = await aiAssist({
        system: `Você é diretor de arte. Crie um JSON {"scenes":[...]} com EXATAMENTE ${headings.length} cenas visuais distintas para um carrossel coeso de redes sociais. Cada cena = uma string curta (1-2 frases) descrevendo: sujeito/cenário CONCRETO, ângulo da câmera, atmosfera/luz. Mantenha a mesma paleta e o mesmo estilo, mas varie radicalmente o sujeito/ângulo entre slides — NUNCA repita o mesmo cenário. Sem texto, sem palavras, sem logos. Responda APENAS o JSON.`,
        prompt: `Tema: ${topic}\nObjetivo: ${objective}\nEstilo geral: ${styleHint || "livre, alinhado à marca"}\n\nTítulos dos slides (para guiar o sujeito de cada cena):\n${headings.map((h, i) => `${i + 1}. ${h}`).join("\n")}`,
        expectJson: true, temperature: 0.9,
      });
      const arr = (json as { scenes?: string[] })?.scenes;
      if (Array.isArray(arr) && arr.length) return headings.map((_, i) => arr[i] || arr[arr.length - 1]);
    } catch { /* fallback */ }
    return headings.map((h) => `Cena visual representando: ${h}`);
  };

  const slideArt = async (
    topic: string, objective: string, heading: string, body: string,
    idx: number, total: number, sceneBrief: string, styleHint: string, direction: string,
    template: SlideTemplate,
  ): Promise<{ cleanBg?: string; composed?: string }> => {
    // Pedimos APENAS o cenário visual — NUNCA texto/letras/logos. Os modelos de
    // imagem erram a grafia em pt-BR ("trabaio" no lugar de "trabalho"), então
    // o texto real é desenhado depois via canvas com fonte do navegador.
    const cleanArea = preferredCleanArea(template);
    const cleanAreaPt: Record<string, string> = {
      bottom: "a METADE INFERIOR mais limpa e em tom mais escuro",
      top: "a METADE SUPERIOR mais limpa e em tom mais escuro",
      center: "o CENTRO da imagem mais sóbrio (assunto deslocado para as bordas)",
      left: "o LADO ESQUERDO mais limpo e neutro (assunto deslocado para a direita)",
      right: "o LADO DIREITO mais limpo e neutro (assunto deslocado para a esquerda)",
    };
    const artPrompt = [
      brandImageDirective(brand),
      styleHint ? `Estilo visual GLOBAL deste post: ${styleHint}.` : "",
      direction ? `Direção de arte adicional: ${direction}.` : "",
      `Arte vertical (1024x1536) de fundo para post sobre "${topic}" (objetivo: ${objective}).`,
      `CENA ESPECÍFICA deste slide (${idx + 1}/${total}) — siga à risca, não invente outra: ${sceneBrief}`,
      `Composição editorial profissional, profundidade e atmosfera. Deixe ${cleanAreaPt[cleanArea]} (será sobreposto por texto editável).`,
      `IMPORTANTE: NÃO pinte nenhum gradiente, degradê, vinheta ou transição de cor artificial na imagem — isso fica feio e datado. O contraste para o texto vem só de uma sombra de texto aplicada depois, então a foto deve permanecer uma foto real e limpa, sem nenhum efeito de gradiente, faixa, tarja, retângulo sólido ou caixa escura.`,
      `ABSOLUTAMENTE PROIBIDO: qualquer texto, tipografia, caracteres, palavras, números ou logotipos renderizados na imagem.`,
    ].filter(Boolean).join("\n\n");

    const { images } = await generateOpenAiImage({ prompt: artPrompt, size: "1024x1536", quality: "high", n: 1 });
    const bg = images?.[0];
    if (!bg) return {};

    try {
      const composed = await composeSlideWithText({
        bgUrl: bg,
        heading,
        body,
        brandColor: brand?.colors?.[0] || "#f59e0b",
        brandHandle: brand?.handle,
        index: idx,
        total,
        template,
      });
      return { cleanBg: bg, composed };
    } catch {
      return { cleanBg: bg, composed: bg };
    }
  };

  /** Escolhe 2-4 palavras-chave em pt-BR para buscar uma foto real no Pexels. */
  const pickStockQuery = async (topic: string, heading: string, sceneBrief: string): Promise<string> => {
    try {
      const { json } = await aiAssist({
        system: `Você ajuda a buscar fotos de banco de imagens (Pexels). Devolva um JSON {"query":"..."} com 2 a 4 palavras-chave em PORTUGUÊS BRASILEIRO, concretas e visuais (sujeito + cenário/atmosfera), que retornem fotos reais e profissionais relacionadas ao tema. Sem aspas, sem pontuação, sem hashtags. Responda APENAS o JSON.`,
        prompt: `Tema: ${topic}\nTítulo do slide: ${heading}\nCena pretendida: ${sceneBrief}`,
        expectJson: true, temperature: 0.5,
      });
      const q = (json as { query?: string })?.query?.trim();
      if (q) return q;
    } catch { /* fallback */ }
    return (heading || topic).trim();
  };

  /** Mesma assinatura de slideArt, mas usa foto real do Pexels como fundo. */
  const slideStockPhoto = async (
    topic: string, objective: string, heading: string, body: string,
    idx: number, total: number, sceneBrief: string, _styleHint: string, _direction: string,
    template: SlideTemplate,
  ): Promise<{ cleanBg?: string; composed?: string }> => {
    let bg: string | undefined;
    try {
      const query = await pickStockQuery(topic, heading, sceneBrief);
      if (!activeCompanyId) { toast.error("Selecione uma empresa."); return {}; }
      let { images } = await searchStockImages({ companyId: activeCompanyId, query, count: 5, orientation: "portrait" });
      if (!images?.length) {
        const fb = await searchStockImages({ companyId: activeCompanyId, query: "profissional negócios trabalho", count: 5, orientation: "portrait" });
        images = fb.images;
      }
      if (images?.length) bg = images[idx % images.length].url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao buscar foto no Pexels");
      return {};
    }
    if (!bg) return {};

    try {
      const composed = await composeSlideWithText({
        bgUrl: bg,
        heading,
        body,
        brandColor: brand?.colors?.[0] || "#f59e0b",
        brandHandle: brand?.handle,
        index: idx,
        total,
        template,
      });
      return { cleanBg: bg, composed };
    } catch {
      return { cleanBg: bg, composed: bg };
    }
  };


  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Descreva o que você quer criar."); return; }
    setGenerating(true); setProgress("Interpretando seu pedido…"); setDoc(null);
    try {
      const sourcesCtx = buildSourcesContext(selectedSources);
      const briefInput = prompt.trim() + sourcesCtx;
      const brief = await parseBrief(briefInput);
      const base = emptyDoc(brief.format, brandId);

      if (brief.format === "video") {
        setProgress("Gerando vídeo (Higgsfield)…");
        const model = HF_VIDEO_MODELS[0].id;
        const vp = [brandImageDirective(brand), `${brief.topic}. ${brief.objective}.`, sourcesCtx].filter(Boolean).join("\n\n");
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
        prompt: `${brief.topic}. Objetivo: ${brief.objective}.${brief.format === "carousel" ? ` Gere um carrossel de ${brief.count} slides.` : ""}${sourcesCtx}`,
        platforms: brief.platforms,
        tone: brand?.tone,
        language: "português brasileiro",
        brandProfile: brandTextProfile(brand),
      });
      const plat = brief.platforms[0];
      const caption = res.posts?.[plat] || Object.values(res.posts || {})[0] || brief.topic;

      const styleHint = ART_STYLES.find((s) => s.value === artStyle)?.hint || "";
      const direction = artDirection.trim();

      // Rotação editorial entre 4 templates leves; capa sempre "bottom".
      const rotation: SlideTemplate[] = ["top", "center-card", "kicker", "bottom"];
      const offset = Math.floor(Math.random() * rotation.length);
      const pickTemplate = (i: number): SlideTemplate => {
        if (layoutMode !== "auto" && (SLIDE_TEMPLATES as string[]).includes(layoutMode)) return layoutMode as SlideTemplate;
        if (i === 0) return "bottom";
        return rotation[(i + offset) % rotation.length];
      };

      let slides: Slide[];
      const composedUrls: string[] = [];
      if (brief.format === "carousel") {
        const specs = (res.carousel?.slides || []).slice(0, brief.count);
        if (!specs.length) throw new Error("A IA não retornou slides.");
        setProgress("Definindo a direção visual…");
        const scenes = await generateSceneBriefs(brief.topic, brief.objective, specs.map((s) => s.heading), styleHint);
        slides = [];
        for (let i = 0; i < specs.length; i++) {
          setProgress(`Gerando arte do slide ${i + 1}/${specs.length}…`);
          const fn = imageSource === "ai" ? slideArt : slideStockPhoto;
          const tpl = pickTemplate(i);
          const { cleanBg, composed } = await fn(brief.topic, brief.objective, specs[i].heading, specs[i].body, i, specs.length, scenes[i], styleHint, direction, tpl);
          // Persiste o fundo limpo (sobe data: URLs pro storage) pra ele sobreviver no design_doc.
          const [persistedClean] = cleanBg ? await persistUrls([cleanBg]) : [];
          slides.push({
            bg: grad,
            bgImage: persistedClean || composed,
            els: buildEditableEls({
              heading: specs[i].heading,
              body: specs[i].body,
              brandHandle: brand?.handle,
              brandColor: brand?.colors?.[0],
              index: i,
              total: specs.length,
              template: tpl,
            }),
          });
          if (composed) composedUrls.push(composed);
        }
      } else {
        setProgress("Gerando a arte…");
        // headline curto pra estampar na imagem
        const { text: headline } = await aiAssist({
          system: `Escreva uma frase curta e impactante (máx 8 palavras) em pt-BR para estampar numa arte sobre o tema, na voz da marca. Responda só a frase.`,
          prompt: `${brief.topic} (${brief.objective})${sourcesCtx}`, temperature: 0.8,
        });
        const head = (headline || brief.topic).trim();
        const [scene] = await generateSceneBriefs(brief.topic, brief.objective, [head], styleHint);
        const soloTemplate: SlideTemplate = layoutMode !== "auto" && (SLIDE_TEMPLATES as string[]).includes(layoutMode)
          ? (layoutMode as SlideTemplate)
          : "bottom";
        const fn = imageSource === "ai" ? slideArt : slideStockPhoto;
        const { cleanBg, composed } = await fn(brief.topic, brief.objective, head, "", 0, 1, scene, styleHint, direction, soloTemplate);
        const [persistedClean] = cleanBg ? await persistUrls([cleanBg]) : [];
        slides = [{
          bg: grad,
          bgImage: persistedClean || composed,
          els: buildEditableEls({
            heading: head,
            brandHandle: brand?.handle,
            brandColor: brand?.colors?.[0],
            index: 0,
            total: 1,
            template: soloTemplate,
          }),
        }];
        if (composed) composedUrls.push(composed);
      }


      const rawDoc: StudioDoc = {
        ...base,
        slides,
        caption,
        captionsByPlatform: res.posts,
        hashtags: res.hashtags || [],
        platforms: brief.platforms as StudioDoc["platforms"],
      };
      // Garante contraste/legibilidade respeitando paleta da marca
      const readableDoc = ensureReadableTextLayers(rawDoc, { colors: brand?.colors });
      // Refina estética: arredonda overlays, troca blocos duros por gradientes/acentos
      const finalDoc = refineDesignAesthetics(readableDoc, { colors: brand?.colors }, stylePreset);
      setDoc(finalDoc);
      toast.success("Criação pronta!");
      autoSave(finalDoc).then((urls) => { if (urls.length) setRenderedUrls(urls); });
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
      renderedUrls={renderedUrls ?? undefined}
      onRestart={() => { setDoc(null); setPrompt(""); setRenderedUrls(null); if (userId) clearStudioFlowDraft(userId); }}
      onEditInCanvas={onEditInCanvas}
    />
  ) : (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleBack}><ArrowLeft className="mr-1.5 h-4 w-4" /> Modos</Button>
        <h1 className="flex items-center gap-2 text-xl font-bold"><Wand2 className="h-5 w-5 text-violet-500" /> Criar com IA</h1>
        {(prompt || initialForm) && userId && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs text-muted-foreground hover:text-destructive"
            disabled={generating}
            onClick={() => {
              clearStudioFlowDraft(userId);
              setPrompt(""); setArtStyle("auto"); setArtDirection(""); setImageSource("pexels");
              setLayoutMode("auto"); setStylePreset("auto"); setSelectedSourceIds([]); setDoc(null);
              toast.message("Rascunho descartado.");
            }}
          >
            Descartar rascunho
          </Button>
        )}
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

        <div className="rounded-lg border border-border bg-card/40 p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4 text-violet-500" />
            Direção visual
            <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Estilo</label>
              <Select value={artStyle} onValueChange={setArtStyle} disabled={generating}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ART_STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Direção livre</label>
              <Input
                value={artDirection}
                onChange={(e) => setArtDirection(e.target.value)}
                placeholder="Ex: tons terrosos, luz de janela, grão"
                className="h-9 text-sm"
                disabled={generating}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Origem da imagem</label>
            <Select value={imageSource} onValueChange={(v) => setImageSource(v as "pexels" | "ai")} disabled={generating}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pexels">Foto real (Pexels) — recomendado</SelectItem>
                <SelectItem value="ai">Arte gerada por IA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Layout do texto</label>
            <Select value={layoutMode} onValueChange={setLayoutMode} disabled={generating}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Variado (rotaciona entre slides)</SelectItem>
                <SelectItem value="bottom">Sempre no rodapé</SelectItem>
                <SelectItem value="top">Sempre no topo</SelectItem>
                <SelectItem value="center-card">Sempre cartão central</SelectItem>
                <SelectItem value="side-bar">Sempre barra lateral</SelectItem>
                <SelectItem value="kicker">Sempre com etiqueta</SelectItem>
                <SelectItem value="quote">Sempre citação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Estilo visual</label>
            <Select value={stylePreset} onValueChange={(v) => setStylePreset(v as StylePreset)} disabled={generating}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLE_PRESETS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {STYLE_PRESETS.find((s) => s.value === stylePreset)?.hint}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">Em "Variado", cada slide do carrossel ganha uma composição diferente — não saem todos iguais.</p>
        </div>


        <div className="rounded-lg border border-border bg-card/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 text-violet-500" />
              Fontes de referência
              {selectedSources.length > 0 && (
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-600">
                  {selectedSources.length}
                </span>
              )}
            </div>
            <Popover open={sourcesOpen} onOpenChange={setSourcesOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" disabled={generating} className="h-7 text-xs">
                  + Usar fonte
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                {sources.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Você ainda não salvou nenhuma fonte. Vá em <span className="font-medium text-foreground">Fontes</span> para adicionar.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto py-1">
                    {sources.map((s) => {
                      const checked = selectedSourceIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSource(s.id)}
                          className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent"
                        >
                          <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-violet-500 bg-violet-500 text-white" : "border-border"}`}>
                            {checked && <Check className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">{s.title || "Sem título"}</div>
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.source_type}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          {selectedSources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedSources.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-1 text-[11px] text-violet-700 dark:text-violet-300">
                  {s.title || s.source_type}
                  <button onClick={() => toggleSource(s.id)} disabled={generating} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500" size="lg" onClick={handleGenerate} disabled={generating || !prompt.trim()}>
          {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {progress || "Gerando…"}</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar tudo com IA</>}
        </Button>
        {brand?.name && <p className="text-center text-xs text-muted-foreground">A IA usa a marca <span className="font-medium text-violet-600">{brand.name}</span> como base (paleta, tom, voz).</p>}
      </div>
    </div>
  );
}
