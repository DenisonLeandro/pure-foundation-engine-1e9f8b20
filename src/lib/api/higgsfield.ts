/**
 * Higgsfield image & video generation via the higgsfield-proxy Edge Function.
 *
 * Segurança: o frontend NÃO envia credenciais Higgsfield (api_id/api_secret).
 * Em fluxo operacional, somente companyId é enviado no body — a Edge Function
 * valida membership e busca higgsfield_api_id / higgsfield_api_secret em
 * company_configs no servidor (SERVICE_ROLE).
 *
 * Validação manual (Setup, chave recém-digitada por Dono/Admin):
 *   validateHiggsFieldKey(apiId, apiSecret) — chama Higgsfield direto a partir
 *   do navegador APENAS com valores digitados (nunca com chaves salvas).
 *
 * TODO: no futuro, passar companyId explicitamente em cada chamada (em vez
 * do setter de módulo) para evitar acoplamento global.
 */

import { getSupabaseUrl, baseHeaders } from "./_shared";

let _activeCompanyId: string | null = null;

export function setHiggsfieldActiveCompany(companyId: string | null) {
  _activeCompanyId = companyId;
}

export function getHiggsfieldActiveCompany(): string | null {
  return _activeCompanyId;
}

export interface HfGenerationResult {
  status: string;
  request_id: string;
  status_url: string;
  cancel_url: string;
}

export interface HfStatusResult {
  status: "queued" | "in_progress" | "completed" | "failed" | "nsfw";
  request_id: string;
  video?: { url: string };
  images?: { url: string }[];
  error?: string;
}

export async function callHiggsfield(
  tool: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  if (!_activeCompanyId) {
    throw new Error("Selecione uma empresa antes de gerar vídeo.");
  }
  const url = `${getSupabaseUrl()}/functions/v1/higgsfield-proxy`;
  const headers = await baseHeaders();

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ tool, args, companyId: _activeCompanyId }),
  });

  if (!res.ok) {
    let errorMsg: string;
    try { const e = await res.json(); errorMsg = e.error || `HTTP ${res.status}`; }
    catch { errorMsg = `HTTP ${res.status}`; }
    throw new Error(errorMsg);
  }

  return res.json();
}

/** Generate image from text prompt */
export async function hfTextToImage(prompt: string, opts?: {
  model?: string; aspect_ratio?: string; resolution?: string;
}): Promise<HfGenerationResult> {
  return callHiggsfield("hf_text_to_image", { prompt, ...opts }) as Promise<HfGenerationResult>;
}

/** Generate video from image URL */
export async function hfImageToVideo(imageUrl: string, prompt: string, opts?: {
  model?: string; duration?: number; aspect_ratio?: string;
  resolution?: string; quality?: string;
  with_audio?: boolean; audio_prompt?: string;
  negative_prompt?: string; seed?: number; cfg_scale?: number;
  motion_strength?: number; style?: string;
}): Promise<HfGenerationResult> {
  return callHiggsfield("hf_image_to_video", {
    image_url: imageUrl, prompt, ...opts,
  }) as Promise<HfGenerationResult>;
}

/** Text-to-video (2-step: generates image then animates) */
export async function hfTextToVideo(prompt: string, opts?: {
  imageModel?: string; videoModel?: string; aspect_ratio?: string; duration?: number;
}): Promise<{ step: string; imageRequestId: string; videoModel: string; prompt: string }> {
  return callHiggsfield("hf_text_to_video", { prompt, ...opts }) as Promise<any>;
}

/** Poll generation status */
export async function hfStatus(requestId: string): Promise<HfStatusResult> {
  return callHiggsfield("hf_status", { request_id: requestId }) as Promise<HfStatusResult>;
}

/** Cancel a generation */
export async function hfCancel(requestId: string): Promise<void> {
  await callHiggsfield("hf_cancel", { request_id: requestId });
}

/**
 * Valida APENAS credenciais recém-digitadas no Setup por Dono/Admin.
 * NUNCA usar com chave salva em AppContext/company_configs.
 * Editor não deve acessar essa função (bloqueado nas views Setup/ManageKeysView).
 *
 * TODO: migrar essa validação para uma Edge Function dedicada que aceite
 * apenas no caminho explícito de validação manual.
 */
export async function validateHiggsFieldKey(apiId: string, apiSecret: string): Promise<{ valid: boolean; error?: string }> {
  if (!apiId?.trim() || !apiSecret?.trim()) {
    return { valid: false, error: "Credenciais vazias" };
  }
  try {
    const res = await fetch("https://platform.higgsfield.ai/higgsfield-ai/soul/standard", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiId.trim()}:${apiSecret.trim()}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ prompt: "test", aspect_ratio: "1:1", resolution: "360p" }),
    });
    if (res.status === 401 || res.status === 403) return { valid: false, error: "Credenciais inválidas" };
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Erro de conexão" };
  }
}
