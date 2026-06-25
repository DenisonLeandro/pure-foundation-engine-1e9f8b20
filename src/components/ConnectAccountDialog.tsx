/**
 * ConnectAccountDialog — reescrito completamente
 *
 * Problemas da versão anterior:
 * 1. Popup fecha ao redirecionar para callback (comportamento normal do OAuth)
 *    mas o código interpretava isso como "usuário cancelou" → parava o polling
 * 2. Race condition: backend ainda processando quando o poll cancelava
 * 3. Sem fallback para popup bloqueado
 *
 * Solução:
 * - Polling é independente do estado do popup
 * - Popup fecha → continua polling por até 2 min
 * - Cancelamento só acontece por ação explícita do usuário
 * - Link direto como fallback se popup bloqueado
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, CheckCircle2, Link2, RefreshCw, AlertCircle,
  XCircle, ExternalLink, Unlink, Info,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { useQueryClient } from "@tanstack/react-query";
import { ALL_PLATFORMS, PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/types";
import * as api from "@/lib/api";
import { companyStorage } from "@/lib/companyStorage";

// ─── Constantes ────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120_000; // 2 minutos
const PROFILE_URLS_KEY = "profile_urls";

const PROFILE_URL_PLACEHOLDERS: Record<string, string> = {
  instagram: "https://instagram.com/seu_usuario",
  twitter:   "https://x.com/seu_usuario",
  facebook:  "https://facebook.com/sua_pagina",
  linkedin:  "https://linkedin.com/in/seu-perfil",
  tiktok:    "https://tiktok.com/@seu_usuario",
  youtube:   "https://youtube.com/@seu_canal",
  pinterest: "https://pinterest.com/seu_usuario",
  threads:   "https://threads.net/@seu_usuario",
  bluesky:   "https://bsky.app/profile/seu.handle",
};

// ─── Helpers localStorage (escopo por empresa) ──────────────────

function loadProfileUrls(companyId: string | null): Record<string, string> {
  try { return JSON.parse(companyStorage.get(companyId, PROFILE_URLS_KEY) || "{}"); }
  catch { return {}; }
}
function saveProfileUrls(companyId: string | null, urls: Record<string, string>) {
  companyStorage.set(companyId, PROFILE_URLS_KEY, JSON.stringify(urls));
}


// ─── Props ─────────────────────────────────────────────────────

interface ConnectAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Componente ────────────────────────────────────────────────

export function ConnectAccountDialog({ open, onOpenChange }: ConnectAccountDialogProps) {
  const { toast } = useToast();
  const { activeCompanyId } = useCompany();
  const queryClient = useQueryClient();

  // ── Estado ────────────────────────────────────────────────────
  const [accounts, setAccounts]       = useState<api.PfmAccount[]>([]);
  const [linkedIds, setLinkedIds]     = useState<Set<string>>(new Set());
  const [loading, setLoading]         = useState(false);
  const [connecting, setConnecting]   = useState<Platform | null>(null);
  const [authUrl, setAuthUrl]         = useState<string | null>(null);   // fallback link
  const [error, setError]             = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [profileUrls, setProfileUrls] = useState<Record<string, string>>(() => loadProfileUrls(activeCompanyId));

  // Bluesky
  const [bskyHandle, setBskyHandle]     = useState("");
  const [bskyPassword, setBskyPassword] = useState("");
  const [bskyError, setBskyError]       = useState<string | null>(null);

  // Refs
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // knownIds = PFM accounts JÁ vinculados à empresa ativa. Quando o polling
  // detecta um PFM account fora desse set, ele é vinculado à empresa atual.
  const knownIdsRef     = useRef<Set<string>>(new Set());
  const popupRef        = useRef<Window | null>(null);

  // ── Parar polling ─────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (pollTimeoutRef.current)  { clearTimeout(pollTimeoutRef.current);   pollTimeoutRef.current = null; }
  }, []);

  // ── Carregar contas (PFM + vínculos da empresa) ───────────────
  const loadAccounts = useCallback(async (): Promise<{ accs: api.PfmAccount[]; linked: Set<string> }> => {
    try {
      const [accs, links] = await Promise.all([
        api.pfmListAccounts(),
        activeCompanyId
          ? api.listCompanySocialAccounts(activeCompanyId).catch(() => [])
          : Promise.resolve([] as Awaited<ReturnType<typeof api.listCompanySocialAccounts>>),
      ]);
      const linked = new Set(links.map((l) => l.pfm_account_id));
      setAccounts(accs);
      setLinkedIds(linked);
      return { accs, linked };
    } catch { return { accs: [], linked: new Set<string>() }; }
  }, [activeCompanyId]);

  // ── Inicializar ao abrir ───────────────────────────────────────
  useEffect(() => {
    if (open) {
      setConnecting(null);
      setError(null);
      setAuthUrl(null);
      setLoading(true);
      setProfileUrls(loadProfileUrls(activeCompanyId));
      loadAccounts().then(({ accs }) => {
        // Snapshot de TODOS os ids PFM no momento da abertura — usado para
        // distinguir "conta nova autorizada agora" de "conta já existente no PFM".
        knownIdsRef.current = new Set(accs.map((a) => a.id));
        setLoading(false);
      });
    } else {
      stopPolling();
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    }
    return stopPolling;
  }, [open, activeCompanyId, loadAccounts, stopPolling]);

  // ── Iniciar polling ────────────────────────────────────────────
  // Polling corre INDEPENDENTE do popup. O popup fecha ao redirecionar
  // para o callback (comportamento normal do OAuth), mas o polling
  // continua até detectar nova conta ou timeout.
  const startPolling = useCallback((platform: Platform) => {
    stopPolling();

    pollIntervalRef.current = setInterval(async () => {
      const { accs, linked } = await loadAccounts();
      const apiPlatform = platform === "twitter" ? "x" : platform;

      // Candidatos: contas PFM dessa plataforma que NÃO estão vinculadas à empresa ativa.
      const candidates = accs.filter(
        (a) => (a.platform === apiPlatform || a.platform === platform) && !linked.has(a.id)
      );

      // Preferência: conta nova no PFM (não existia antes do click).
      let target = candidates.find((a) => !knownIdsRef.current.has(a.id));

      // Fallback: usuário reautorizou uma conta já existente no PFM para esta empresa
      // (caso típico: a conta foi conectada antes em OUTRA empresa do mesmo dono).
      // Só aceitamos esse fallback depois que o popup já fechou, para evitar
      // vincular automaticamente sem o usuário concluir o OAuth.
      if (!target && popupRef.current && popupRef.current.closed && candidates.length > 0) {
        target = candidates[0];
      }

      if (target) {
        const newAcc = target;
        stopPolling();
        knownIdsRef.current.add(newAcc.id);

        const pfmPlatform = (newAcc.platform === "x" ? "twitter" : newAcc.platform) as Platform;
        const cfg = PLATFORMS[pfmPlatform] || { name: newAcc.platform };

        // Vincula à empresa ativa (idempotente via upsert).
        if (activeCompanyId) {
          try {
            await api.linkSocialAccountToCompany(
              activeCompanyId,
              newAcc.id,
              newAcc.platform,
              newAcc.username,
              newAcc.name || undefined
            );
            queryClient.invalidateQueries({ queryKey: ["company", "social-accounts"] });
            queryClient.invalidateQueries({ queryKey: ["company", "pfm-accounts"] });
            queryClient.invalidateQueries({ queryKey: ["company", "pfm-posts"] });
            await loadAccounts();
          } catch (err) {
            console.error("[ConnectAccountDialog] Erro ao linkar conta à empresa:", err);
          }
        }

        toast({
          title: `${cfg.name} conectado!`,
          description: `@${newAcc.username || newAcc.name || "conta vinculada"}`,
        });

        setConnecting(null);
        setAuthUrl(null);
        setError(null);
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      }
    }, POLL_INTERVAL_MS);

    // Timeout máximo de 2 minutos
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      if (connecting === platform) {
        setConnecting(null);
        setAuthUrl(null);
        setError(
          `Timeout: conexão com ${PLATFORMS[platform]?.name ?? platform} não detectada em 2 minutos. ` +
          "Tente novamente ou verifique se autorizou corretamente."
        );
      }
    }, POLL_TIMEOUT_MS);
  }, [stopPolling, loadAccounts, toast, connecting, activeCompanyId, queryClient]);

  // ── Conectar plataforma ────────────────────────────────────────
  const handleConnect = useCallback(async (platform: Platform) => {
    setConnecting(platform);
    setError(null);
    setAuthUrl(null);

    try {
      const apiPlatform = platform === "twitter" ? "x" : platform;

      // ── Bluesky (auth direta, sem OAuth) ──────────────────────
      if (platform === "bluesky") {
        if (!bskyHandle || !bskyPassword) {
          setBskyError("Preencha o handle e o app password");
          setConnecting(null);
          return;
        }
        if (!bskyHandle.includes(".")) {
          setBskyError("Handle deve conter um ponto (ex: usuario.bsky.social)");
          setConnecting(null);
          return;
        }
        setBskyError(null);
        await api.callPfmDirect("pfm_auth_url", {
          platform: "bluesky",
          handle: bskyHandle,
          app_password: bskyPassword,
        });
        const { accs } = await loadAccounts();
        knownIdsRef.current = new Set(accs.map((a) => a.id));

        // Link Bluesky account to company
        const bskyAcc = accs.find((a) => a.platform === "bluesky" && a.username === bskyHandle);
        if (bskyAcc && activeCompanyId) {
          try {
            await api.linkSocialAccountToCompany(
              activeCompanyId,
              bskyAcc.id,
              "bluesky",
              bskyHandle,
              bskyAcc.name || undefined
            );
            queryClient.invalidateQueries({ queryKey: ["company", "social-accounts"] });
          } catch (err) {
            console.error("[ConnectAccountDialog] Erro ao linkar Bluesky à empresa:", err);
          }
        }

        setConnecting(null);
        toast({ title: "Bluesky conectado!" });
        return;
      }

      // ── OAuth (todas as redes) ────────────────────────────────
      const url = await api.pfmAuthUrl(apiPlatform);

      if (!url) {
        setError("Não foi possível gerar o link de autenticação.");
        setConnecting(null);
        return;
      }

      // Abrir popup centrado
      const W = 620, H = 720;
      const left = Math.round(window.screenX + (window.outerWidth  - W) / 2);
      const top  = Math.round(window.screenY + (window.outerHeight - H) / 2);
      const popup = window.open(
        url,
        `pfm_oauth_${platform}_${Date.now()}`,
        `width=${W},height=${H},left=${left},top=${top},` +
        `toolbar=0,menubar=0,scrollbars=1,resizable=1,location=1`
      );

      if (!popup || popup.closed) {
        // Popup bloqueado → mostrar link direto
        setAuthUrl(url);
        toast({
          title: "Popup bloqueado",
          description: "Use o link direto abaixo para autorizar.",
        });
        startPolling(platform);
        return;
      }

      popupRef.current = popup;
      popup.focus();

      // Iniciar polling — independente do popup fechar ou não
      startPolling(platform);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao conectar. Tente novamente.";
      if (/social provider app credentials not found/i.test(msg)) {
        setError(
          `O Post for Me ainda não tem as credenciais OAuth do ${PLATFORMS[platform]?.name ?? platform} configuradas. ` +
          `Acesse app.postforme.dev → Settings → Social Providers e cadastre o app (Client ID/Secret) dessa rede antes de conectar.`
        );
      } else {
        setError(msg);
      }
      setConnecting(null);
    }
  }, [bskyHandle, bskyPassword, loadAccounts, startPolling, toast]);

  // ── Cancelar conexão em andamento ─────────────────────────────
  const handleCancel = useCallback(() => {
    stopPolling();
    setConnecting(null);
    setAuthUrl(null);
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
  }, [stopPolling]);

  // ── Desconectar conta ─────────────────────────────────────────
  const handleDisconnect = useCallback(async (account: api.PfmAccount) => {
    if (!confirm(`Desconectar ${PLATFORMS[account.platform as Platform]?.name ?? account.platform}?`)) return;
    setDisconnecting(account.id);
    try {
      await api.pfmDisconnectAccount(account.id);
      // Also remove from company_social_accounts
      if (activeCompanyId) {
        try {
          await api.unlinkSocialAccountFromCompany(activeCompanyId, account.id);
        } catch (e) {
          console.warn("[ConnectAccountDialog] Erro ao remover de company_social_accounts:", e);
        }
      }
      const accs = await loadAccounts();
      knownIdsRef.current = new Set(accs.map((a) => a.id));
      queryClient.invalidateQueries({ queryKey: ["company", "social-accounts"] });
      toast({ title: "Conta desconectada" });
    } catch (err) {
      toast({ title: "Erro ao desconectar", description: err instanceof Error ? err.message : "", variant: "destructive" });
    } finally {
      setDisconnecting(null);
    }
  }, [loadAccounts, toast, activeCompanyId, queryClient]);

  // ── Computed ──────────────────────────────────────────────────
  const connectedMap = new Map(
    accounts.map((a) => [(a.platform === "x" ? "twitter" : a.platform) as Platform, a])
  );

  const updateProfileUrl = (platform: string, url: string) => {
    const updated = { ...profileUrls, [platform]: url };
    setProfileUrls(updated);
    saveProfileUrls(activeCompanyId, updated);
  };


  // ── Render ────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); onOpenChange(v); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-violet-500" />
            Conectar Redes Sociais
          </DialogTitle>
          <DialogDescription>
            Clique em Conectar e autorize na janela que abrirá. A detecção é automática.
          </DialogDescription>
        </DialogHeader>

        {/* ── Banner de erro ────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Banner de link direto (popup bloqueado) ───────────── */}
        {authUrl && connecting && (
          <div className="rounded-lg border border-violet-500/40 bg-violet-500/5 p-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-violet-500" />
              Popup bloqueado — clique no link abaixo para autorizar
            </p>
            <a
              href={authUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:underline font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir autorização do {PLATFORMS[connecting]?.name ?? connecting}
            </a>
            <p className="text-xs text-muted-foreground">
              Após autorizar, esta tela detecta automaticamente. Aguarde até 2 minutos.
            </p>
          </div>
        )}

        {/* ── Status de conexão em andamento ────────────────────── */}
        {connecting && (
          <div className="flex items-center justify-between rounded-lg border border-violet-500/30 bg-violet-500/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-violet-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Aguardando autorização do {PLATFORMS[connecting]?.name ?? connecting}…
            </div>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs">
              Cancelar
            </Button>
          </div>
        )}

        {/* ── Lista de plataformas ──────────────────────────────── */}
        <div className="space-y-2">
          {ALL_PLATFORMS.map((platform) => {
            const cfg        = PLATFORMS[platform];
            const account    = connectedMap.get(platform);
            const isConnected = !!account;
            const isConnecting = connecting === platform;
            const isBluesky  = platform === "bluesky";
            const isDisconnecting = disconnecting === account?.id;

            return (
              <div key={platform} className="space-y-1">
                {/* ── Card da plataforma ───────────────────────── */}
                <div className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  isConnected
                    ? "border-green-500/40 bg-green-500/5"
                    : isConnecting
                    ? "border-violet-500/40 bg-violet-500/5"
                    : "border-border hover:border-violet-500/30 hover:bg-muted/30"
                }`}>
                  {/* Ícone */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-lg shadow-sm ${cfg.bgColor}`}>
                    {cfg.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">{cfg.name}</p>
                    </div>
                    {isConnected && account ? (
                      <p className="text-xs text-green-600 truncate">
                        ✓ {account.username ? `@${account.username}` : account.name || "conectado"}
                      </p>
                    ) : isConnecting ? (
                      <p className="text-xs text-violet-500">Aguardando autorização…</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{cfg.maxChars.toLocaleString()} chars máx.</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                          disabled={!!connecting || isDisconnecting}
                          onClick={() => handleConnect(platform)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reconectar
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          disabled={!!connecting || isDisconnecting}
                          onClick={() => handleDisconnect(account)}
                          title="Desconectar"
                        >
                          {isDisconnecting
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Unlink className="h-3.5 w-3.5" />}
                        </Button>
                      </>
                    ) : isBluesky ? null : (
                      <Button
                        size="sm"
                        disabled={!!connecting || isDisconnecting}
                        className={`${isConnecting ? "opacity-50" : "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600"} text-white shadow-sm`}
                        onClick={() => handleConnect(platform)}
                      >
                        {isConnecting
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : "Conectar"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* ── Bluesky: form especial ───────────────────── */}
                {isBluesky && !isConnected && (
                  <div className="ml-[52px] space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Handle</Label>
                        <Input
                          placeholder="usuario.bsky.social"
                          value={bskyHandle}
                          onChange={(e) => { setBskyHandle(e.target.value); setBskyError(null); }}
                          className={`h-8 text-xs ${bskyError ? "border-destructive" : ""}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">App Password</Label>
                        <Input
                          type="password"
                          placeholder="xxxx-xxxx-xxxx-xxxx"
                          value={bskyPassword}
                          onChange={(e) => setBskyPassword(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    {bskyError && <p className="text-[10px] text-destructive">{bskyError}</p>}
                    <Button
                      size="sm"
                      disabled={!!connecting || !bskyHandle || !bskyPassword}
                      className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
                      onClick={() => handleConnect("bluesky")}
                    >
                      {connecting === "bluesky" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                      Conectar Bluesky
                    </Button>
                  </div>
                )}

                {/* ── URL de perfil para analytics ─────────────── */}
                {isConnected && !isBluesky && (
                  <div className="ml-[52px]">
                    <Input
                      placeholder={PROFILE_URL_PLACEHOLDERS[platform] || "URL do perfil (para analytics)"}
                      value={profileUrls[platform] || ""}
                      onChange={(e) => updateProfileUrl(platform, e.target.value)}
                      className="h-7 text-[11px] border-dashed"
                    />
                    <p className="text-[9px] text-muted-foreground mt-0.5 pl-0.5">
                      URL do perfil público — necessário para o painel de analytics
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {connectedMap.size} de {ALL_PLATFORMS.length} redes conectadas
            </span>
            {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => { setLoading(true); loadAccounts().then(() => setLoading(false)); }}
            >
              {loading
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <RefreshCw className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
              onClick={() => { handleCancel(); onOpenChange(false); }}
            >
              Concluído
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
