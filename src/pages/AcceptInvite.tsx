import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { refreshCompanies, setActiveCompanyId } = useCompany();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Token ausente."); return; }
    if (authLoading) return;
    if (!user) {
      try { sessionStorage.setItem("pendingInviteToken", token); } catch { /* ignore */ }
      navigate(`/login?next=${encodeURIComponent(`/aceitar-convite?token=${token}`)}`, { replace: true });
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke("company-invite", {
        body: { action: "accept", token },
      });
      if (error || data?.error || !data?.companyId) {
        setStatus("error");
        setMessage(data?.error || error?.message || "Não foi possível aceitar o convite.");
        return;
      }
      await refreshCompanies();
      setActiveCompanyId(data.companyId);
      try { sessionStorage.removeItem("pendingInviteToken"); } catch { /* ignore */ }
      setStatus("ok");
      setTimeout(() => navigate("/dashboard", { replace: true }), 800);
    })();
  }, [token, user, authLoading, navigate, refreshCompanies, setActiveCompanyId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-8 text-center space-y-4">
        {status === "loading" && (<><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p>Aceitando convite…</p></>)}
        {status === "ok" && (<><h2 className="text-xl font-bold">Tudo certo!</h2><p className="text-sm text-muted-foreground">Levando você para o Dashboard…</p></>)}
        {status === "error" && (
          <>
            <h2 className="text-xl font-bold">Convite inválido</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button onClick={() => navigate("/dashboard")}>Voltar</Button>
          </>
        )}
      </Card>
    </div>
  );
}
