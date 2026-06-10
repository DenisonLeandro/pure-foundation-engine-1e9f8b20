import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import type { AppConfig, SocialAccount, ScheduledPost } from "@/types";
import { userStorage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { supabaseConfigured } from "@/lib/supabase";
import { getPfmUserKey, setPfmUserKey } from "@/lib/api";

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

interface AppState {
  config: AppConfig;
  accounts: SocialAccount[];
  schedules: ScheduledPost[];
  isConfigured: boolean;
  onboardingCompleted: boolean;
  configLoading: boolean;
}

interface AppContextType extends AppState {
  setConfig: (config: AppConfig) => void;
  setAccounts: (accounts: SocialAccount[]) => void;
  setSchedules: (schedules: ScheduledPost[]) => void;
  resetConfig: () => void;
  completeOnboarding: (finalConfig?: AppConfig) => void;
  saveConfigToDb: (config: AppConfig) => Promise<AppConfig>;
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

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AppConfig>(() => {
    const saved = safeParseConfig(userStorage.get("config"));
    return saved ? { ...DEFAULT_CONFIG, ...saved } as AppConfig : DEFAULT_CONFIG;
  });
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [schedules, setSchedules] = useState<ScheduledPost[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const inFlightUsersRef = useRef<Set<string>>(new Set());

  // Post for Me é a integração core (publicação). Blotato é legado/inerte.
  const isConfigured = !!config.postformeApiKey;
  const onboardingCompleted = !!config.onboardingCompleted;

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
      if (inFlightUsersRef.current.has(userId)) {
        console.info(`[boot][AppContext] carga já em andamento (${reason})`, { userId });
        return;
      }
      if (blockUi) setConfigLoading(true);
      console.info(`[boot][AppContext] carregando config (${reason})`, { userId, blockUi });
      await loadConfigFromDb(userId);
    };

    // Safety net: never let the boot loader stall forever.
    const safety = window.setTimeout(() => {
      console.warn(`[AppContext] boot timeout (${BOOT_TIMEOUT_MS}ms) — liberando UI`);
      finishBoot("timeout");
    }, BOOT_TIMEOUT_MS);

    // Initial hydration from current session (if any)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      console.info("[boot][AppContext] getSession resolvido", { hasUser: !!session?.user });
      if (session?.user) {
        void startConfigLoad(session.user.id, "getSession", true);
      } else {
        finishBoot("sem sessão");
      }
    }).catch((err) => {
      console.warn("[AppContext] getSession falhou:", err);
      finishBoot("erro getSession");
    });


    // React to login/logout/refresh so config is hydrated after auth completes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.info("[boot][AppContext] auth event", { event, hasUser: !!session?.user });
      if (event === "SIGNED_OUT") {
        inFlightUsersRef.current.clear();
        setConfigState(DEFAULT_CONFIG);
        userStorage.remove("config");
        setPfmUserKey("");
        finishBoot("signed out");
        return;
      }

      if (!session?.user) return;

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        void startConfigLoad(session.user.id, event, true);
        return;
      }

      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void startConfigLoad(session.user.id, event, false);
      }
    });

    return () => { cancelled = true; window.clearTimeout(safety); subscription.unsubscribe(); };
  }, []);

  async function loadConfigFromDb(userId?: string) {
    let uid = userId;
    let claimedInFlight = false;
    let shouldSettleLoading = true;

    try {
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id;
      }
      if (!uid) {
        console.info("[boot][AppContext] nenhuma sessão ao buscar config");
        return;
      }
      if (inFlightUsersRef.current.has(uid)) {
        console.info("[boot][AppContext] carga duplicada ignorada", { userId: uid });
        shouldSettleLoading = false;
        return;
      }
      inFlightUsersRef.current.add(uid);
      claimedInFlight = true;


      const { data } = await supabase
        .from("user_configs")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();

      if (data) {
        const localConfig = safeParseConfig(userStorage.get("config")) ?? {};
        const loaded: AppConfig = {
          blotatoApiKey: data.blotato_api_key || localConfig.blotatoApiKey || "",
          postformeApiKey: data.postforme_api_key || localConfig.postformeApiKey || (localConfig as { pfmApiKey?: string }).pfmApiKey || getPfmUserKey() || "",
          pexelsApiKey: data.pexels_api_key || localConfig.pexelsApiKey || "",
          apifyApiToken: data.apify_api_token || localConfig.apifyApiToken || "",
          firecrawlApiKey: data.firecrawl_api_key || localConfig.firecrawlApiKey || "",
          higgsFieldApiId: data.higgsfield_api_id || localConfig.higgsFieldApiId || undefined,
          higgsFieldApiSecret: data.higgsfield_api_secret || localConfig.higgsFieldApiSecret || undefined,
          brandName: data.brand_name || "Minha Empresa",
          brandLogo: data.brand_logo_url || undefined,
          onboardingCompleted: data.onboarding_completed || config.onboardingCompleted || false,
        };
        setConfigState(loaded);
        userStorage.set("config", JSON.stringify(loaded));
        setPfmUserKey(loaded.postformeApiKey);
      }
    } catch (err) {
      console.error("Failed to load config from DB:", err);
    } finally {
      if (claimedInFlight && uid) {
        inFlightUsersRef.current.delete(uid);
      }
      if (shouldSettleLoading) {
        console.info("[boot][AppContext] configLoading=false", { userId: uid ?? null });
        setConfigLoading(false);
      }
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

      const row = {
        user_id: user.id,
        blotato_api_key: nextConfig.blotatoApiKey,
        postforme_api_key: nextConfig.postformeApiKey || null,
        pexels_api_key: nextConfig.pexelsApiKey || null,
        apify_api_token: nextConfig.apifyApiToken || null,
        firecrawl_api_key: nextConfig.firecrawlApiKey || null,
        higgsfield_api_id: nextConfig.higgsFieldApiId || null,
        higgsfield_api_secret: nextConfig.higgsFieldApiSecret || null,
        brand_name: nextConfig.brandName || "Minha Empresa",
        brand_logo_url: nextConfig.brandLogo || null,
        onboarding_completed: nextConfig.onboardingCompleted || false,
      };

      // Upsert — try update first, insert if not exists
      const { data: existing, error: lookupError } = await supabase
        .from("user_configs")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (existing) {
        const { error } = await supabase
          .from("user_configs")
          .update(row)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_configs")
          .insert(row);
        if (error) throw error;
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

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
