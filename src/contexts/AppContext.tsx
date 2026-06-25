import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import type { AppConfig, IntegrationKeyPatch, IntegrationsStatus, SocialAccount, ScheduledPost } from "@/types";
import { DEFAULT_INTEGRATIONS } from "@/types";
import { userStorage } from "@/lib/storage";
import { wipeKeysForUser } from "@/lib/companyStorage";
import { supabase } from "@/integrations/supabase/client";
import { supabaseConfigured } from "@/lib/supabase";
import { AppContext } from "./app-context";
import { useCompany } from "@/contexts/CompanyContext";


// Hard ceiling for the boot loader.
const BOOT_TIMEOUT_MS = 8000;

// Campos sensíveis que NUNCA devem aparecer em localStorage. Limpeza defensiva
// para extirpar qualquer config legado salvo antes da migração para status.
const LEGACY_SECRET_FIELDS = [
  "postformeApiKey",
  "blotatoApiKey",
  "pexelsApiKey",
  "apifyApiToken",
  "firecrawlApiKey",
  "higgsFieldApiId",
  "higgsFieldApiSecret",
  "anthropicApiKey",
  "unsplashApiKey",
  "openaiApiKey",
  "apiKey",
  "apiSecret",
  "token",
] as const;

// Mapa campo-frontend → coluna em company_configs.
const KEY_COLUMN_MAP: Record<keyof IntegrationKeyPatch, string> = {
  postformeApiKey: "postforme_api_key",
  blotatoApiKey: "blotato_api_key",
  pexelsApiKey: "pexels_api_key",
  apifyApiToken: "apify_api_token",
  firecrawlApiKey: "firecrawl_api_key",
  higgsFieldApiId: "higgsfield_api_id",
  higgsFieldApiSecret: "higgsfield_api_secret",
};

function sanitizeStoredConfig(raw: string | null): Partial<AppConfig> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    let mutated = false;
    for (const field of LEGACY_SECRET_FIELDS) {
      if (field in parsed) {
        delete parsed[field];
        mutated = true;
      }
    }
    if (mutated) {
      try { userStorage.set("config", JSON.stringify(parsed)); } catch { /* noop */ }
    }
    // Whitelist somente campos não-sensíveis.
    const cleaned: Partial<AppConfig> = {};
    if (typeof parsed.brandName === "string") cleaned.brandName = parsed.brandName;
    if (typeof parsed.brandLogo === "string") cleaned.brandLogo = parsed.brandLogo;
    if (typeof parsed.onboardingCompleted === "boolean") cleaned.onboardingCompleted = parsed.onboardingCompleted;
    return cleaned;
  } catch (err) {
    console.warn("[AppContext] config localStorage corrompido, descartando:", err);
    try { userStorage.remove("config"); } catch { /* noop */ }
    return null;
  }
}

// Apaga, na carga inicial, chaves legadas que ficaram em chaves separadas no storage.
function purgeLegacyStorageKeys() {
  try {
    const candidates = ["pfmUserKey", "pfm_user_key", "openai_api_key", "anthropic_api_key"];
    for (const k of candidates) userStorage.remove(k);
  } catch { /* noop */ }
  // One-shot cleanup: remove leaked cross-company data caused by the old
  // companyStorage migration. Each company will repopulate from its own DB.
  try {
    const FLAG = "app_uc_reset_v1";
    if (!localStorage.getItem(FLAG)) {
      wipeKeysForUser(["analytics", "profile_urls", "structured_insights", "enrich_analytics"]);
      localStorage.setItem(FLAG, "1");
    }
  } catch { /* noop */ }
}


const DEFAULT_CONFIG: AppConfig = {
  brandName: "Minha Empresa",
  onboardingCompleted: false,
  integrations: DEFAULT_INTEGRATIONS,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { activeCompanyId, role: companyRole } = useCompany();
  const [config, setConfigState] = useState<AppConfig>(() => {
    purgeLegacyStorageKeys();
    const saved = sanitizeStoredConfig(userStorage.get("config"));
    return { ...DEFAULT_CONFIG, ...(saved ?? {}) };
  });
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [schedules, setSchedules] = useState<ScheduledPost[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const inFlightRef = useRef<Set<string>>(new Set());

  const isConfigured = !!config.integrations.postforme;
  const onboardingCompleted = !!config.onboardingCompleted;
  const canEditCompanyKeys = companyRole === "owner" || companyRole === "admin";

  const persistNonSensitive = (cfg: AppConfig) => {
    try {
      userStorage.set("config", JSON.stringify({
        brandName: cfg.brandName,
        brandLogo: cfg.brandLogo,
        onboardingCompleted: cfg.onboardingCompleted,
      }));
    } catch { /* noop */ }
  };

  const loadIntegrationsStatus = useCallback(async (companyId: string | null): Promise<IntegrationsStatus> => {
    if (!companyId) return DEFAULT_INTEGRATIONS;
    const { data, error } = await supabase.rpc(
      "get_company_configs_status" as never,
      { _company_id: companyId } as never,
    );
    if (error) {
      console.warn("[AppContext] erro ao carregar status de integrações:", error);
      return DEFAULT_INTEGRATIONS;
    }
    const list = (data ?? []) as Array<Record<string, unknown>>;
    const row = Array.isArray(list) ? list[0] : undefined;
    if (!row) return DEFAULT_INTEGRATIONS;
    return {
      postforme: !!row.has_postforme,
      blotato: !!row.has_blotato,
      pexels: !!row.has_pexels,
      apify: !!row.has_apify,
      firecrawl: !!row.has_firecrawl,
      higgsfield: !!row.has_higgsfield,
      higgsfieldApiId: !!row.has_higgsfield_api_id,
      higgsfieldApiSecret: !!row.has_higgsfield_api_secret,
      updatedAt: (row.updated_at as string | null | undefined) ?? null,
    };
  }, []);

  const loadConfigFromDb = useCallback(async (userId?: string) => {
    let uid = userId;
    const key = `${uid ?? ""}:${activeCompanyId ?? ""}`;
    let claimed = false;
    try {
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id;
      }
      if (!uid) return;
      if (inFlightRef.current.has(key)) return;
      inFlightRef.current.add(key);
      claimed = true;

      const { data: userCfg } = await supabase
        .from("user_configs")
        .select("brand_name, brand_logo_url, onboarding_completed")
        .eq("user_id", uid)
        .maybeSingle();

      const integrations = await loadIntegrationsStatus(activeCompanyId);

      const localConfig = sanitizeStoredConfig(userStorage.get("config")) ?? {};
      const onboardingCompletedMerged =
        (userCfg?.onboarding_completed as boolean | undefined) ||
        localConfig.onboardingCompleted ||
        false;

      const loaded: AppConfig = {
        brandName: (userCfg?.brand_name as string) || "Minha Empresa",
        brandLogo: (userCfg?.brand_logo_url as string) || undefined,
        onboardingCompleted: onboardingCompletedMerged,
        integrations,
      };
      setConfigState(loaded);
      persistNonSensitive(loaded);
    } catch (err) {
      console.error("Failed to load config from DB:", err);
    } finally {
      if (claimed) inFlightRef.current.delete(key);
      setConfigLoading(false);
    }
  }, [activeCompanyId, loadIntegrationsStatus]);

  // Load on mount and whenever auth/active company changes.
  useEffect(() => {
    if (!supabaseConfigured) {
      console.info("[boot][AppContext] backend não configurado; liberando app sem config remota");
      setConfigLoading(false);
      return;
    }

    let cancelled = false;

    const finishBoot = (reason: string) => {
      if (cancelled) return;
      console.info(`[boot][AppContext] boot finalizado (${reason})`);
      setConfigLoading(false);
    };

    const startConfigLoad = async (userId: string, reason: string, blockUi: boolean) => {
      if (cancelled) return;
      const key = `${userId}:${activeCompanyId ?? ""}`;
      if (inFlightRef.current.has(key)) return;
      if (blockUi) setConfigLoading(true);
      console.info(`[boot][AppContext] carregando config (${reason})`, { userId, activeCompanyId });
      await loadConfigFromDb(userId);
    };

    const safety = window.setTimeout(() => {
      console.warn(`[AppContext] boot timeout (${BOOT_TIMEOUT_MS}ms) — liberando UI`);
      finishBoot("timeout");
    }, BOOT_TIMEOUT_MS);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        void startConfigLoad(session.user.id, "getSession", true);
      } else {
        finishBoot("sem sessão");
      }
    }).catch(() => finishBoot("erro getSession"));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        inFlightRef.current.clear();
        setConfigState(DEFAULT_CONFIG);
        userStorage.remove("config");
        finishBoot("signed out");
        return;
      }
      if (!session?.user) return;
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        void startConfigLoad(session.user.id, event, true);
      } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void startConfigLoad(session.user.id, event, false);
      }
    });

    return () => { cancelled = true; window.clearTimeout(safety); subscription.unsubscribe(); };
  }, [activeCompanyId, loadConfigFromDb]);

  async function saveConfigToDb(cfg: AppConfig): Promise<AppConfig> {
    // Esta função só persiste campos de PERFIL/marca em user_configs.
    // Chaves de integração devem ir por saveIntegrationKeys (patch em company_configs).
    const nextConfig: AppConfig = {
      ...cfg,
      onboardingCompleted: cfg.onboardingCompleted || config.onboardingCompleted || false,
      integrations: cfg.integrations ?? config.integrations,
    };

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Usuário não autenticado.");

      const userRow = {
        user_id: user.id,
        brand_name: nextConfig.brandName || "Minha Empresa",
        brand_logo_url: nextConfig.brandLogo || null,
        onboarding_completed: nextConfig.onboardingCompleted || false,
      };
      const { data: existingUser } = await supabase
        .from("user_configs")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existingUser) {
        const { error } = await supabase.from("user_configs").update(userRow).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_configs").insert(userRow);
        if (error) throw error;
      }

      setConfigState(nextConfig);
      persistNonSensitive(nextConfig);
      return nextConfig;
    } catch (err) {
      console.error("Failed to save config to DB:", err);
      throw err;
    }
  }

  async function saveIntegrationKeys(patch: IntegrationKeyPatch): Promise<void> {
    if (!activeCompanyId) throw new Error("Selecione uma empresa antes de salvar chaves.");
    if (!canEditCompanyKeys) throw new Error("Apenas Dono ou Admin podem alterar as APIs da empresa.");

    // Monta um JSON apenas com as colunas presentes no patch (preserva as demais no servidor).
    const payload: Record<string, string | null> = {};
    let hasAny = false;
    (Object.keys(patch) as Array<keyof IntegrationKeyPatch>).forEach((field) => {
      const value = patch[field];
      if (value === undefined) return;
      const column = KEY_COLUMN_MAP[field];
      if (!column) return;
      // string vazia é tratada como remover; null também remove. Apenas o campo enviado é tocado.
      payload[column] = typeof value === "string" && value.trim() ? value.trim() : null;
      hasAny = true;
    });
    if (!hasAny) return;

    const { error } = await supabase.rpc(
      "update_company_integration_keys" as never,
      { _company_id: activeCompanyId, _patch: payload } as never,
    );
    if (error) throw error;

    // Recarrega status booleano e atualiza o config em memória.
    const integrations = await loadIntegrationsStatus(activeCompanyId);
    setConfigState((prev) => {
      const next = { ...prev, integrations };
      persistNonSensitive(next);
      return next;
    });
  }

  const reloadIntegrationsStatus = useCallback(async () => {
    const integrations = await loadIntegrationsStatus(activeCompanyId);
    setConfigState((prev) => {
      const next = { ...prev, integrations };
      persistNonSensitive(next);
      return next;
    });
  }, [activeCompanyId, loadIntegrationsStatus]);

  const setConfig = (newConfig: AppConfig) => {
    setConfigState(newConfig);
    persistNonSensitive(newConfig);
  };

  const completeOnboarding = (finalConfig?: AppConfig) => {
    const updated = { ...(finalConfig ?? config), onboardingCompleted: true };
    setConfigState(updated);
    persistNonSensitive(updated);
  };

  const resetConfig = () => {
    setConfigState(DEFAULT_CONFIG);
    userStorage.remove("config");
    setAccounts([]);
    setSchedules([]);
  };

  return (
    <AppContext.Provider
      value={{
        config,
        accounts,
        schedules,
        isConfigured,
        onboardingCompleted,
        configLoading,
        setConfig,
        setAccounts,
        setSchedules,
        resetConfig,
        completeOnboarding,
        saveConfigToDb,
        saveIntegrationKeys,
        reloadIntegrationsStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
