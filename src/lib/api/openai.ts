/**
 * OpenAI image generation via the openai-image Edge Function.
 * A chave OpenAI é resolvida no servidor (Supabase Vault) — o cliente nunca a vê.
 */

import { getSupabaseUrl, baseHeaders } from "./_shared";

export interface OpenAiImageParams {
  prompt: string;
  size?: "1024x1024" | "1024x1280" | "1024x1536" | "1536x1024" | "auto";
  n?: number;
  model?: string;
  quality?: "low" | "medium" | "high" | "auto";
  background?: "transparent" | "opaque" | "auto";
}

export interface OpenAiImageResult {
  images: string[]; // data URLs (base64) ou URLs
  model: string;
}

async function readOpenAiImageResponse(response: Response): Promise<OpenAiImageResult> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    throw new Error("Resposta inválida da IA de imagem.");
  }

  const data = payload as Partial<OpenAiImageResult> & { error?: string };
  if (!response.ok || data.error) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  if (!Array.isArray(data.images)) {
    throw new Error("A IA não retornou imagem.");
  }
  return { images: data.images, model: data.model || "openai/gpt-image-2" };
}

export async function generateOpenAiImage(params: OpenAiImageParams): Promise<OpenAiImageResult> {
  const url = `${getSupabaseUrl()}/functions/v1/openai-image`;
  const headers = await baseHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  return readOpenAiImageResponse(response);
}

export interface OpenAiImageEditParams {
  /** Imagem a editar — data URL (base64) ou http URL. */
  image: string;
  /** Instrução da mudança desejada. */
  prompt: string;
  size?: "1024x1024" | "1024x1280" | "1024x1536" | "1536x1024" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
}

/**
 * Edita uma imagem existente via gpt-image-2 (`/v1/images/edits`), na mesma
 * Edge Function. A IA repinta a imagem seguindo o `prompt`.
 */
export async function editOpenAiImage(params: OpenAiImageEditParams): Promise<OpenAiImageResult> {
  const url = `${getSupabaseUrl()}/functions/v1/openai-image`;
  const headers = await baseHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  return readOpenAiImageResponse(response);
}
