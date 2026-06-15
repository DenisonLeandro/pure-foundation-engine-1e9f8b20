import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { userStorage } from "@/lib/storage";
import { setPfmActiveCompany, setBlotatoActiveCompany, setFirecrawlActiveCompany, setHiggsfieldActiveCompany } from "@/lib/api";
import type { CompanyRole } from "@/lib/permissions";

export interface Company {
  id: string;
  name: string;
  segment: string | null;
  logo_url: string | null;
  primary_color: string | null;
  created_by: string;
  created_at: string;
}

export interface CompanyMembership {
  company: Company;
  role: CompanyRole;
}

interface CompanyContextType {
  companies: CompanyMembership[];
  activeCompany: Company | null;
  activeCompanyId: string | null;
  role: CompanyRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  loading: boolean;
  setActiveCompanyId: (id: string) => void;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

const ACTIVE_KEY = "activeCompanyId";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCompanies = useCallback(async () => {
    if (!user || !supabaseConfigured) {
      setCompanies([]);
      setActiveCompanyIdState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // company_members joined with companies via FK
      const { data, error } = await supabase
        .from("company_members")
        .select("role, status, company:companies(*)")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) {
        console.warn("[CompanyContext] erro ao buscar empresas:", error);
        setCompanies([]);
      } else {
        const mapped: CompanyMembership[] = ((data ?? []) as unknown as Array<{ role: string; company: Company | null }>)
          .filter((r) => r.company)
          .map((r) => ({ role: r.role as CompanyRole, company: r.company as Company }));
        setCompanies(mapped);

        const stored = userStorage.get(ACTIVE_KEY);
        const valid = stored && mapped.some((m) => m.company.id === stored);
        const next = valid ? stored : mapped[0]?.company.id ?? null;
        setActiveCompanyIdState(next);
        if (next) userStorage.set(ACTIVE_KEY, next);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refreshCompanies();
  }, [authLoading, user, refreshCompanies]);

  const setActiveCompanyId = useCallback((id: string) => {
    setActiveCompanyIdState(id);
    userStorage.set(ACTIVE_KEY, id);
  }, []);

  // Mantém o módulo Post for Me ciente da empresa ativa para enviar companyId no body.
  useEffect(() => {
    setPfmActiveCompany(activeCompanyId);
    setBlotatoActiveCompany(activeCompanyId);
    setFirecrawlActiveCompany(activeCompanyId);
    setHiggsfieldActiveCompany(activeCompanyId);
  }, [activeCompanyId]);



  const value = useMemo<CompanyContextType>(() => {
    const active = companies.find((c) => c.company.id === activeCompanyId) ?? null;
    const role = active?.role ?? null;
    return {
      companies,
      activeCompany: active?.company ?? null,
      activeCompanyId,
      role,
      isOwner: role === "owner",
      isAdmin: role === "admin",
      isEditor: role === "editor",
      loading,
      setActiveCompanyId,
      refreshCompanies,
    };
  }, [companies, activeCompanyId, loading, setActiveCompanyId, refreshCompanies]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
