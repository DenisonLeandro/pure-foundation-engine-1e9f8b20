/**
 * companyStorage.ts — localStorage com escopo por (usuário, empresa).
 *
 * Chaves: app_uc:<userId>:<companyId>:<key>
 * Migra one-shot do userStorage (app_u:<userId>:<key>) na primeira leitura
 * para a empresa atual, preservando dados antigos sem vazar entre empresas.
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

function legacyUserKey(key: string): string {
  const uid = getCurrentUserId();
  return uid ? `app_u:${uid}:${key}` : `app_anon:${key}`;
}

/**
 * Storage por empresa. Se a chave ainda não existir para a empresa atual,
 * faz uma migração one-shot a partir do userStorage (legado), copiando
 * para a empresa ativa e removendo a chave global, de modo que outras
 * empresas do mesmo dono começam vazias.
 */
export const companyStorage = {
  get(companyId: string | null | undefined, key: string): string | null {
    const scoped = scopedKey(companyId, key);
    const v = localStorage.getItem(scoped);
    if (v !== null) return v;
    // One-shot migration from legacy user-scoped key into current company
    const legacy = legacyUserKey(key);
    const lv = localStorage.getItem(legacy);
    if (lv !== null && companyId) {
      localStorage.setItem(scoped, lv);
      localStorage.removeItem(legacy);
      return lv;
    }
    return null;
  },
  set(companyId: string | null | undefined, key: string, value: string): void {
    localStorage.setItem(scopedKey(companyId, key), value);
  },
  remove(companyId: string | null | undefined, key: string): void {
    localStorage.removeItem(scopedKey(companyId, key));
  },
};
