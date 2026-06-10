import { createContext } from "react";
import type { AppConfig, SocialAccount, ScheduledPost } from "@/types";

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
  saveConfigToDb: (config: AppConfig) => Promise<AppConfig>;
}

export const AppContext = createContext<AppContextType | null>(null);
