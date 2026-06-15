/**
 * Shared internals for the API service layer.
 *
 * SUPABASE_URL is auto-detected from Lovable's env or can be set manually.
 * These helpers are internal to `@/lib/api` and are not part of its public surface.
 */

import { userStorage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import type { AppConfig } from "@/types";

// Public fallbacks — mirrored from src/integrations/supabase/client.ts.
// These are safe to ship in the frontend bundle (publishable identity).
// Garantem que páginas como Contas/Agenda não quebrem se o build publicado
// não receber VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.
const FALLBACK_SUPABASE_URL = "https://pgimbjfdxwefahxmpdpc.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_iJUl_R_VWamc4p2eC2XAWw_3Li5jJ0t";

export function getSupabaseUrl(): string {
  const url =
    ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined) ||
    FALLBACK_SUPABASE_URL;
  return url;
}

/** Read user's saved config from scoped localStorage */
export function getSavedConfig(): Partial<AppConfig> {
  try {
    const raw = userStorage.get("config");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function getAnonKey(): string {
  return (
    ((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    FALLBACK_SUPABASE_PUBLISHABLE_KEY
  );
}

/**
 * Headers for calling Lovable Cloud edge functions.
 * Sends `apikey` (anon) for PostgREST gateway AND `Authorization: Bearer <user JWT>`
 * so edge functions that call `requireUser()` accept the request.
 * Falls back to anon key as Bearer when there's no session (e.g. pre-login flows).
 */
export async function baseHeaders(): Promise<Record<string, string>> {
  const anonKey = getAnonKey();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (anonKey) h["apikey"] = anonKey;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    h["Authorization"] = `Bearer ${token || anonKey}`;
  } catch {
    if (anonKey) h["Authorization"] = `Bearer ${anonKey}`;
  }
  return h;
}

