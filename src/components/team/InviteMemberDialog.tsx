import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCompany } from "@/contexts/CompanyContext";
import { invitableRoles, roleLabel } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Copy, Loader2, Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function InviteMemberDialog({ open, onOpenChange, onCreated }: Props) {
  const { activeCompanyId, role } = useCompany();
  const allowedRoles = invitableRoles(role);
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState<"admin" | "editor">(allowedRoles[0] ?? "editor");
  const [submitting, setSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEmail("");
    setTargetRole(allowedRoles[0] ?? "editor");
    setInviteUrl(null);
    setEmailSent(null);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompanyId) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("company-invite", {
      body: { action: "create", companyId: activeCompanyId, email: email.trim(), role: targetRole },
    });
    setSubmitting(false);
    if (error || !data?.inviteUrl) {
      toast({ title: "Erro ao criar convite", description: error?.message || data?.error, variant: "destructive" });
      return;
    }
    setInviteUrl(data.inviteUrl);
    setEmailSent(!!data.emailSent);
    onCreated?.();
  };

  const copy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>O convite expira em 7 dias.</DialogDescription>
        </DialogHeader>

        {!inviteUrl ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="pessoa@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Papel</Label>
              <Select value={targetRole} onValueChange={(v) => setTargetRole(v as "admin" | "editor")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allowedRoles.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting || allowedRoles.length === 0}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar convite"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-sm">
              {emailSent
                ? <p>Convite enviado para <strong>{email}</strong>. Você também pode copiar o link abaixo.</p>
                : <p className="text-muted-foreground">Envio por email não está configurado. Compartilhe o link abaixo manualmente.</p>}
            </div>
            <div className="flex gap-2">
              <Input readOnly value={inviteUrl} onFocus={(e) => e.currentTarget.select()} />
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
