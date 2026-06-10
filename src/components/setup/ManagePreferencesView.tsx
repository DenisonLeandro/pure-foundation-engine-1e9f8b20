import { Moon, Sun, RotateCcw, LogOut, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/use-app";

export function ManagePreferencesView() {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { resetConfig } = useApp();
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!confirm("Refazer toda a configuração inicial? Suas chaves continuarão salvas, mas o assistente será reaberto.")) return;
    resetConfig();
    navigate("/setup?reset=1");
  };

  const handleSignOut = async () => {
    if (!confirm("Sair da conta?")) return;
    await signOut();
    navigate("/login");
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Aparência</CardTitle>
          <CardDescription className="text-xs">Tema visual da interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-3.5 w-3.5 mr-1" /> Claro
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-3.5 w-3.5 mr-1" /> Escuro
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> Idioma
          </CardTitle>
          <CardDescription className="text-xs">Idioma da interface e do conteúdo gerado por IA.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="lang">Idioma</Label>
            <Select value="pt-BR" disabled>
              <SelectTrigger id="lang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Outros idiomas em breve.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Conta</CardTitle>
          <CardDescription className="text-xs">Ações relacionadas à sua conta e configuração inicial.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Refazer onboarding
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="text-destructive hover:text-destructive">
            <LogOut className="h-3.5 w-3.5 mr-1" /> Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
