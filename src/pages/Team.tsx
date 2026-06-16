import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { canManageTeam, roleLabel, type CompanyRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { Copy, Loader2, Trash2, UserPlus, X } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: CompanyRole;
  status: string;
  created_at: string;
  email?: string;
}

interface Invite {
  id: string;
  email: string;
  role: "admin" | "editor";
  status: string;
  expires_at: string;
  created_at: string;
}

export default function Team() {
  const { user } = useAuth();
  const { activeCompanyId, activeCompany, role, isOwner } = useCompany();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!activeCompanyId) return;
    setLoading(true);
    const [m, i] = await Promise.all([
      supabase.from("company_members").select("id, user_id, role, status, created_at").eq("company_id", activeCompanyId),
      supabase.from("company_invites").select("id, email, role, status, expires_at, created_at").eq("company_id", activeCompanyId).eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    setMembers((m.data as Member[]) ?? []);
    setInvites((i.data as Invite[]) ?? []);
    setLoading(false);
  }, [activeCompanyId]);

  useEffect(() => { load(); }, [load]);

  if (!activeCompanyId) return <Navigate to="/criar-empresa" replace />;
  if (!canManageTeam(role)) {
    return (
      <div className="p-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Sem permissão</h2>
          <p className="text-sm text-muted-foreground">Apenas Dono e Admin podem gerenciar a equipe.</p>
        </Card>
      </div>
    );
  }

  const ownersCount = members.filter((m) => m.role === "owner" && m.status === "active").length;

  const canRemoveMember = (m: Member) => {
    if (m.user_id === user?.id) return false;
    if (m.role === "owner") return false;
    if (isOwner) return true;
    return m.role === "editor";
  };

  const removeMember = async (m: Member) => {
    if (m.role === "owner" && ownersCount <= 1) {
      toast({ title: "Não é possível remover o último Dono", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("company_members").delete().eq("id", m.id);
    if (error) toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    else { toast({ title: "Membro removido" }); load(); }
  };

  const copyLink = async (inviteId: string) => {
    const { data, error } = await supabase.functions.invoke("company-invite", {
      body: { action: "get_link", inviteId },
    });
    if (error || data?.error || !data?.inviteUrl) {
      toast({ title: "Erro ao obter link", description: error?.message || data?.error, variant: "destructive" });
      return;
    }
    await navigator.clipboard.writeText(data.inviteUrl);
    toast({ title: "Link copiado" });
  };

  const revokeInvite = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("company-invite", {
      body: { action: "revoke", inviteId: id },
    });
    if (error || data?.error) toast({ title: "Erro ao revogar", description: error?.message || data?.error, variant: "destructive" });
    else { toast({ title: "Convite revogado" }); load(); }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-sm text-muted-foreground">{activeCompany?.name}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Convidar membro
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Membros</h2>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID do usuário</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entrou em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.user_id === user?.id ? "Você" : `${m.user_id.slice(0, 8)}…`}</TableCell>
                  <TableCell><Badge variant={m.role === "owner" ? "default" : "secondary"}>{roleLabel(m.role)}</Badge></TableCell>
                  <TableCell>{m.status}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    {canRemoveMember(m) && (
                      <Button size="sm" variant="ghost" onClick={() => removeMember(m)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Convites pendentes</h2>
        </div>
        {invites.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum convite pendente.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell><Badge variant="secondary">{roleLabel(inv.role)}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(inv.expires_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => copyLink(inv.token)} title="Copiar link">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => revokeInvite(inv.id)} title="Revogar">
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} onCreated={load} />
    </div>
  );
}
