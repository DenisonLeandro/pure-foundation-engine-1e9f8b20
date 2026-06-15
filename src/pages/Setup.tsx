import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Zap, ArrowRight, ArrowLeft, Loader2, AlertCircle, Link2,
  CheckCircle2, Image, BarChart3, Palette, Info, Film, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/use-app";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { getUser, validatePfmKey, validateApifyToken, validateHiggsFieldKey, validateFirecrawlKey, validatePexelsKey } from "@/lib/api";
import { ConnectAccountDialog } from "@/components/ConnectAccountDialog";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { SecretInput } from "@/components/setup/SecretInput";
import { STEPS } from "@/components/setup/steps";
import { SettingsShell } from "@/components/setup/SettingsShell";

// ─── Componente principal ────────────────────────────────────────

export default function Setup() {
  const {
    config,
    isConfigured,
    onboardingCompleted,
    configLoading,
    completeOnboarding,
    saveConfigToDb,
    saveIntegrationKeys,
    resetConfig,
  } = useApp();
  const { user } = useAuth();
  const { isEditor, loading: companyLoading } = useCompany();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isWizardMode = searchParams.get("wizard") === "1";
  const isManageMode = !isWizardMode;

  // Bloqueia Editor: somente Dono/Admin podem gerenciar integrações.
  useEffect(() => {
    if (companyLoading) return;
    if (isEditor) {
      toast({
        title: "Acesso restrito",
        description: "Apenas Dono ou Admin podem gerenciar integrações.",
        variant: "destructive",
      });
      navigate("/dashboard", { replace: true });
    }
  }, [companyLoading, isEditor, navigate, toast]);

  // Reset demo: se ?reset=1 na URL, limpa tudo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      resetConfig();
      window.history.replaceState({}, "", "/setup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (configLoading) return;
    const id = window.requestAnimationFrame(() => setBootReady(true));
    return () => window.cancelAnimationFrame(id);
  }, [configLoading]);

  const [step, setStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);
  const [bootReady, setBootReady] = useState(false);

  // Inputs SEMPRE vazios. Nenhuma chave salva trafega pelo navegador.
  const [blotatoKey, setBlotatoKey]     = useState("");
  const [pfmKey, setPfmKey]             = useState("");
  const [pexelsKey, setPexelsKey]       = useState("");
  const [apifyToken, setApifyToken]     = useState("");
  const [hfApiId, setHfApiId]           = useState("");
  const [hfApiSecret, setHfApiSecret]   = useState("");
  const [firecrawlKey, setFirecrawlKey] = useState("");
  const [brandName, setBrandName]       = useState(config.brandName || "");
  const didSyncLoadedConfig = useRef(false);

  const status = config.integrations;

  useEffect(() => {
    if (configLoading || didSyncLoadedConfig.current) return;
    didSyncLoadedConfig.current = true;
    setBrandName(config.brandName || "");

    if (!isManageMode) {
      if (!status.postforme) setStep(1);
      else if (!onboardingCompleted) setStep(8);
    }
  }, [configLoading, config, isManageMode, onboardingCompleted, status.postforme]);

  // ── Step 1: Validar Blotato ──────────────────────────────────
  const handleValidateBlotato = async () => {
    if (!blotatoKey.trim()) return;
    setIsValidating(true);
    setError("");
    try {
      const u = await getUser(blotatoKey.trim());
      if (u.subscriptionStatus !== "active") {
        setError("Assinatura Blotato não está ativa.");
        return;
      }
      await saveIntegrationKeys({ blotatoApiKey: blotatoKey.trim() });
      setBlotatoKey("");
      toast({ title: "Blotato conectado!", description: `Assinatura ${u.subscriptionStatus}` });
      setStep(7);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chave inválida");
    } finally {
      setIsValidating(false);
    }
  };

  // ── Step 2: Validar PFM ──────────────────────────────────────
  const handleValidatePfm = async () => {
    if (!pfmKey.trim()) return;
    setIsValidating(true);
    setError("");
    try {
      const result = await validatePfmKey(pfmKey.trim());
      if (!result.valid) {
        setError(result.error || "Chave inválida");
        return;
      }
      await saveIntegrationKeys({ postformeApiKey: pfmKey.trim() });
      setPfmKey("");
      toast({ title: "Post for Me conectado!" });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao validar");
    } finally {
      setIsValidating(false);
    }
  };

  // ── Step 4: Validar Apify ────────────────────────────────────
  const handleValidateApify = async () => {
    if (!apifyToken.trim()) return;
    setIsValidating(true);
    setError("");
    try {
      const result = await validateApifyToken(apifyToken.trim());
      if (!result.valid) {
        setError(result.error || "Token inválido");
        return;
      }
      await saveIntegrationKeys({ apifyApiToken: apifyToken.trim() });
      setApifyToken("");
      toast({ title: "Apify conectado!" });
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao validar");
    } finally {
      setIsValidating(false);
    }
  };

  // ── Step 5: Validar Higgsfield ─────────────────────────────
  const handleValidateHiggsfield = async () => {
    if (!hfApiId.trim() || !hfApiSecret.trim()) return;
    setIsValidating(true);
    setError("");
    try {
      const result = await validateHiggsFieldKey(hfApiId.trim(), hfApiSecret.trim());
      if (!result.valid) {
        setError(result.error || "Credenciais inválidas");
        return;
      }
      await saveIntegrationKeys({ higgsFieldApiId: hfApiId.trim(), higgsFieldApiSecret: hfApiSecret.trim() });
      setHfApiId("");
      setHfApiSecret("");
      toast({ title: "Higgsfield conectado!" });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao validar");
    } finally {
      setIsValidating(false);
    }
  };

  // ── Step 6: Validar Firecrawl ──────────────────────────────
  const handleValidateFirecrawl = async () => {
    if (!firecrawlKey.trim()) return;
    setIsValidating(true);
    setError("");
    try {
      const result = await validateFirecrawlKey(firecrawlKey.trim());
      if (!result.valid) {
        setError(result.error || "Chave inválida");
        return;
      }
      await saveIntegrationKeys({ firecrawlApiKey: firecrawlKey.trim() });
      setFirecrawlKey("");
      toast({ title: "Firecrawl conectado!" });
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao validar");
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidatePexels = async () => {
    if (!pexelsKey.trim()) return;
    setIsValidating(true);
    setError("");
    try {
      const r = await validatePexelsKey(pexelsKey.trim());
      if (!r.valid) { setError(r.error || "Chave inválida"); return; }
      await saveIntegrationKeys({ pexelsApiKey: pexelsKey.trim() });
      setPexelsKey("");
      toast({ title: "Pexels conectado!" });
      setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setIsValidating(false);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      if (!status.postforme) {
        setError("Configure o Post for Me antes de finalizar.");
        return;
      }

      const finalConfig = {
        ...config,
        brandName: brandName || config.brandName,
        onboardingCompleted: true,
      };

      const savedConfig = await saveConfigToDb(finalConfig);
      completeOnboarding(savedConfig);

      toast({ title: "Configuração salva!", description: "Pronto para começar." });
      navigate("/dashboard");
    } catch (err) {
      toast({ title: "Erro ao salvar", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Nav buttons ─────────────────────────────────────────────
  const NavButtons = ({ prev, next, onNext, skipTo, canSkip, canProceed = true }: {
    prev?: number; next?: number; onNext?: () => void; skipTo?: number; canSkip?: boolean; canProceed?: boolean;
  }) => (
    <div className="flex gap-2">
      {prev && <Button variant="outline" onClick={() => { setError(""); setStep(prev); }}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>}
      {canSkip && skipTo && (
        <Button variant="outline" onClick={() => { setError(""); setStep(skipTo); }}>Pular</Button>
      )}
      {onNext ? (
        <Button
          className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-500"
          onClick={onNext}
          disabled={!canProceed || isValidating}
        >
          {isValidating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validando...</> : <>Validar e continuar <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      ) : next ? (
        <Button
          className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-500"
          onClick={() => { setError(""); setStep(next); }}
        >
          Continuar <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────
  if (isManageMode) {
    return (
      <SettingsShell
        currentConfig={config}
        onSave={async (partial) => {
          // SettingsShell agora só recebe campos de perfil (marca/logo).
          // Chaves são tratadas dentro do ManageKeysView via saveIntegrationKeys.
          const updated = {
            ...config,
            ...partial,
            onboardingCompleted: true,
          };
          await saveConfigToDb(updated);
          toast({ title: "Configurações salvas." });
        }}
        onBack={() => navigate("/dashboard")}
      />
    );
  }

  if (configLoading || !bootReady) {
    return (
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 relative z-10" />
      </div>
    );
  }

  const totalSteps = STEPS.length;
  const progress = Math.round((step / totalSteps) * 100);

  // Em qualquer step, se a integração já está conectada, permitimos avançar
  // sem revalidar — o input em branco preserva a chave salva.
  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />
      <div className="w-full max-w-lg space-y-6 relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-2xl shadow-violet-500/30">
            <Zap className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {user ? `Olá, ${user.user_metadata?.full_name || user.email?.split("@")[0]}!` : "Mega Automação"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configuração da plataforma</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Passo {step} de {totalSteps}</span>
            <span>{progress}% concluído</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex gap-1">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step > s.id ? "bg-green-500" : step === s.id ? "bg-violet-500" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error banner (shared) */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* ── STEP 1: Post for Me (obrigatório) ──────────────── */}
        {step === 1 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-violet-500" /> Post for Me — Publicação
                {status.postforme && <Badge className="bg-green-600 text-[10px] px-1.5 py-0 h-4">Conectado</Badge>}
              </CardTitle>
              <CardDescription>
                {status.postforme
                  ? "Chave já configurada. Deixe em branco para manter, ou cole uma nova para substituir."
                  : "Obrigatório para publicar em 9 redes sociais, agendar posts e gerenciar contas."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SecretInput id="pfm" label="Post for Me API Key" placeholder={status.postforme ? "Cole uma nova chave para substituir" : "pfm_live_xxxxxxxxxxxxx"} value={pfmKey} onChange={setPfmKey} hint="Obtenha em" link="https://app.postforme.dev/settings" linkLabel="app.postforme.dev/settings" />
              <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-violet-600">O que habilita:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Publicação simultânea em Instagram, X, LinkedIn, Facebook, TikTok, Pinterest, Threads, YouTube</li>
                  <li>Agendamento e automação de posts (Autopilot)</li>
                  <li>Conexão e gestão das contas das redes sociais</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">💡 Imagens são geradas automaticamente via IA (OpenAI gpt-image-2) — sem configuração extra.</p>
              <NavButtons
                onNext={pfmKey.trim() ? handleValidatePfm : undefined}
                next={pfmKey.trim() ? undefined : (status.postforme ? 2 : undefined)}
                canProceed={!!pfmKey.trim() || status.postforme}
              />
            </CardContent>
          </Card>
        )}

        {/* ── STEP 2: Higgsfield (opcional) ──────────────────── */}
        {step === 2 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5 text-pink-500" /> Higgsfield — Vídeo IA <Badge variant="secondary" className="text-[10px]">opcional</Badge>
                {status.higgsfield && <Badge className="bg-green-600 text-[10px] px-1.5 py-0 h-4">Conectado</Badge>}
              </CardTitle>
              <CardDescription>
                {status.higgsfield
                  ? "Credenciais já configuradas. Deixe em branco para manter, ou cole novos valores para substituir."
                  : "Gera vídeos de alta qualidade com IA (Kling, Veo, Sora). Sem isso, o Studio funciona sem vídeo."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SecretInput id="hf-api-id" label="API ID" placeholder={status.higgsfieldApiId ? "Cole um novo API ID para substituir" : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"} value={hfApiId} onChange={setHfApiId} hint="Obtenha em" link="https://cloud.higgsfield.ai/settings" linkLabel="cloud.higgsfield.ai" />
              <SecretInput id="hf-api-secret" label="API Secret" placeholder={status.higgsfieldApiSecret ? "Cole um novo API Secret para substituir" : "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"} value={hfApiSecret} onChange={setHfApiSecret} />
              <NavButtons
                prev={1}
                onNext={(hfApiId.trim() && hfApiSecret.trim()) ? handleValidateHiggsfield : undefined}
                next={(hfApiId.trim() && hfApiSecret.trim()) ? undefined : 3}
                skipTo={3}
                canSkip
                canProceed={(!!hfApiId.trim() && !!hfApiSecret.trim()) || status.higgsfield}
              />
            </CardContent>
          </Card>
        )}

        {/* ── STEP 3: Analytics / Apify (opcional) ──────────── */}
        {step === 3 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" /> Apify — Analytics <Badge variant="secondary" className="text-[10px]">opcional</Badge>
                {status.apify && <Badge className="bg-green-600 text-[10px] px-1.5 py-0 h-4">Conectado</Badge>}
              </CardTitle>
              <CardDescription>
                {status.apify
                  ? "Token já configurado. Deixe em branco para manter, ou cole um novo token para substituir."
                  : "Para buscar seguidores, likes e engajamento real no painel Analytics."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SecretInput id="apify" label="Apify API Token" placeholder={status.apify ? "Cole um novo token para substituir" : "apify_api_xxxxxxxxxxxxx"} value={apifyToken} onChange={setApifyToken} hint="Crie conta grátis em" link="https://console.apify.com/account/integrations" linkLabel="console.apify.com" />
              <NavButtons
                prev={2}
                onNext={apifyToken.trim() ? handleValidateApify : undefined}
                next={apifyToken.trim() ? undefined : 4}
                skipTo={4}
                canSkip
                canProceed={!!apifyToken.trim() || status.apify}
              />
            </CardContent>
          </Card>
        )}

        {/* ── STEP 4: Firecrawl (opcional) ───────────────────── */}
        {step === 4 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-orange-500" /> Firecrawl — Pesquisa e Fontes <Badge variant="secondary" className="text-[10px]">opcional</Badge>
                {status.firecrawl && <Badge className="bg-green-600 text-[10px] px-1.5 py-0 h-4">Conectado</Badge>}
              </CardTitle>
              <CardDescription>
                {status.firecrawl
                  ? "Chave já configurada. Deixe em branco para manter, ou cole uma nova para substituir."
                  : "Pesquisa web no Autopilot e extração de conteúdo de URLs/YouTube."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SecretInput id="firecrawl" label="Firecrawl API Key" placeholder={status.firecrawl ? "Cole uma nova chave para substituir" : "fc-xxxxxxxxxxxxx"} value={firecrawlKey} onChange={setFirecrawlKey} hint="Crie conta em" link="https://www.firecrawl.dev/app/api-keys" linkLabel="firecrawl.dev" />
              <NavButtons
                prev={3}
                onNext={firecrawlKey.trim() ? handleValidateFirecrawl : undefined}
                next={firecrawlKey.trim() ? undefined : 5}
                skipTo={5}
                canSkip
                canProceed={!!firecrawlKey.trim() || status.firecrawl}
              />
            </CardContent>
          </Card>
        )}

        {/* ── STEP 5: Pexels (opcional) ──────────────────────── */}
        {step === 5 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-blue-500" /> Pexels — Banco de Imagens
                <Badge variant="secondary" className="text-[10px]">opcional</Badge>
                {status.pexels && (
                  <Badge className="bg-green-600 text-[10px] px-1.5 py-0 h-4">Conectado</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {status.pexels
                  ? "Chave já configurada. Deixe em branco para manter, ou cole uma nova chave para substituir."
                  : "Busque fotos de acervo profissional para usar nos posts."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SecretInput id="pexels" label="Pexels API Key" placeholder={status.pexels ? "Cole uma nova chave para substituir" : "Sua chave Pexels"} value={pexelsKey} onChange={setPexelsKey} hint="Crie conta grátis em" link="https://www.pexels.com/api/" linkLabel="pexels.com/api" />
              <NavButtons
                prev={4}
                onNext={pexelsKey.trim() ? handleValidatePexels : undefined}
                next={pexelsKey.trim() ? undefined : 6}
                skipTo={6}
                canSkip
                canProceed={!!pexelsKey.trim() || status.pexels}
              />
            </CardContent>
          </Card>
        )}


        {/* ── STEP 6: Blotato (legado, opcional) ─────────────── */}
        {step === 6 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-muted-foreground" /> Blotato <Badge variant="secondary" className="text-[10px]">legado · opcional</Badge>
                {status.blotato && <Badge className="bg-green-600 text-[10px] px-1.5 py-0 h-4">Conectado</Badge>}
              </CardTitle>
              <CardDescription>
                {status.blotato
                  ? "Chave já configurada. Deixe em branco para manter, ou cole uma nova para substituir."
                  : "Extração de fontes de conteúdo (YouTube, artigos). Não é mais obrigatório — visuais e vídeos agora usam OpenAI e Higgsfield."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SecretInput id="blotato" label="Blotato API Key" placeholder={status.blotato ? "Cole uma nova chave para substituir" : "blt_xxxxxxxxxxxxx"} value={blotatoKey} onChange={setBlotatoKey} hint="Se já tiver, obtenha em" link="https://app.blotato.com/settings" linkLabel="app.blotato.com" />
              <NavButtons
                prev={5}
                onNext={blotatoKey.trim() ? handleValidateBlotato : undefined}
                next={blotatoKey.trim() ? undefined : 7}
                skipTo={7}
                canSkip
                canProceed={!!blotatoKey.trim() || status.blotato}
              />
            </CardContent>
          </Card>
        )}

        {/* ── STEP 7: Marca (personalização) ─────────────────── */}
        {step === 7 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-violet-500" />
                Identidade da marca
              </CardTitle>
              <CardDescription>
                Personaliza o nome que aparece na plataforma e nos posts gerados por IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="brand">Nome da marca / agência</Label>
                <Input
                  id="brand"
                  placeholder="Minha Agência Digital"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>

              {/* Checklist de APIs configuradas */}
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resumo de configuração</p>
                {[
                  { label: "Post for Me (Publicação)",   ok: status.postforme,    req: true  },
                  { label: "Imagens IA (OpenAI)",        ok: true,                req: false },
                  { label: "Higgsfield (Vídeo IA)",      ok: status.higgsfield,   req: false },
                  { label: "Apify (Analytics)",          ok: status.apify,        req: false },
                ].map(({ label, ok, req }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    {ok
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      : req
                      ? <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      : <Info className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={ok ? "text-green-600 font-medium" : req ? "text-destructive" : "text-muted-foreground"}>
                      {label}
                    </span>
                    {ok && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-auto text-green-600">conectado</Badge>}
                    {!ok && req && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 ml-auto">faltando</Badge>}
                    {!ok && !req && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-auto">opcional</Badge>}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setError(""); setStep(6); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" />Voltar
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-500"
                  onClick={async () => {
                    try {
                      if (brandName && brandName !== config.brandName) {
                        await saveConfigToDb({ ...config, brandName });
                      }
                    } catch (e) {
                      console.warn("[Setup] erro salvando brand name:", e);
                    }
                    setStep(8);
                  }}
                >
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 8: Conectar redes ─────────────────────────── */}
        {step === 8 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                Conectar Redes Sociais
              </CardTitle>
              <CardDescription>
                Última etapa — autorize as redes que deseja usar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {["Instagram","Twitter/X","Facebook","LinkedIn","TikTok","Pinterest","Threads","YouTube"].map((p) => (
                  <div key={p} className="flex items-center justify-center rounded-lg border bg-muted/30 px-2 py-2 text-xs text-muted-foreground text-center">
                    {p}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={() => setConnectOpen(true)}>
                <Link2 className="mr-2 h-4 w-4" />
                Conectar Redes Sociais
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600"
                onClick={handleFinish}
                disabled={isSaving || !isConfigured}
              >
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <>Salvar e ir para o Dashboard <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Suas chaves ficam guardadas no servidor — nunca trafegam pelo navegador.
              </p>
            </CardContent>
          </Card>
        )}

        <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
      </div>
    </div>
  );
}
