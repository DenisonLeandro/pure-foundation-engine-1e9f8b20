import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import * as api from "@/lib/api";
import type { AutopilotPlan, AutopilotPost } from "@/types";

// As tabelas v2 (autopilot_plans/posts/jobs) ainda não estão nos tipos gerados
// do Supabase — o schema v1 foi removido e os tipos não foram regenerados.
// Acesso destipado até a regeneração (no-explicit-any está desligado no projeto).
// deno-lint-ignore-file
const db = supabase as unknown as { from: (table: string) => any };

// ─── Query Keys ─────────────────────────────────────────────────

const keys = {
  plans: (companyId: string | null) => ["autopilot", "plans", companyId] as const,
  plan: (id: string) => ["autopilot", "plan", id] as const,
  posts: (planId: string) => ["autopilot", "posts", planId] as const,
};

/** Estados em que o plano ainda muda sozinho → vale fazer polling. */
export function isLivePlan(status?: string | null): boolean {
  return status === "generating" || status === "approved" || status === "active";
}

// ─── Plans ──────────────────────────────────────────────────────

export function useAutopilotPlans() {
  const { user } = useAuth();
  const { activeCompanyId } = useCompany();
  return useQuery({
    queryKey: keys.plans(activeCompanyId),
    queryFn: async (): Promise<AutopilotPlan[]> => {
      const { data, error } = await db
        .from("autopilot_plans")
        .select("*")
        .eq("company_id", activeCompanyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AutopilotPlan[];
    },
    enabled: !!user && !!activeCompanyId,
  });
}

export function useAutopilotPlan(id: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.plan(id || ""),
    queryFn: async (): Promise<AutopilotPlan | null> => {
      const { data, error } = await db.from("autopilot_plans").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as AutopilotPlan) ?? null;
    },
    enabled: !!user && !!id,
    refetchInterval: (q: { state: { data?: AutopilotPlan | null } }) =>
      isLivePlan(q.state.data?.status) ? 5000 : false,
  });
}

// ─── Posts ──────────────────────────────────────────────────────

/** Posts de um plano. Faz polling enquanto o plano estiver "vivo" (gerando/agendando). */
export function useAutopilotPosts(planId: string | null, planStatus?: string | null) {
  return useQuery({
    queryKey: keys.posts(planId || ""),
    queryFn: async (): Promise<AutopilotPost[]> => {
      const { data, error } = await db
        .from("autopilot_posts")
        .select("*")
        .eq("plan_id", planId!)
        .neq("status", "removed")
        .order("post_date", { ascending: true });
      if (error) throw error;
      return (data || []) as AutopilotPost[];
    },
    enabled: !!planId,
    refetchInterval: isLivePlan(planStatus) ? 4000 : false,
  });
}

/** Contagem por status (progresso do ciclo), derivada dos posts. */
export function postProgress(posts: AutopilotPost[]) {
  const by = (s: AutopilotPost["status"]) => posts.filter((p) => p.status === s).length;
  const total = posts.length;
  const ready = by("ready");
  const generating = total - ready - by("approved") - by("scheduled") - by("published") - by("failed");
  return {
    total,
    generating: Math.max(0, generating),
    ready,
    approved: by("approved"),
    scheduled: by("scheduled"),
    published: by("published"),
    failed: by("failed"),
    doneGenerating: ready + by("approved") + by("scheduled") + by("published") + by("failed"),
  };
}

// ─── Mutations: ações do painel (autopilot-plan) ────────────────

export function useParsePlan() {
  return useMutation({
    mutationFn: (text: string) => api.parsePlan(text),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompany();
  return useMutation({
    mutationFn: (input: {
      brand_id?: string | null;
      name?: string;
      platforms: string[];
      social_account_ids: string[];
      timezone: string;
      requires_approval: boolean;
      rows: { date: string | null; theme: string; category: string | null }[];
    }) =>
      api.planAction({
        action: "create",
        plan: {
          company_id: activeCompanyId!,
          brand_id: input.brand_id ?? null,
          name: input.name,
          platforms: input.platforms,
          social_account_ids: input.social_account_ids,
          timezone: input.timezone,
          requires_approval: input.requires_approval,
        },
        rows: input.rows,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["autopilot"] });
    },
  });
}

export function useApprovePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => api.planAction({ action: "approve", plan_id: planId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot"] }),
  });
}

export function usePausePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => api.planAction({ action: "pause", plan_id: planId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot"] }),
  });
}

export function useResumePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => api.planAction({ action: "resume", plan_id: planId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot"] }),
  });
}

export function useCancelPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => api.planAction({ action: "cancel", plan_id: planId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot"] }),
  });
}

export function useRegenPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, kind }: { postId: string; kind: "image" | "caption" }) =>
      api.planAction({ action: "regen", post_id: postId, kind }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot", "posts"] }),
  });
}

// ─── Mutations: edições triviais de post (update direto via RLS) ─────

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      caption?: string;
      hashtags?: string[];
      scheduled_at?: string | null;
      time_locked?: boolean;
    }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.caption !== undefined) patch.caption = input.caption;
      if (input.hashtags !== undefined) patch.hashtags = input.hashtags;
      if (input.scheduled_at !== undefined) patch.scheduled_at = input.scheduled_at;
      if (input.time_locked !== undefined) patch.time_locked = input.time_locked;
      const { error } = await db.from("autopilot_posts").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot", "posts"] }),
  });
}

/** Remover da revisão = marcar como 'removed' (some do ciclo, preserva histórico). */
export function useRemovePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await db
        .from("autopilot_posts")
        .update({ status: "removed", updated_at: new Date().toISOString() })
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot", "posts"] }),
  });
}

/** Aprovar/reabrir um post individual (ajuste manual na revisão em lote). */
export function useSetPostApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await db
        .from("autopilot_posts")
        .update({ status: approved ? "approved" : "ready", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot", "posts"] }),
  });
}
