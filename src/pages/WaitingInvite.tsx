import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Loader2, LogOut, RefreshCw, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/lib/supabase";
import { AnimatedBackground } from "@/components/AnimatedBackground";

type PendingInvite = { id: string; company_id: string; role: string; created_at: string };

export default function WaitingInvite() {
  const { user, signOut } = useAuth();
  const { companies, refreshCompanies } = useCompany();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("company_invites")
        .select("id, company_id, role, created_at")
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending");
      setInvites((data as PendingInvite[]) || []);
      await refreshCompanies();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.email]);

  // Se já está em alguma empresa, manda para o dashboard
  useEffect(() => {
    if (companies.length > 0) navigate("/dashboard", { replace: true });
  }, [companies.length, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <AnimatedBackground />
      <Card className="w-full max-w-lg border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
            <Inbox className="h-7 w-7" />
          </div>
          <CardTitle className="mt-4">Aguardando convite</CardTitle>
          <CardDescription>
            Sua conta de funcionário está pronta. Peça ao dono da empresa para te convidar usando o email abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{user?.email}</span>
          </div>

          {invites.length > 0 ? (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 text-sm">
              <p className="font-medium text-violet-600 dark:text-violet-400">
                Você tem {invites.length} convite{invites.length > 1 ? "s" : ""} pendente{invites.length > 1 ? "s" : ""}.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Abra o link do convite enviado pelo dono para entrar na empresa.
              </p>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Nenhum convite recebido ainda. Atualize esta página quando o dono enviar o convite.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1 gap-2" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Atualizar
            </Button>
            <Button
              variant="ghost"
              className="flex-1 gap-2 text-muted-foreground hover:text-destructive"
              onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
