import { useMemo, useState } from "react";
import { Users, RefreshCw, Plus, Loader2, AlertCircle, Unlink, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ConnectAccountDialog } from "@/components/ConnectAccountDialog";
import { useApp } from "@/contexts/use-app";
import { useCompany } from "@/contexts/CompanyContext";
import { usePfmAccounts, useCompanyPfmAccounts } from "@/hooks/use-blotato";
import { ALL_PLATFORMS, PLATFORMS } from "@/lib/platforms";
import {
  pfmDisconnectAccount,
  linkSocialAccountToCompany,
  unlinkSocialAccountFromCompany,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Accounts() {
  const { accounts } = useApp();
  const { activeCompanyId, activeCompany } = useCompany();
  // All accounts in the owner's PFM key (used only to detect unlinked items)
  const allPfm = usePfmAccounts();
  // Accounts that are linked to the active company — source of truth for the UI
  const companyAccounts = useCompanyPfmAccounts(activeCompanyId);

  const [connectOpen, setConnectOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkSelection, setLinkSelection] = useState<Record<string, boolean>>({});
  const [linking, setLinking] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyAccountIds = useMemo(
    () => new Set((companyAccounts.data ?? []).map((a) => a.id)),
    [companyAccounts.data]
  );
  const unlinkedFromActive = useMemo(
    () => (allPfm.data ?? []).filter((a) => !companyAccountIds.has(a.id)),
    [allPfm.data, companyAccountIds]
  );

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["pfm", "accounts"] });
    queryClient.invalidateQueries({ queryKey: ["company", "social-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["company", "pfm-accounts"] });
  };

  const handleDisconnect = async (pfmId: string, platform: string, platformName: string) => {
    if (!activeCompanyId) return;
    if (!confirm(`Remover esta conta de ${platformName} desta empresa?\n\nA conta permanece conectada e disponível para outras empresas suas.`)) return;
    setDisconnectingId(pfmId);
    try {
      await unlinkSocialAccountFromCompany(activeCompanyId, pfmId);
      refreshAll();
      toast({ title: `${platformName} removido desta empresa` });
    } catch (err) {
      toast({ title: "Erro ao remover", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleRevoke = async (pfmId: string, platformName: string) => {
    if (!confirm(`Desconectar a conta de ${platformName} de TODAS as empresas e revogar o acesso?`)) return;
    setDisconnectingId(pfmId);
    try {
      await pfmDisconnectAccount(pfmId);
      refreshAll();
      toast({ title: `${platformName} desconectado` });
    } catch (err) {
      toast({ title: "Erro ao desconectar", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setDisconnectingId(null);
    }
  };

  const openLinkDialog = () => {
    setLinkSelection({});
    setLinkOpen(true);
  };

  const handleConfirmLink = async () => {
    if (!activeCompanyId) return;
    const toLink = (allPfm.data ?? []).filter((a) => linkSelection[a.id]);
    if (toLink.length === 0) {
      setLinkOpen(false);
      return;
    }
    setLinking(true);
    try {
      for (const a of toLink) {
        await linkSocialAccountToCompany(
          activeCompanyId,
          a.id,
          a.platform,
          a.username,
          a.name || undefined
        );
      }
      refreshAll();
      toast({ title: `${toLink.length} conta(s) vinculada(s) a ${activeCompany?.name ?? "esta empresa"}` });
      setLinkOpen(false);
    } catch (err) {
      toast({ title: "Erro ao vincular", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setLinking(false);
    }
  };

  const isLoading = allPfm.isLoading || companyAccounts.isLoading;
  const isFetching = allPfm.isFetching || companyAccounts.isFetching;
  const isError = allPfm.isError || companyAccounts.isError;
  const errorMsg = allPfm.error?.message || companyAccounts.error?.message;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6 text-violet-500" />
            Contas Conectadas
          </h1>
          <p className="mt-1 text-muted-foreground">
            {activeCompany ? <>Redes de <span className="font-medium">{activeCompany.name}</span></> : "Selecione uma empresa"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
          {unlinkedFromActive.length > 0 && (
            <Button variant="outline" size="sm" onClick={openLinkDialog}>
              <Link2 className="mr-2 h-4 w-4" />
              Vincular existente ({unlinkedFromActive.length})
            </Button>
          )}
          <Button
            size="sm"
            className="bg-gradient-to-r from-violet-600 to-fuchsia-500"
            onClick={() => setConnectOpen(true)}
            disabled={!activeCompanyId}
          >
            <Plus className="mr-2 h-4 w-4" />
            Conectar Rede
          </Button>
        </div>
      </div>

      {/* Connect Dialog */}
      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />

      {/* Backfill banner */}
      {unlinkedFromActive.length > 0 && (companyAccounts.data?.length ?? 0) === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Esta empresa ainda não tem nenhuma rede social vinculada
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {unlinkedFromActive.length} conta(s) estão disponíveis na sua chave do Post for Me mas não pertencem a nenhuma empresa.
              Vincule as que devem aparecer aqui — as outras continuam invisíveis nesta empresa.
            </p>
          </div>
          <Button size="sm" onClick={openLinkDialog}>Vincular agora</Button>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Erro ao carregar contas</p>
            <p className="mt-1 text-xs">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-5">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Connected accounts in this company */}
      {!isLoading && (companyAccounts.data?.length ?? 0) > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-green-600">
            Vinculadas a esta empresa ({companyAccounts.data!.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companyAccounts.data!.map((account) => {
              const cfg = PLATFORMS[account.platform as keyof typeof PLATFORMS];
              return (
                <Card key={account.id} className="border-green-500/30">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white text-xl shadow-lg ${cfg?.bgColor ?? "bg-gray-500"}`}>
                      {cfg?.icon ?? "🌐"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{cfg?.name ?? account.platform}</h3>
                        <Badge className="bg-green-500/10 text-green-600 text-[10px]">ativo</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {account.username ? `@${account.username}` : account.name || "—"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        title="Remover desta empresa"
                        disabled={disconnectingId === account.id}
                        onClick={() => handleDisconnect(account.id, account.platform, cfg?.name ?? account.platform)}
                      >
                        {disconnectingId === account.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Unlink className="h-4 w-4" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        title="Desconectar de todas as empresas"
                        disabled={disconnectingId === account.id}
                        onClick={() => handleRevoke(account.id, cfg?.name ?? account.platform)}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Platforms */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Todas as Redes Disponíveis</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_PLATFORMS.map((platform) => {
            const cfg = PLATFORMS[platform];
            const connected = (companyAccounts.data ?? []).find((a) => a.platform === platform)
              || accounts.find((a) => a.platform === platform);
            const isConnected = !!(companyAccounts.data ?? []).find((a) => a.platform === platform);
            return (
              <Card key={platform} className={isConnected ? "border-green-500/30" : "border-dashed"}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-white text-lg ${cfg.bgColor}`}>{cfg.icon}</div>
                    <div>
                      <CardTitle className="text-base">{cfg.name}</CardTitle>
                      <CardDescription>Máx: {cfg.maxChars.toLocaleString()} caracteres</CardDescription>
                    </div>
                    {isConnected && <Badge className="ml-auto bg-green-500/10 text-green-600">conectado</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {cfg.features.map((f) => (
                      <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                  {isConnected && connected ? (
                    <p className="mt-3 text-sm text-green-600">@{(connected as any).username || (connected as any).fullname || (connected as any).name}</p>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full border-dashed"
                      onClick={() => setConnectOpen(true)}
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Conectar {cfg.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Link existing dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular contas existentes</DialogTitle>
            <DialogDescription>
              Selecione as contas que pertencem a <span className="font-medium">{activeCompany?.name}</span>.
              Você pode vincular a mesma conta em mais de uma empresa, se quiser.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto py-2">
            {unlinkedFromActive.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma conta disponível para vincular.</p>
            )}
            {unlinkedFromActive.map((a) => {
              const cfg = PLATFORMS[a.platform as keyof typeof PLATFORMS];
              return (
                <label key={a.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-accent/50">
                  <Checkbox
                    checked={!!linkSelection[a.id]}
                    onCheckedChange={(v) => setLinkSelection((s) => ({ ...s, [a.id]: !!v }))}
                  />
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-white text-base ${cfg?.bgColor ?? "bg-gray-500"}`}>
                    {cfg?.icon ?? "🌐"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cfg?.name ?? a.platform}</p>
                    <p className="text-xs text-muted-foreground truncate">@{a.username || a.name}</p>
                  </div>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkOpen(false)} disabled={linking}>Cancelar</Button>
            <Button onClick={handleConfirmLink} disabled={linking || Object.values(linkSelection).every((v) => !v)}>
              {linking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Vincular selecionadas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
