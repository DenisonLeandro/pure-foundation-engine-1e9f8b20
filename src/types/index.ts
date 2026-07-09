export type Platform =
  | "instagram"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "pinterest"
  | "threads"
  | "bluesky"
  | "youtube";

export interface SubAccount {
  id: string;
  name: string;
  type: string;
}

export interface SocialAccount {
  id: string;
  platform: Platform;
  fullname: string;
  username: string;
  subaccounts: SubAccount[];
  requiredFields: Record<string, string>;
}

export interface ScheduledPost {
  id: string;
  scheduledTime: string;
  draft: {
    accountId: string;
    platform: Platform;
    text: string;
    mediaUrls: string[];
  };
  account: {
    platform: Platform;
    name: string;
    username: string;
  };
}

export interface VisualTemplate {
  id: string;
  description: string;
  inputs: VisualTemplateInput[];
}

export interface VisualTemplateInput {
  name: string;
  label: string;
  description?: string;
  type: Record<string, unknown>;
  default?: unknown;
}

export interface ContentSource {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  title?: string;
  content?: string;
  referenceUrl?: string;
  sourceType: string;
}

// Status (booleano) por integração da empresa ativa.
// O frontend NUNCA recebe os valores reais das chaves.
export interface IntegrationsStatus {
  postforme: boolean;
  blotato: boolean;
  pexels: boolean;
  apify: boolean;
  firecrawl: boolean;
  higgsfield: boolean;          // true só quando ID *e* Secret estão presentes
  higgsfieldApiId: boolean;
  higgsfieldApiSecret: boolean;
  updatedAt?: string | null;
}

export const DEFAULT_INTEGRATIONS: IntegrationsStatus = {
  postforme: false,
  blotato: false,
  pexels: false,
  apify: false,
  firecrawl: false,
  higgsfield: false,
  higgsfieldApiId: false,
  higgsfieldApiSecret: false,
  updatedAt: null,
};

export interface AppConfig {
  // Perfil / marca (não-sensível).
  brandName: string;
  brandLogo?: string;
  onboardingCompleted?: boolean;
  // Status booleano das integrações — única informação de chaves visível ao frontend.
  integrations: IntegrationsStatus;
}

// Patch operacional para gravar chaves de integração em company_configs.
// Cada campo é opcional. `null` = remover; string = nova chave; ausente = não alterar.
export interface IntegrationKeyPatch {
  postformeApiKey?: string | null;
  blotatoApiKey?: string | null;
  pexelsApiKey?: string | null;
  apifyApiToken?: string | null;
  firecrawlApiKey?: string | null;
  higgsFieldApiId?: string | null;
  higgsFieldApiSecret?: string | null;
}

export interface PostDraft {
  text: string;
  mediaUrls: string[];
  platforms: Platform[];
  scheduledTime?: string;
  useNextFreeSlot?: boolean;
  platformSpecific: Record<Platform, Record<string, unknown>>;
}

// ─── Autopilot v2 ───────────────────────────────────────────────
// Modelo novo (schema v2): um PLANO = um período de conteúdo colado (ciclo
// finito) → POSTS (um por dia) → JOBS (fila do motor em 2º plano).
// Tipos escritos à mão porque os tipos gerados do Supabase ainda descrevem o
// schema v1 (autopilot_configs/calendars) que foi removido. Ver docs/AUTOPILOT_V2_PLAN.md.

/** Estado do plano (derivado dos posts). */
export type AutopilotPlanStatus =
  | "draft"
  | "generating"
  | "review"
  | "approved"
  | "active"
  | "completed"
  | "failed"
  | "paused"
  | "canceled";

/** Estado do post (fonte da verdade da máquina de estados). */
export type AutopilotPostStatus =
  | "draft"
  | "generating"
  | "ready"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "removed";

/** Tipos de trabalho da fila. */
export type AutopilotJobKind = "gen_image" | "gen_caption" | "schedule_post" | "confirm_post";
export type AutopilotJobStatus = "queued" | "running" | "done" | "failed";

export interface AutopilotPlan {
  id: string;
  company_id: string;
  brand_id?: string | null;
  created_by: string;
  name: string;
  platforms: string[];
  social_account_ids: string[];
  timezone: string; // IANA (ex.: America/Sao_Paulo)
  requires_approval: boolean;
  status: AutopilotPlanStatus;
  period_start?: string | null; // YYYY-MM-DD
  period_end?: string | null; // YYYY-MM-DD
  raw_plan_text?: string | null;
  ending_notice_sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutopilotPost {
  id: string;
  plan_id: string;
  company_id: string;
  post_date: string; // YYYY-MM-DD (vem do plano)
  theme: string;
  category?: string | null;
  art_brief?: string | null;
  caption?: string | null;
  hashtags: string[];
  image_url?: string | null;
  image_prompt?: string | null;
  visual_provider: string;
  scheduled_at?: string | null; // UTC
  time_locked: boolean;
  status: AutopilotPostStatus;
  pfm_post_id?: string | null;
  published_url?: string | null;
  engagement?: Record<string, unknown> | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutopilotJob {
  id: string;
  company_id: string;
  plan_id: string;
  post_id?: string | null;
  kind: AutopilotJobKind;
  status: AutopilotJobStatus;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

/** Linha estruturada devolvida pelo autopilot-parse (a grade que a pessoa confirma). */
export interface AutopilotPlanRow {
  date: string | null; // YYYY-MM-DD ou null (a pessoa preenche antes de gerar)
  theme: string;
  category: string | null;
}
