import { useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Trash2, Save, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { useApp } from "@/contexts/use-app";
import { getUser, validatePfmKey, validateApifyToken, validateHiggsFieldKey, validateFirecrawlKey, validatePexelsKey } from "@/lib/api";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import type { AppConfig, IntegrationKeyPatch, IntegrationsStatus } from "@/types";

type IntegrationStatusKey = Exclude<keyof IntegrationsStatus, "updatedAt" | "higgsfieldApiId" | "higgsfieldApiSecret" | "higgsfield">;

type ManageKeyDef = {
  patchField: keyof IntegrationKeyPatch;
  statusField: IntegrationStatusKey;
  label: string;
  description: string;
  placeholder: string;
  link?: string;
  linkLabel?: string;
  validate?: (value: string) => Promise<{ valid: boolean; error?: string }>;
};

const MANAGE_KEYS: ManageKeyDef[] = [
  {
    patchField: "blotatoApiKey",
    statusField: "blotato",
    label: "Blotato",
    description: "Visuais, vídeos IA e carrosséis.",
    placeholder: "blt_xxxxxxxxxxxxx",
    link: "https://app.blotato.com/settings",
    linkLabel: "app.blotato.com",
    validate: async (v) => {
      try {
        const u = await getUser(v);
        if (u.subscriptionStatus !== "active") return { valid: false, error: "Assinatura não está ativa." };
        return { valid: true };
      } catch (e) {
        return { valid: false, error: e instanceof Error ? e.message : "Chave inválida" };
      }
    },
  },
  {
    patchField: "postformeApiKey",
    statusField: "postforme",
    label: "Post for Me",
    description: "Publicação multi-plataforma.",
    placeholder: "pfm_live_xxxxxxxxxxxxx",
    link: "https://app.postforme.dev/settings",
    linkLabel: "app.postforme.dev",
    validate: async (v) => validatePfmKey(v),
  },
  {
    patchField: "apifyApiToken",
    statusField: "apify",
    label: "Apify",
    description: "Analytics reais das redes.",
    placeholder: "apify_api_xxxxxxxxxxxxx",
    link: "https://console.apify.com/account/integrations",
    linkLabel: "console.apify.com",
    validate: async (v) => validateApifyToken(v),
  },
  {
    patchField: "firecrawlApiKey",
    statusField: "firecrawl",
    label: "Firecrawl",
    description: "Pesquisa de conteúdo (Autopilot).",
    placeholder: "fc-xxxxxxxxxxxxx",
    link: "https://www.firecrawl.dev/app/api-keys",
    linkLabel: "firecrawl.dev",
    validate: async (v) => validateFirecrawlKey(v),
  },
  {
    patchField: "pexelsApiKey",
    statusField: "pexels",
    label: "Pexels",
    description: "Banco de imagens (fotos de acervo).",
    placeholder: "Sua chave Pexels",
    link: "https://www.pexels.com/api/",
    linkLabel: "pexels.com/api",
    validate: async (v) => validatePexelsKey(v),
  },
];

interface ManageKeysViewProps {
  /** Mantido por compatibilidade com SettingsShell, mas não é mais necessário — usamos o status do AppContext. */
  currentConfig?: AppConfig;
  /** Mantido por compatibilidade — chaves agora vão por saveIntegrationKeys diretamente. */
  onSave?: (partial: Partial<AppConfig>) => Promise<void>;
  onBack?: () => void;
  embedded?: boolean;
}

export function ManageKeysView({ onBack, embedded = false }: ManageKeysViewProps) {
  const { isEditor } = useCompany();
  const { config } = useApp();

  if (isEditor) {
    const blocked = (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" /> Acesso restrito
          </CardTitle>
          <CardDescription>
            Apenas Dono ou Admin da empresa podem visualizar ou editar as chaves de integração.
            Solicite ao administrador da sua empresa caso precise alterar alguma chave.
          </CardDescription>
        </CardHeader>
      </Card>
    );
    if (embedded) return blocked;
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        <AnimatedBackground />
        <div className="mx-auto max-w-3xl space-y-6 relative z-10">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          )}
          {blocked}
        </div>
      </div>
    );
  }

  const content = (
    <div className="grid gap-4">
      {MANAGE_KEYS.map((def) => (
        <ManageKeyCard
          key={def.patchField as string}
          def={def}
          isConnected={!!config.integrations[def.statusField]}
        />
      ))}
      <HiggsfieldCard
        hasId={!!config.integrations.higgsfieldApiId}
        hasSecret={!!config.integrations.higgsfieldApiSecret}
      />
    </div>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <AnimatedBackground />
      <div className="mx-auto max-w-3xl space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Configurações — Chaves de API
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Atualize ou remova suas chaves a qualquer momento. As chaves salvas nunca são exibidas — apenas o status de conexão.
            </p>
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          )}
        </div>
        {content}
      </div>
    </div>
  );
}

function ManageKeyCard({ def, isConnected }: { def: ManageKeyDef; isConnected: boolean }) {
  const { toast } = useToast();
  const { saveIntegrationKeys } = useApp();
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) return;
    setBusy(true);
    try {
      if (def.validate) {
        const r = await def.validate(value.trim());
        if (!r.valid) {
          toast({ title: "Chave inválida", description: r.error, variant: "destructive" });
          return;
        }
      }
      await saveIntegrationKeys({ [def.patchField]: value.trim() } as IntegrationKeyPatch);
      setValue("");
      toast({ title: `${def.label} conectado!`, description: "Chave salva com segurança." });
    } catch (e) {
      toast({ title: "Erro ao salvar", description: e instanceof Error ? e.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remover a chave do ${def.label}? As funcionalidades dependentes deixarão de funcionar.`)) return;
    setBusy(true);
    try {
      await saveIntegrationKeys({ [def.patchField]: null } as IntegrationKeyPatch);
      toast({ title: `Chave do ${def.label} removida.` });
    } catch (e) {
      toast({ title: "Erro ao remover", description: e instanceof Error ? e.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {def.label}
              {isConnected ? (
                <Badge className="bg-green-600 text-[10px] px-1.5 py-0 h-4">Conectado</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Não configurado</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-1">{def.description}</CardDescription>
          </div>
          <div className="text-right text-xs text-muted-foreground font-mono shrink-0">
            {isConnected ? "Chave configurada" : "Não configurada"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            placeholder={isConnected ? "Cole uma nova chave para substituir" : def.placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono text-sm pr-10"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          {def.link && (
            <a href={def.link} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-500 hover:underline inline-flex items-center gap-0.5">
              Obter chave em {def.linkLabel} <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="flex gap-2 ml-auto">
            {isConnected && (
              <Button variant="outline" size="sm" onClick={handleRemove} disabled={busy}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={busy || !value.trim()}>
              {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Salvar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HiggsfieldCard({ hasId, hasSecret }: { hasId: boolean; hasSecret: boolean }) {
  const { toast } = useToast();
  const { saveIntegrationKeys } = useApp();
  const [id, setId] = useState("");
  const [secret, setSecret] = useState("");
  const [showId, setShowId] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [busy, setBusy] = useState(false);
  const isConfigured = hasId && hasSecret;

  const handleSave = async () => {
    if (!id.trim() || !secret.trim()) return;
    setBusy(true);
    try {
      const r = await validateHiggsFieldKey(id.trim(), secret.trim());
      if (!r.valid) {
        toast({ title: "Credenciais inválidas", description: r.error, variant: "destructive" });
        return;
      }
      await saveIntegrationKeys({ higgsFieldApiId: id.trim(), higgsFieldApiSecret: secret.trim() });
      setId("");
      setSecret("");
      toast({ title: "Higgsfield conectado!", description: "Credenciais salvas com segurança." });
    } catch (e) {
      toast({ title: "Erro ao salvar", description: e instanceof Error ? e.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remover credenciais do Higgsfield? Geração de vídeo e imagens IA serão desativadas.")) return;
    setBusy(true);
    try {
      await saveIntegrationKeys({ higgsFieldApiId: null, higgsFieldApiSecret: null });
      toast({ title: "Credenciais do Higgsfield removidas." });
    } catch (e) {
      toast({ title: "Erro ao remover", description: e instanceof Error ? e.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Higgsfield
              {isConfigured ? (
                <Badge className="bg-green-600 text-[10px] px-1.5 py-0 h-4">Conectado</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Não configurado</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-1">Geração de vídeo e imagens IA (par ID + Secret).</CardDescription>
          </div>
          <div className="text-right text-xs text-muted-foreground font-mono shrink-0">
            <div>ID: {hasId ? "configurado" : "não configurado"}</div>
            <div>Secret: {hasSecret ? "configurado" : "não configurado"}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Input
            type={showId ? "text" : "password"}
            placeholder={hasId ? "Cole um novo API ID para substituir" : "API ID"}
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="font-mono text-sm pr-10"
            autoComplete="off"
          />
          <button type="button" onClick={() => setShowId((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="relative">
          <Input
            type={showSecret ? "text" : "password"}
            placeholder={hasSecret ? "Cole um novo API Secret para substituir" : "API Secret"}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="font-mono text-sm pr-10"
            autoComplete="off"
          />
          <button type="button" onClick={() => setShowSecret((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <a href="https://cloud.higgsfield.ai/settings" target="_blank" rel="noopener noreferrer" className="text-xs text-violet-500 hover:underline inline-flex items-center gap-0.5">
            Obter credenciais <ExternalLink className="h-3 w-3" />
          </a>
          <div className="flex gap-2 ml-auto">
            {isConfigured && (
              <Button variant="outline" size="sm" onClick={handleRemove} disabled={busy}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={busy || !id.trim() || !secret.trim()}>
              {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Salvar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
