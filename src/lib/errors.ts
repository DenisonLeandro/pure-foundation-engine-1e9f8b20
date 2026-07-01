/**
 * Extrai uma mensagem de erro amigável de um valor `unknown` (catch, ou o
 * `error` de uma chamada Supabase/Postgrest), caindo para `fallback` quando
 * não há mensagem utilizável.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return fallback;
}
