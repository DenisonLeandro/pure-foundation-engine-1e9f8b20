/**
 * Carregamento centralizado dos perfis de marca (brand_profiles).
 * Marca pertence à empresa ativa — membros ativos veem; Dono/Admin gerenciam.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { normalizeBrand, type BrandProfile } from "@/lib/brand";

export function useBrands() {
  const { activeCompanyId } = useCompany();
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!activeCompanyId) {
      setBrands([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("company_id", activeCompanyId)
      .order("is_default", { ascending: false });
    if (!error) {
      setBrands((data || []).map((d) => normalizeBrand(d as Record<string, unknown>)));
    }
    setLoading(false);
  }, [activeCompanyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const defaultBrand = brands.find((b) => b.is_default) || brands[0] || null;

  return { brands, defaultBrand, loading, reload };
}
