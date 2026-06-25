import { ArrowLeft, KeyRound, Palette, Users, Settings as SettingsIcon, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ManageKeysView } from "./ManageKeysView";
import { ManageBrandView } from "./ManageBrandView";
import { ManageAccountsView } from "./ManageAccountsView";
import { ManagePreferencesView } from "./ManagePreferencesView";
import { Card } from "@/components/ui/card";
import type { AppConfig } from "@/types";
import type { CompanyRole } from "@/lib/permissions";

interface Props {
  currentConfig: AppConfig;
  onSave: (partial: Partial<AppConfig>) => Promise<void>;
  onBack: () => void;
  role?: CompanyRole | null;
}

export function SettingsShell({ currentConfig, onSave, onBack, role }: Props) {
  const isOwner = role === "owner";

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <AnimatedBackground />
      <div className="mx-auto max-w-4xl space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Configurações
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie sua conta e empresa.
            </p>
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>

        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user" className="gap-1.5">
              <SettingsIcon className="h-3.5 w-3.5" /> Usuário
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Empresa
            </TabsTrigger>
          </TabsList>

          {/* ─── CONFIGURAÇÕES DO USUÁRIO ──── */}
          <TabsContent value="user" className="mt-6 space-y-4">
            <div className="space-y-4">
              {/* Chaves de API - Só para DONO */}
              {isOwner ? (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <KeyRound className="h-5 w-5" /> Chaves de API
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Suas chaves pessoais que são herdadas por todas as suas empresas.
                    </p>
                  </div>
                  <ManageKeysView currentConfig={currentConfig} onSave={onSave} embedded />
                </div>
              ) : (
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Apenas o Dono da empresa pode gerenciar as chaves de API.
                  </p>
                </Card>
              )}

              {/* Preferências */}
              <div className="mt-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" /> Preferências
                  </h2>
                </div>
                <ManagePreferencesView />
              </div>
            </div>
          </TabsContent>

          {/* ─── CONFIGURAÇÕES DA EMPRESA ──── */}
          <TabsContent value="company" className="mt-6 space-y-4">
            <div className="space-y-4">
              {/* Marca e informações da empresa */}
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Palette className="h-5 w-5" /> Identidade
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Marca e aparência compartilhadas com sua equipe.
                  </p>
                </div>
                <ManageBrandView currentConfig={currentConfig} onSave={onSave} />
              </div>

              {/* Contas conectadas */}
              <div className="mt-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" /> Contas Sociais
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contas conectadas desta empresa.
                  </p>
                </div>
                <ManageAccountsView />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
