import { useState } from "react";
import { Loader2, Wand2, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { aiAssist } from "@/lib/api";
import { useBrands } from "@/hooks/use-brands";
import { brandTextHint } from "@/lib/brand";
import { useStudio } from "./StudioProvider";

/**
 * Painel discreto de Legenda no Studio.
 * - textarea editável (sync com doc.caption);
 * - botão "Melhorar legenda" usando aiAssist (IA reescreve com regras anti-repetição).
 * Nada de salvar/postar aqui — apenas edição do texto da legenda do post.
 */
export function CaptionPanel() {
  const { doc, set } = useStudio();
  const { brands } = useBrands();
  const brand = brands.find((b) => b.id === doc.brandId) || null;

  const [improving, setImproving] = useState(false);

  const handleImprove = async () => {
    const current = (doc.caption || "").trim();
    setImproving(true);
    try {
      const topic = current || (doc.slides?.[0]?.els?.find((e) => e.type === "text")?.text ?? "") || "post";
      const { text } = await aiAssist({
        system: [
          "Você é redator sênior de redes sociais em português brasileiro.",
          "Reescreva a legenda mantendo o tema, mas com clareza, naturalidade e variedade.",
          "REGRAS OBRIGATÓRIAS:",
          "- NÃO comece com 'Você sabia?', 'Fique atento!', 'Salve este post' ou 'Procure um advogado'.",
          "- Varie a abertura — use contexto, observação ou pergunta natural.",
          "- Linguagem profissional, informativa e responsável. Sem sensacionalismo.",
          "- Sem promessa de resultado nem chamada comercial agressiva.",
          "- No máximo 2 emojis pontuais (ou nenhum). Sem excesso.",
          "- No máximo 5 hashtags relevantes ao final (ou nenhuma).",
          "- Para tema jurídico: NÃO prometa direito/ganho, NÃO induza contratação, mantenha tom educativo.",
          "Estrutura recomendada: abertura contextual → explicação curta → ponto prático → chamada leve para refletir/salvar/compartilhar.",
          brandTextHint(brand),
          "Responda APENAS com a legenda final, sem aspas e sem comentários.",
        ].filter(Boolean).join("\n"),
        prompt: current
          ? `Tema do post: ${topic}\n\nLegenda atual (reescreva mantendo o sentido):\n${current}`
          : `Tema do post: ${topic}\n\n(Não há legenda — escreva uma do zero seguindo as regras.)`,
        temperature: 0.85,
      });
      if (text) {
        set({ caption: text.trim() });
        toast.success("Legenda melhorada");
      } else {
        toast.error("A IA não retornou texto.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao melhorar legenda");
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3">
      <Label className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <MessageSquareText className="h-3.5 w-3.5 text-violet-500" />
          Legenda
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-violet-600 text-[11px]"
          onClick={handleImprove}
          disabled={improving}
          title="Melhorar legenda com IA"
        >
          {improving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
          Melhorar
        </Button>
      </Label>
      <Textarea
        value={doc.caption || ""}
        onChange={(e) => set({ caption: e.target.value })}
        rows={5}
        placeholder="Escreva a legenda do post… (ou gere com IA)"
        className="resize-none text-sm"
      />
      <p className="text-[10px] text-muted-foreground">
        Salva junto do design ao clicar em <span className="font-medium">Salvar</span>. Usada na publicação/agendamento.
      </p>
    </div>
  );
}
