/**
 * Carregamento centralizado dos perfis de marca (brand_profiles).
 * Marca pertence à empresa ativa — membros ativos veem; Dono/Admin gerenciam.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { normalizeBrand, type BrandProfile } from "@/lib/brand";
import { getErrorMessage } from "@/lib/errors";

export function useBrands() {
  const { activeCompanyId } = useCompany();
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!activeCompanyId) {
      setBrands([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("company_id", activeCompanyId)
      .order("is_default", { ascending: false });
    if (dbError) {
      console.error("[useBrands] erro ao carregar marcas:", dbError);
      setError(getErrorMessage(dbError, "Erro ao carregar marcas"));
    } else {
      setBrands((data || []).map((d) => normalizeBrand(d as Record<string, unknown>)));
      setError(null);
    }
    setLoading(false);
  }, [activeCompanyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const defaultBrand = brands.find((b) => b.is_default) || brands[0] || null;

  return { brands, defaultBrand, loading, error, reload };
}
