import { useState, useEffect, useCallback } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { getCreations, type Creation } from "@/lib/gallery";

export function useCreations() {
  const { activeCompanyId } = useCompany();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!activeCompanyId) {
      setCreations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCreations(activeCompanyId);
      setCreations(data || []);
    } catch (err) {
      console.error("Error loading creations:", err);
      setCreations([]);
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { creations, loading, reload };
}
