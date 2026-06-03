import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AppConfig, SocialAccount, ScheduledPost } from "@/types";
import { userStorage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { getPfmUserKey, setPfmUserKey } from "@/lib/api";

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
    const saved = userStorage.get("config");
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [schedules, setSchedules] = useState<ScheduledPost[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  // Post for Me é a integração core (publicação). Blotato é legado/inerte.
  const isConfigured = !!config.postformeApiKey;
  const onboardingCompleted = !!config.onboardingCompleted;

  // Load config from DB on mount
  useEffect(() => {
    loadConfigFromDb();
  }, []);

  async function loadConfigFromDb() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setConfigLoading(false); return; }

      const { data } = await supabase
        .from("user_configs")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        const localConfig = (() => {
          try {
            const saved = userStorage.get("config");
            return saved ? JSON.parse(saved) as Partial<AppConfig> : {};
          } catch {
            return {};
          }
        })();
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
