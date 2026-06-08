import { ArrowLeft, KeyRound, Palette, Users, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ManageKeysView } from "./ManageKeysView";
import { ManageBrandView } from "./ManageBrandView";
import { ManageAccountsView } from "./ManageAccountsView";
import { ManagePreferencesView } from "./ManagePreferencesView";
import type { AppConfig } from "@/types";

interface Props {
  currentConfig: AppConfig;
  onSave: (partial: Partial<AppConfig>) => Promise<void>;
  onBack: () => void;
}

export function SettingsShell({ currentConfig, onSave, onBack }: Props) {
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
              Gerencie chaves, marca, contas conectadas e preferências.
            </p>
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>

        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="keys" className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Chaves
            </TabsTrigger>
            <TabsTrigger value="brand" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" /> Marca
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Contas
            </TabsTrigger>
            <TabsTrigger value="prefs" className="gap-1.5">
              <SettingsIcon className="h-3.5 w-3.5" /> Preferências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="mt-6">
            <ManageKeysView currentConfig={currentConfig} onSave={onSave} embedded />
          </TabsContent>
          <TabsContent value="brand" className="mt-6">
            <ManageBrandView currentConfig={currentConfig} onSave={onSave} />
          </TabsContent>
          <TabsContent value="accounts" className="mt-6">
            <ManageAccountsView />
          </TabsContent>
          <TabsContent value="prefs" className="mt-6">
            <ManagePreferencesView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
