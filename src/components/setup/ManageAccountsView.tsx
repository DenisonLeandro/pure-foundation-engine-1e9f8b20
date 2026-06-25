import { useState } from "react";
import { Loader2, Plus, RefreshCw, Unlink, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectAccountDialog } from "@/components/ConnectAccountDialog";
import { useCompanyPfmAccounts } from "@/hooks/use-blotato";
import { useCompany } from "@/contexts/CompanyContext";
import { PLATFORMS } from "@/lib/platforms";
import { unlinkSocialAccountFromCompany } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function ManageAccountsView() {
  const { activeCompanyId } = useCompany();
  const pfmAccountsQuery = useCompanyPfmAccounts(activeCompanyId);
  const [connectOpen, setConnectOpen] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDisconnect = async (pfmId: string, platformName: string) => {
    if (!activeCompanyId) return;
    if (!confirm(`Remover ${platformName} desta empresa?`)) return;
    setDisconnectingId(pfmId);
    try {
      await unlinkSocialAccountFromCompany(activeCompanyId, pfmId);
      queryClient.invalidateQueries({ queryKey: ["company"] });
      toast({ title: `${platformName} removido` });
    } catch (err) {

      toast({ title: "Erro ao desconectar", description: err instanceof Error ? err.message : "", variant: "destructive" });
    } finally {
      setDisconnectingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Contas conectadas</h2>
          <p className="text-xs text-muted-foreground">Gerencie suas redes sociais conectadas via Post for Me.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => pfmAccountsQuery.refetch()} disabled={pfmAccountsQuery.isFetching}>
            {pfmAccountsQuery.isFetching ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
            Atualizar
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-500" onClick={() => setConnectOpen(true)}>
            <Plus className="mr-2 h-3.5 w-3.5" /> Conectar rede
          </Button>
        </div>
      </div>

      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />

      {pfmAccountsQuery.isError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Erro ao carregar contas</p>
            <p className="mt-0.5 text-xs">{pfmAccountsQuery.error?.message}</p>
          </div>
        </div>
      )}

      {pfmAccountsQuery.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!pfmAccountsQuery.isLoading && (pfmAccountsQuery.data?.length ?? 0) === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma conta conectada ainda. Clique em "Conectar rede" para começar.
          </CardContent>
        </Card>
      )}

      {(pfmAccountsQuery.data?.length ?? 0) > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {pfmAccountsQuery.data!.map((account) => {
            const cfg = PLATFORMS[account.platform as keyof typeof PLATFORMS];
            return (
              <Card key={account.id} className="border-green-500/30">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-white text-lg shadow ${cfg?.bgColor ?? "bg-gray-500"}`}>
                    {cfg?.icon ?? "🌐"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{cfg?.name ?? account.platform}</h3>
                      <Badge className="bg-green-500/10 text-green-600 text-[10px]">ativo</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {account.username ? `@${account.username}` : account.name || "—"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    disabled={disconnectingId === account.id}
                    onClick={() => handleDisconnect(account.id, cfg?.name ?? account.platform)}
                  >
                    {disconnectingId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
