import { createContext } from "react";
import type { AppConfig, IntegrationKeyPatch, SocialAccount, ScheduledPost } from "@/types";

export interface AppState {
  config: AppConfig;
  accounts: SocialAccount[];
  schedules: ScheduledPost[];
  isConfigured: boolean;
  onboardingCompleted: boolean;
  configLoading: boolean;
}

export interface AppContextType extends AppState {
  setConfig: (config: AppConfig) => void;
  setAccounts: (accounts: SocialAccount[]) => void;
  setSchedules: (schedules: ScheduledPost[]) => void;
  resetConfig: () => void;
  completeOnboarding: (finalConfig?: AppConfig) => void;
  /** Salva apenas campos de perfil (marca/logo/onboarding) em user_configs. NUNCA toca em chaves. */
  saveConfigToDb: (config: AppConfig) => Promise<AppConfig>;
  /**
   * Salva (PATCH) chaves de integração em company_configs para a empresa ativa.
   * Só campos presentes no patch são alterados — os demais ficam intactos.
   * Owner/Admin somente. Após salvar, recarrega o status booleano.
   */
  saveIntegrationKeys: (patch: IntegrationKeyPatch) => Promise<void>;
  /** Força recarregamento do status booleano de integrações. */
  reloadIntegrationsStatus: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);
