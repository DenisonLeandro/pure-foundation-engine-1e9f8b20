/**
 * companyStorage.ts — localStorage com escopo por (usuário, empresa).
 *
 * Chaves: app_uc:<userId>:<companyId>:<key>
 * Cada empresa começa vazia. Não há migração automática a partir de chaves
 * legadas globais (`app_u:<uid>:<key>` ou chaves sem prefixo), porque isso
 * copiava dados de uma empresa para outra do mesmo dono.
 */

function getCurrentUserId(): string | null {
  try {
    const keys = Object.keys(localStorage).filter(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
    );
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const session = JSON.parse(raw);
      const userId = session?.user?.id;
      if (userId) return userId;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function scopedKey(companyId: string | null | undefined, key: string): string {
  const uid = getCurrentUserId();
  const u = uid ?? "anon";
  const c = companyId || "none";
  return `app_uc:${u}:${c}:${key}`;
}

export const companyStorage = {
  get(companyId: string | null | undefined, key: string): string | null {
    return localStorage.getItem(scopedKey(companyId, key));
  },
  set(companyId: string | null | undefined, key: string, value: string): void {
    localStorage.setItem(scopedKey(companyId, key), value);
  },
  remove(companyId: string | null | undefined, key: string): void {
    localStorage.removeItem(scopedKey(companyId, key));
  },
};

/**
 * Apaga, para o usuário atual, todas as entradas `app_uc:<uid>:*:<key>` e
 * a versão legada `app_u:<uid>:<key>` / chave global `<key>`. Usado pela
 * limpeza one-shot no boot para sanear contaminação cruzada entre empresas.
 */
export function wipeKeysForUser(keys: string[]): void {
  try {
    const uid = getCurrentUserId();
    const all = Object.keys(localStorage);
    for (const k of keys) {
      // legacy global e legacy user-scoped
      localStorage.removeItem(k);
      if (uid) localStorage.removeItem(`app_u:${uid}:${k}`);
    }
    // todas as entradas company-scoped do usuário para esses keys
    if (!uid) return;
    const prefix = `app_uc:${uid}:`;
    for (const k of all) {
      if (!k.startsWith(prefix)) continue;
      for (const target of keys) {
        if (k.endsWith(`:${target}`)) {
          localStorage.removeItem(k);
          break;
        }
      }
    }
  } catch {
    /* noop */
  }
}
