/**
 * Shared internals for the API service layer.
 *
 * SUPABASE_URL is auto-detected from Lovable's env or can be set manually.
 * These helpers are internal to `@/lib/api` and are not part of its public surface.
 */

import { userStorage } from "@/lib/storage";
import type { AppConfig } from "@/types";

export function getSupabaseUrl(): string {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL ?? "";
  if (!url) {
    throw new Error(
      "VITE_SUPABASE_URL não configurada. Configure nas variáveis de ambiente do Lovable."
    );
  }
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
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
    ""
  );
}

export function baseHeaders(): Record<string, string> {
  const anonKey = getAnonKey();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (anonKey) {
    h["apikey"] = anonKey;
    h["Authorization"] = `Bearer ${anonKey}`;
  }
  return h;
}
