import { useState, useEffect, useRef, ReactNode } from "react";
import type { AppConfig, SocialAccount, ScheduledPost } from "@/types";
import { userStorage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { supabaseConfigured } from "@/lib/supabase";
import { AppContext } from "./app-context";
import { getPfmUserKey, setPfmUserKey } from "@/lib/api";
import { useCompany } from "@/contexts/CompanyContext";


// Hard ceiling for the boot loader: even if Supabase hangs, the app must
// stop spinning after this many ms and let routes render (login/setup).
const BOOT_TIMEOUT_MS = 8000;

function safeParseConfig(raw: string | null): Partial<AppConfig> | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as Partial<AppConfig>; }
  catch (err) {
    console.warn("[AppContext] config localStorage corrompido, descartando:", err);
    try { userStorage.remove("config"); } catch { /* noop */ }
    return null;
  }
}


const DEFAULT_CONFIG: AppConfig = {
  postformeApiKey: "",
  brandName: "Minha Empresa",
  blotatoApiKey: "",
  pexelsApiKey: "",
  apifyApiToken: "",
  higgsFieldApiId: "",
  higgsFieldApiSecret: "",
  firecrawlApiKey: "",
};



export function AppProvider({ children }: { children: ReactNode }) {
  const { activeCompanyId, role: companyRole } = useCompany();
  const [config, setConfigState] = useState<AppConfig>(() => {
    const saved = safeParseConfig(userStorage.get("config"));
    return saved ? { ...DEFAULT_CONFIG, ...saved } as AppConfig : DEFAULT_CONFIG;
  });
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [schedules, setSchedules] = useState<ScheduledPost[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const inFlightRef = useRef<Set<string>>(new Set());

  // Post for Me é a integração core (publicação). Blotato é legado/inerte.
  const isConfigured = !!config.postformeApiKey;
  const onboardingCompleted = !!config.onboardingCompleted;
  const canEditCompanyKeys = companyRole === "owner" || companyRole === "admin";

  // Load config from DB on mount AND whenever auth state changes
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
        setPfmUserKey("");
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
  // Reload when active company changes so members switching companies pick up the right keys.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompanyId]);

  async function loadConfigFromDb(userId?: string) {
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

      // Personal/profile config (brand name, onboarding flag) stays per-user.
      const { data: userCfg } = await supabase
        .from("user_configs")
        .select("brand_name, brand_logo_url, onboarding_completed")
        .eq("user_id", uid)
        .maybeSingle();

      // API keys come from the active company (shared across all members).
      let companyCfg: Record<string, string | null> | null = null;
      if (activeCompanyId) {
        const { data } = await supabase
          .from("company_configs" as never)
          .select("*")
          .eq("company_id", activeCompanyId)
          .maybeSingle();
        companyCfg = (data ?? null) as Record<string, string | null> | null;
      }

      const localConfig = safeParseConfig(userStorage.get("config")) ?? {};
      const onboardingCompletedMerged =
        (userCfg?.onboarding_completed as boolean | undefined) ||
        localConfig.onboardingCompleted ||
        config.onboardingCompleted ||
        false;

      const loaded: AppConfig = {
        blotatoApiKey: companyCfg?.blotato_api_key || "",
        postformeApiKey: companyCfg?.postforme_api_key || "",
        pexelsApiKey: companyCfg?.pexels_api_key || "",
        apifyApiToken: companyCfg?.apify_api_token || "",
        firecrawlApiKey: companyCfg?.firecrawl_api_key || "",
        higgsFieldApiId: companyCfg?.higgsfield_api_id || undefined,
        higgsFieldApiSecret: companyCfg?.higgsfield_api_secret || undefined,
        brandName: (userCfg?.brand_name as string) || "Minha Empresa",
        brandLogo: (userCfg?.brand_logo_url as string) || undefined,
        onboardingCompleted: onboardingCompletedMerged,
      };
      setConfigState(loaded);
      userStorage.set("config", JSON.stringify(loaded));
      setPfmUserKey(loaded.postformeApiKey);
    } catch (err) {
      console.error("Failed to load config from DB:", err);
    } finally {
      if (claimed) inFlightRef.current.delete(key);
      setConfigLoading(false);
    }
  }

  async function saveConfigToDb(cfg: AppConfig) {
    const nextConfig: AppConfig = {
      ...cfg,
      postformeApiKey: cfg.postformeApiKey || config.postformeApiKey || (cfg as { pfmApiKey?: string }).pfmApiKey || getPfmUserKey() || undefined,
      onboardingCompleted: cfg.onboardingCompleted || config.onboardingCompleted || false,
    };

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Usuário não autenticado.");

      // 1. Personal/profile fields → user_configs
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

      // 2. API keys → company_configs (only owner/admin)
      if (activeCompanyId) {
        if (!canEditCompanyKeys) {
          throw new Error("Apenas Dono ou Admin podem alterar as APIs da empresa.");
        }
        const companyRow = {
          company_id: activeCompanyId,
          blotato_api_key: nextConfig.blotatoApiKey || null,
          postforme_api_key: nextConfig.postformeApiKey || null,
          pexels_api_key: nextConfig.pexelsApiKey || null,
          apify_api_token: nextConfig.apifyApiToken || null,
          firecrawl_api_key: nextConfig.firecrawlApiKey || null,
          higgsfield_api_id: nextConfig.higgsFieldApiId || null,
          higgsfield_api_secret: nextConfig.higgsFieldApiSecret || null,
        };
        const { data: existingCompany } = await supabase
          .from("company_configs" as never)
          .select("id")
          .eq("company_id", activeCompanyId)
          .maybeSingle();
        if (existingCompany) {
          const { error } = await supabase
            .from("company_configs" as never)
            .update(companyRow as never)
            .eq("company_id", activeCompanyId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("company_configs" as never).insert(companyRow as never);
          if (error) throw error;
        }
      }

      setConfigState(nextConfig);
      userStorage.set("config", JSON.stringify(nextConfig));
      setPfmUserKey(nextConfig.postformeApiKey);
      return nextConfig;
    } catch (err) {
      console.error("Failed to save config to DB:", err);
      throw err;
    }
  }


  const setConfig = (newConfig: AppConfig) => {
    setConfigState(newConfig);
    userStorage.set("config", JSON.stringify(newConfig));
    setPfmUserKey(newConfig.postformeApiKey);
  };

  const completeOnboarding = (finalConfig?: AppConfig) => {
    const updated = { ...(finalConfig ?? config), onboardingCompleted: true };
    setConfigState(updated);
    userStorage.set("config", JSON.stringify(updated));
    setPfmUserKey(updated.postformeApiKey);
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
