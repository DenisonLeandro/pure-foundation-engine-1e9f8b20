import { useState, useEffect, useCallback } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { getCreations, type Creation } from "@/lib/gallery";
import { getErrorMessage } from "@/lib/errors";

export function useCreations() {
  const { activeCompanyId } = useCompany();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!activeCompanyId) {
      setCreations([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCreations(activeCompanyId);
      setCreations(data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading creations:", err);
      setCreations([]);
      setError(getErrorMessage(err, "Erro ao carregar a galeria"));
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { creations, loading, error, reload };
}
