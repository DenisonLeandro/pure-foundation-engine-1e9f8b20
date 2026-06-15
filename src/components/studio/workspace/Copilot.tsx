import { useState, useRef, useEffect } from "react";
import { Sparkles, Wand2, Lightbulb, Loader2, RefreshCw, Scissors, Smile, ImagePlus, Search, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useBrands } from "@/hooks/use-brands";
import { useCompany } from "@/contexts/CompanyContext";
import {
  generateContent, generateOpenAiImage, searchStockImages, aiAssist,
  callHiggsfield, hfStatus, type HfGenerationResult,
} from "@/lib/api";
import { brandImageDirective, brandTextProfile, brandTextHint } from "@/lib/brand";
import { HF_VIDEO_MODELS } from "@/lib/higgsfield-models";
import { saveVisualToGallery } from "@/lib/gallery";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/types";
import { useStudio } from "./StudioProvider";
import { uid, type Slide, type El } from "./types";

const OBJETIVOS = ["Engajamento", "Vendas", "Autoridade", "Educar", "Tráfego"];
const POST_PLATFORMS: Platform[] = ["instagram", "twitter", "linkedin", "facebook", "tiktok", "threads"];

export function Copilot() {
  const { brands } = useBrands();
  const { activeCompanyId } = useCompany();
  const { doc, selectedEl, replaceDoc, patchEl, patchSlide, currentSlide, set, setPlatforms } = useStudio();
  const brand = brands.find((b) => b.id === doc.brandId) || null;
  const c1 = brand?.colors?.[0] || "#8b5cf6";
  const c2 = brand?.colors?.[1] || "#d946ef";
  const accent = brand?.colors?.[2] || "#ffffff";

  const [intent, setIntent] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [enhancing, setEnhancing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [refining, setRefining] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const fullPrompt = () => [intent.trim(), objetivo ? `Objetivo: ${objetivo}.` : "", chosen.length ? `Direções: ${chosen.join("; ")}.` : ""].filter(Boolean).join(" ");

  const handleEnhance = async () => {
    if (!intent.trim()) { toast.error("Escreva uma ideia primeiro."); return; }
    setEnhancing(true);
    try {
      const { text } = await aiAssist({
        system: `Você é estrategista/diretor de arte. Refine e enriqueça a ideia do usuário para gerar conteúdo de rede social ${doc.format}. ${brandTextHint(brand)} Responda APENAS com a ideia final, em português.`,
        prompt: intent.trim(), temperature: 0.7,
      });
      if (text) { setIntent(text); toast.success("Ideia aprimorada"); }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); } finally { setEnhancing(false); }
  };

  const handleSuggest = async () => {
    const topic = intent.trim() || brand?.industry || brand?.name || "";
    if (!topic) { toast.error("Escreva um tema ou selecione uma marca."); return; }
    setSuggesting(true);
    try {
      const { json } = await aiAssist({
        system: `Você é diretor criativo. Sugira 6 direções curtas (3-5 palavras) — ângulo de conteúdo e estilo visual — para ${doc.format} sobre o tema, alinhadas à marca. ${brandTextHint(brand)} Responda APENAS com um array JSON de strings em português.`,
        prompt: topic, expectJson: true, temperature: 0.9,
      });
      const list = Array.isArray(json) ? (json as string[]).filter((x) => typeof x === "string") : [];
      if (list.length) { setSuggestions(list); toast.success("Direções sugeridas"); } else toast.error("A IA não retornou direções.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); } finally { setSuggesting(false); }
  };

  const brandSlide = (els: El[], bgImage?: string): Slide => ({ bg: `linear-gradient(135deg, ${c1}, ${c2})`, bgImage, els });

  // Card estilo X/Twitter: painel branco sobre fundo da marca, avatar + nome + handle + texto.
  const composeCardSlide = (body: string): Slide => {
    const avatar = brand?.profile_photo_url || brand?.logo_url || "";
    const name = brand?.name || "Sua Marca";
    const handle = brand?.handle || (brand?.name ? `@${brand.name.toLowerCase().replace(/\s+/g, "")}` : "@marca");
    const textX = avatar ? 104 : 44;
    const els: El[] = [
      { id: uid(), type: "shape", x: 24, y: 60, w: 352, h: 280, bg: "#ffffff", radius: 24, opacity: 1 },
    ];
    if (avatar) els.push({ id: uid(), type: "image", x: 44, y: 84, w: 48, h: 48, src: avatar, radius: 24 });
    els.push(
      { id: uid(), type: "text", x: textX, y: 86, w: 250, h: 22, text: name, fontSize: 17, color: "#0f1419", weight: 700, align: "left" },
      { id: uid(), type: "text", x: textX, y: 112, w: 250, h: 20, text: handle, fontSize: 14, color: "#536471", weight: 400, align: "left" },
      { id: uid(), type: "text", x: 44, y: 150, w: 312, h: 170, text: body, fontSize: 21, color: "#0f1419", weight: 500, align: "left" },
    );
    return { bg: `linear-gradient(135deg, ${c1}, ${c2})`, els };
  };

  const genImage = async (extra: string): Promise<string | undefined> => {
    const { images } = await generateOpenAiImage({
      prompt: [brandImageDirective(brand), fullPrompt(), extra].filter(Boolean).join("\n\n"),
      size: "1024x1536", quality: "medium", n: 1,
    });
    return images?.[0];
  };

  const pollVideo = (requestId: string, caption: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const st = await hfStatus(requestId);
        if (st.status === "completed" && st.video?.url) {
          clearInterval(pollRef.current!); pollRef.current = null;
          set({ videoUrl: st.video.url, caption });
          setGenerating(false); setProgress("");
          toast.success("Vídeo gerado!");
          if (st.video?.url) saveVisualToGallery({ urls: [st.video.url], prompt: intent.trim(), templateName: "Studio · Copiloto" });
        } else if (st.status === "failed" || st.status === "nsfw") {
          clearInterval(pollRef.current!); pollRef.current = null;
          setGenerating(false); setProgress("");
          toast.error(st.error || "Vídeo falhou.");
        }
      } catch { /* keep polling */ }
    }, 5000);
  };

  const handleGenerate = async () => {
    if (!intent.trim()) { toast.error("Descreva o que você quer criar."); return; }
    setGenerating(true); setProgress("");
    try {
      const topic = fullPrompt();

      if (doc.format === "image") {
        setProgress("Gerando imagem…");
        const img = await genImage("");
        if (!img) { toast.error("Falha ao gerar imagem."); return; }
        replaceDoc({ ...doc, slides: [brandSlide([], img)], caption: intent.trim() });
        toast.success("Imagem gerada");
        if (img) saveVisualToGallery({ urls: [img], prompt: intent.trim(), templateName: "Studio · Copiloto" });
      } else if (doc.format === "card") {
        setProgress("Escrevendo o card…");
        const { text } = await aiAssist({
          system: `Você é redator. Escreva um texto curto e impactante estilo post de X/Twitter (1 a 3 frases) em português brasileiro, na voz da marca, sem hashtags. ${brandTextHint(brand)} Responda APENAS com o texto.`,
          prompt: topic, temperature: 0.85,
        });
        const body = (text || intent.trim()).trim();
        const cardSlide = composeCardSlide(body);
        replaceDoc({ ...doc, slides: [cardSlide], caption: body });
        toast.success("Card gerado");
        // card sem bgImage = fundo gradiente, não tem URL persistente → salva após export
      } else if (doc.format === "post") {
        setProgress("Escrevendo + gerando imagem…");
        const [res, img] = await Promise.all([
          generateContent({ prompt: topic, platforms: doc.platforms, tone: brand?.tone, language: "português brasileiro", brandProfile: brandTextProfile(brand) }),
          genImage(""),
        ]);
        const plat = doc.platforms[0];
        replaceDoc({
          ...doc,
          slides: [brandSlide([], img)],
          caption: res.posts?.[plat] || Object.values(res.posts || {})[0] || intent.trim(),
          captionsByPlatform: res.posts,
          hashtags: res.hashtags || [],
        });
        toast.success("Post gerado");
        if (img) saveVisualToGallery({ urls: [img], prompt: intent.trim(), templateName: "Studio · Copiloto" });
      } else if (doc.format === "carousel") {
        setProgress("Montando carrossel…");
        const res = await generateContent({ prompt: `${topic}. Gere um carrossel de 5 slides.`, platforms: ["instagram"], tone: brand?.tone, language: "português brasileiro", brandProfile: brandTextProfile(brand) });
        const cs = res.carousel?.slides || [];
        if (!cs.length) { toast.error("A IA não retornou slides."); return; }
        const slides: Slide[] = cs.map((s) => brandSlide([
          { id: uid(), type: "text", x: 30, y: 110, w: 340, h: 100, text: s.heading, fontSize: 28, color: accent, weight: 700, align: "left" },
          { id: uid(), type: "text", x: 30, y: 220, w: 340, h: 90, text: s.body, fontSize: 16, color: accent, weight: 400, align: "left" },
        ]));
        replaceDoc({ ...doc, slides, caption: res.posts?.instagram || res.carousel?.title || intent.trim(), hashtags: res.hashtags || [] });
        toast.success("Carrossel gerado");
        const carouselUrls = slides.map((s) => s.bgImage).filter((u): u is string => !!u);
        if (carouselUrls.length) saveVisualToGallery({ urls: carouselUrls, prompt: intent.trim(), templateName: "Studio · Copiloto" });
      } else if (doc.format === "video") {
        if (!brand && !doc.brandId) { /* ok */ }
        setProgress("Gerando vídeo (Higgsfield)…");
        const model = HF_VIDEO_MODELS[0].id;
        const prompt = [brandImageDirective(brand), topic].filter(Boolean).join("\n\n");
        const r = await callHiggsfield("hf_text_to_video_direct", { model, prompt, duration: 5, with_audio: true, audio_language: "pt-BR" }) as HfGenerationResult;
        if (!r?.request_id) throw new Error("Sem request_id.");
        pollVideo(r.request_id, intent.trim());
        return; // mantém generating até o poll terminar
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar");
    } finally {
      if (doc.format !== "video") { setGenerating(false); setProgress(""); }
    }
  };

  // ── refino contextual ──
  const refineText = async (kind: "rewrite" | "shorten" | "emojis") => {
    if (!selectedEl || selectedEl.type !== "text") return;
    const instr = kind === "rewrite" ? "Reescreva mais persuasivo e fluido" : kind === "shorten" ? "Reescreva mais curto e direto" : "Adicione emojis pontuais";
    setRefining(kind);
    try {
      const { text } = await aiAssist({
        system: `Você é redator. ${instr}, mantendo o sentido. ${brandTextHint(brand)} Responda APENAS com o texto final.`,
        prompt: selectedEl.text || "", temperature: 0.7,
      });
      if (text) patchEl(selectedEl.id, { text });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); } finally { setRefining(null); }
  };

  const refineImage = async (source: "ai" | "pexels") => {
    setRefining(source);
    try {
      const q = intent.trim() || selectedEl?.text || brand?.industry || brand?.name || "imagem";
      let url: string | undefined;
      if (source === "ai") {
        const { images } = await generateOpenAiImage({ prompt: [brandImageDirective(brand), q].filter(Boolean).join("\n\n"), size: "1024x1536", quality: "medium", n: 1 });
        url = images?.[0];
      } else {
        if (!activeCompanyId) { toast.error("Selecione uma empresa."); return; }
        const { images } = await searchStockImages({ companyId: activeCompanyId, query: q, count: 1, orientation: "squarish" });
        url = images?.[0]?.url;
      }
      if (!url) { toast.error("Nenhuma imagem."); return; }
      if (selectedEl?.type === "image") patchEl(selectedEl.id, { src: url });
      else patchSlide(currentSlide, { bgImage: url });
      toast.success("Imagem aplicada");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); } finally { setRefining(null); }
  };

  // ── render ──
  return (
    <div className="space-y-4">
      {/* Guia de prompt */}
      <div className="space-y-2 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-3">
        <Label className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium"><Sparkles className="h-3.5 w-3.5 text-violet-500" /> O que você quer criar?</span>
          <Button variant="ghost" size="sm" className="h-6 text-violet-600 text-[11px]" onClick={handleEnhance} disabled={enhancing || !intent.trim()}>
            {enhancing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />} Melhorar
          </Button>
        </Label>
        <Textarea value={intent} onChange={(e) => setIntent(e.target.value)} rows={3} placeholder={`Ex: ${doc.format === "video" ? "vídeo curto de um café sendo servido em câmera lenta" : "5 erros que matam o engajamento no Instagram"}`} />

        <div className="flex flex-wrap gap-1">
          {OBJETIVOS.map((o) => (
            <button key={o} onClick={() => setObjetivo((p) => (p === o ? "" : o))}>
              <Badge variant={objetivo === o ? "default" : "secondary"} className={objetivo === o ? "bg-violet-600 hover:bg-violet-700 cursor-pointer text-[10px]" : "cursor-pointer hover:bg-accent text-[10px]"}>{o}</Badge>
            </button>
          ))}
        </div>

        {doc.format === "post" && (
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Plataformas (texto por rede)</Label>
            <div className="flex flex-wrap gap-1">
              {POST_PLATFORMS.map((p) => {
                const on = doc.platforms.includes(p);
                return (
                  <button key={p} onClick={() => setPlatforms(on ? doc.platforms.filter((x) => x !== p) : [...doc.platforms, p])}>
                    <Badge variant={on ? "default" : "secondary"} className={on ? "bg-violet-600 hover:bg-violet-700 cursor-pointer gap-1 text-[10px]" : "cursor-pointer hover:bg-accent gap-1 text-[10px]"}>
                      {PLATFORMS[p].icon} {PLATFORMS[p].name}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label className="text-[11px] text-muted-foreground">Direções</Label>
          <Button variant="ghost" size="sm" className="h-6 text-violet-600 text-[11px]" onClick={handleSuggest} disabled={suggesting}>
            {suggesting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Lightbulb className="mr-1 h-3 w-3" />} Sugerir
          </Button>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setChosen((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))}>
                <Badge variant={chosen.includes(s) ? "default" : "secondary"} className={chosen.includes(s) ? "bg-violet-600 hover:bg-violet-700 cursor-pointer text-[10px]" : "cursor-pointer hover:bg-accent text-[10px]"}>{s}</Badge>
              </button>
            ))}
          </div>
        )}

        <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500" onClick={handleGenerate} disabled={generating || !intent.trim()}>
          {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {progress || "Gerando…"}</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar {doc.format}</>}
        </Button>
      </div>

      {/* Ações contextuais */}
      {selectedEl?.type === "text" && (
        <div className="space-y-1.5 rounded-lg border border-border p-3">
          <Label className="text-xs">IA neste texto</Label>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => refineText("rewrite")} disabled={!!refining}>{refining === "rewrite" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}Reescrever</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => refineText("shorten")} disabled={!!refining}>{refining === "shorten" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Scissors className="mr-1 h-3 w-3" />}Encurtar</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => refineText("emojis")} disabled={!!refining}>{refining === "emojis" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Smile className="mr-1 h-3 w-3" />}+Emojis</Button>
          </div>
        </div>
      )}

      {(selectedEl?.type === "image" || (!selectedEl && (doc.format === "image" || doc.format === "post" || doc.format === "carousel" || doc.format === "card"))) && (
        <div className="space-y-1.5 rounded-lg border border-border p-3">
          <Label className="text-xs">{selectedEl?.type === "image" ? "Imagem do elemento" : "Imagem de fundo do slide"}</Label>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => refineImage("ai")} disabled={!!refining}>{refining === "ai" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ImagePlus className="mr-1 h-3 w-3" />}Gerar IA</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => refineImage("pexels")} disabled={!!refining}>{refining === "pexels" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Search className="mr-1 h-3 w-3" />}Pexels</Button>
          </div>
        </div>
      )}

      {doc.format === "video" && (
        <p className="flex items-start gap-1.5 rounded-lg border border-border p-3 text-[11px] text-muted-foreground">
          <Film className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Vídeo via Higgsfield (requer credenciais em Configurações). A geração leva alguns minutos.
        </p>
      )}
    </div>
  );
}
