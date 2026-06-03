/**
 * Catálogo de modelos de vídeo Higgsfield disponíveis no proxy.
 * Define durações suportadas, resoluções, suporte a áudio nativo
 * e qualidade — usado pela UI de Create Visual para montar selects
 * coerentes e por validação opcional.
 */

export type HfModelKind = "text-to-video" | "image-to-video";

export interface HfVideoModel {
  id: string;                  // model_id usado no endpoint POST /{id}
  label: string;               // texto exibido no select
  family: string;              // agrupamento (Veo, Sora, Kling, Seedance, Wan, DoP)
  kind: HfModelKind;
  durations: number[];         // segundos suportados
  resolutions?: string[];      // ex: ["720p","1080p"]; omit = não exibir
  qualities?: string[];        // ex: ["basic","high"]; omit = não exibir
  supportsAudio: boolean;      // mostra toggle "Gerar áudio"
  defaultAudio?: boolean;      // default do toggle (true se suportado)
  description?: string;
}

export const HF_VIDEO_MODELS: HfVideoModel[] = [
  {
    id: "kling-video/v2.6/pro/text-to-video",
    label: "Kling 2.6 Pro — Texto→Vídeo (com áudio)",
    family: "Kling",
    kind: "text-to-video",
    durations: [5, 10],
    supportsAudio: true,
    defaultAudio: true,
    description: "Áudio nativo validado na sua conta. Narração automática em pt-BR. Consome mais créditos.",
  },
  {
    id: "veo3/text-to-video",
    label: "Veo 3 — Texto→Vídeo (com áudio)",
    family: "Veo",
    kind: "text-to-video",
    durations: [8],
    resolutions: ["720p", "1080p"],
    supportsAudio: true,
    defaultAudio: true,
    description: "Áudio nativo de alta qualidade (fala + ambiente) em pt-BR. Pode exigir allowlist na sua conta Higgsfield.",
  },
  {
    id: "veo3-fast/text-to-video",
    label: "Veo 3 Fast — Texto→Vídeo (com áudio)",
    family: "Veo",
    kind: "text-to-video",
    durations: [8],
    resolutions: ["720p", "1080p"],
    supportsAudio: true,
    defaultAudio: true,
    description: "Versão mais rápida e econômica do Veo 3, mantendo áudio nativo em pt-BR.",
  },
  {
    id: "sora-2/text-to-video",
    label: "Sora 2 — Texto→Vídeo (com áudio)",
    family: "Sora",
    kind: "text-to-video",
    durations: [5, 10],
    resolutions: ["720p", "1080p"],
    supportsAudio: true,
    defaultAudio: true,
    description: "Áudio nativo (fala + SFX) em pt-BR. Pode exigir allowlist na sua conta Higgsfield.",
  },
  {
    id: "higgsfield-ai/dop/standard",
    label: "DoP — Imagem→Vídeo",
    family: "DoP",
    kind: "image-to-video",
    durations: [5],
    supportsAudio: false,
    description: "Anima uma imagem (gerada ou enviada) em vídeo. Sem áudio nativo.",
  },
];

export function getHfModel(id: string): HfVideoModel | undefined {
  return HF_VIDEO_MODELS.find((m) => m.id === id);
}

export function getHfModelsByFamily(): Record<string, HfVideoModel[]> {
  return HF_VIDEO_MODELS.reduce<Record<string, HfVideoModel[]>>((acc, m) => {
    (acc[m.family] ||= []).push(m);
    return acc;
  }, {});
}