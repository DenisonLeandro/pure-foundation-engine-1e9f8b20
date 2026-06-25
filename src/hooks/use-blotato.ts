import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/contexts/use-app";
import * as api from "@/lib/api";
import type { Platform } from "@/types";

// ─── Blotato (ONLY for visuals + sources) ───────────────────────
// Observação: o módulo `@/lib/api/blotato` ignora o primeiro parâmetro
// (`_apiKey`) — a chave é resolvida no servidor a partir do `companyId`.
// Mantemos a assinatura passando string vazia somente por compatibilidade.

const keys = {
  accounts: (platform?: Platform) =>
    platform ? (["blotato", "accounts", platform] as const) : (["blotato", "accounts"] as const),
  templates: (search?: string) =>
    search ? (["blotato", "templates", search] as const) : (["blotato", "templates"] as const),
};

export function useAccounts(platform?: Platform) {
  const { isConfigured, setAccounts } = useApp();
  return useQuery({
    queryKey: keys.accounts(platform),
    queryFn: async () => {
      const accounts = await api.listAccounts("", platform);
      const enriched = await Promise.all(
        accounts.map(async (acc) => {
          if ((acc.platform === "facebook" || acc.platform === "linkedin") && acc.id) {
            try {
              const subs = await api.listSubaccounts("", acc.id);
              return { ...acc, subaccounts: subs };
            } catch { return acc; }
          }
          return acc;
        })
      );
      setAccounts(enriched);
      return enriched;
    },
    enabled: isConfigured,
    staleTime: 60_000,
    retry: 1,
  });
}

// Visuals (Blotato)
export function useVisualTemplates(search?: string) {
  const { isConfigured } = useApp();
  return useQuery({
    queryKey: keys.templates(search),
    queryFn: async () => {
      const result = await api.listVisualTemplates("", search);
      if (result && typeof result === "object" && "items" in result) {
        return (result as any).items as api.VisualTemplateFromAPI[];
      }
      if (Array.isArray(result)) return result as api.VisualTemplateFromAPI[];
      return [];
    },
    enabled: isConfigured,
    staleTime: 300_000,
  });
}

export function useCreateVisual() {
  return useMutation({
    mutationFn: (params: api.CreateVisualParams) =>
      api.createVisual("", params),
  });
}

export function useVisualStatus(id: string | null) {
  return useQuery({
    queryKey: ["blotato", "visualStatus", id],
    queryFn: async () => {
      const data = await api.getVisualStatus("", id!);
      console.log(`[VisualStatus ${id}]`, data);
      if (data.status === "creation-from-template-failed") {
        console.error("[VisualStatus] FALHOU:", JSON.stringify(data, null, 2));
      }
      return data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "done" || status === "creation-from-template-failed") return false;
      return 5_000;
    },
  });
}

// Sources (Blotato)
export function useCreateSource() {
  return useMutation({
    mutationFn: (params: api.CreateSourceParams) =>
      api.createSource("", params),
  });
}

export function useSourceStatus(id: string | null) {
  return useQuery({
    queryKey: ["blotato", "sourceStatus", id],
    queryFn: () => api.getSourceStatus("", id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 10_000;
    },
  });
}

// ─── AI Content Generation ─────────────────────────────────────

export function useGenerateContent() {
  return useMutation({
    mutationFn: (params: api.GenerateContentParams) =>
      api.generateContent(params),
  });
}

export function useImageSearch() {
  return useMutation({
    mutationFn: (params: api.ImageSearchParams) =>
      api.searchImages(params),
  });
}

// ─── Post for Me (accounts + posting + analytics) ───────────────

/**
 * List ALL PFM accounts available to the API key.
 * Note: Returns all accounts, not filtered by company.
 * Use useCompanySocialAccounts() for per-company filtering.
 */
export function usePfmAccounts(platform?: string) {
  return useQuery({
    queryKey: ["pfm", "accounts", platform],
    queryFn: () => api.pfmListAccounts(platform),
    staleTime: 60_000,
  });
}

/**
 * List social accounts linked to the active company.
 * Filters PFM accounts based on company_social_accounts table.
 */
export function useCompanySocialAccounts(companyId: string | null, platform?: string) {
  const { isConfigured } = useApp();
  return useQuery({
    queryKey: ["company", "social-accounts", companyId, platform],
    queryFn: async () => {
      if (!companyId) return [];
      return api.listCompanySocialAccounts(companyId, platform);
    },
    enabled: isConfigured && !!companyId,
    staleTime: 60_000,
  });
}

/**
 * List PFM accounts intersected with the active company's links.
 * This is the company-scoped version of usePfmAccounts.
 * Owners of multiple companies will only see the accounts that belong
 * to the currently active company.
 */
export function useCompanyPfmAccounts(companyId: string | null, platform?: string) {
  const { isConfigured } = useApp();
  return useQuery({
    queryKey: ["company", "pfm-accounts", companyId, platform],
    queryFn: async () => {
      if (!companyId) return [] as api.PfmAccount[];
      const [pfm, links] = await Promise.all([
        api.pfmListAccounts(platform),
        api.listCompanySocialAccounts(companyId, platform),
      ]);
      const linkedIds = new Set(links.map((l) => l.pfm_account_id));
      return pfm.filter((a) => linkedIds.has(a.id));
    },
    enabled: isConfigured && !!companyId,
    staleTime: 60_000,
  });
}


export function usePfmCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: api.PfmCreatePostParams) => api.pfmCreatePost(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pfm", "posts"] });
    },
  });
}

export function usePfmPosts(opts?: { platform?: string; status?: string; limit?: number }) {
  return useQuery({
    queryKey: ["pfm", "posts", opts],
    queryFn: () => api.pfmListPosts(opts),
    staleTime: 30_000,
  });
}

/**
 * Lista posts PFM intersectados com as contas vinculadas à empresa ativa.
 * Versão por empresa do usePfmPosts.
 */
export function useCompanyPfmPosts(
  companyId: string | null,
  opts?: { platform?: string; status?: string; limit?: number },
) {
  const { isConfigured } = useApp();
  return useQuery({
    queryKey: ["company", "pfm-posts", companyId, opts],
    queryFn: async () => {
      if (!companyId) return [] as any[];
      const [postsRes, links] = await Promise.all([
        api.pfmListPosts(opts),
        api.listCompanySocialAccounts(companyId, opts?.platform),
      ]);
      const linkedIds = new Set(links.map((l) => l.pfm_account_id));
      const items: any[] = Array.isArray(postsRes)
        ? postsRes
        : (postsRes?.data ?? postsRes?.items ?? postsRes?.posts ?? []);
      return items.filter((p: any) => {
        const accId =
          p?.social_account_id ||
          p?.account_id ||
          p?.account?.id ||
          p?.target?.account_id ||
          (Array.isArray(p?.social_account_ids) ? p.social_account_ids[0] : null);
        return accId ? linkedIds.has(accId) : false;
      });
    },
    enabled: isConfigured && !!companyId,
    staleTime: 30_000,
  });
}


export function usePfmPostResults(opts?: { social_account_id?: string; platform?: string; limit?: number }) {
  return useQuery({
    queryKey: ["pfm", "results", opts],
    queryFn: () => api.pfmPostResults(opts),
    staleTime: 60_000,
    enabled: !!opts?.social_account_id || !!opts?.platform,
  });
}

export function usePfmAccountFeed(socialAccountId: string | null, limit = 20) {
  return useQuery({
    queryKey: ["pfm", "feed", socialAccountId, limit],
    queryFn: () => api.pfmAccountFeed(socialAccountId!, limit),
    enabled: !!socialAccountId,
    staleTime: 60_000,
  });
}
