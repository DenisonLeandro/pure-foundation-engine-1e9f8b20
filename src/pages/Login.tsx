import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Loader2, AlertCircle, Mail, Lock } from "lucide-react";
import { FadeIn, Float, ShimmerText, ScaleIn } from "@/components/AnimatedComponents";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("registration_enabled")
        .limit(1)
        .maybeSingle();
      setRegistrationEnabled(data ? data.registration_enabled : true);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return;
    setLoading(true);
    setError("");
    const { error: err } = await signIn(trimmedEmail, password);
    if (err) {
      setError(err === "Invalid login credentials" ? "Email ou senha incorretos" : err);
      setLoading(false);
    } else {
      setLoading(false);
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 overflow-hidden relative">
      <AnimatedBackground />
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <FadeIn delay={0}>
          <div className="flex flex-col items-center gap-4 text-center">
            <Float amplitude={6}>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-2xl shadow-violet-500/30">
                <Zap className="h-8 w-8" />
              </div>
            </Float>
            <div>
              <h1 className="text-3xl font-bold">
                <ShimmerText>Mega Automação</ShimmerText>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">de Redes Sociais</p>
            </div>
          </div>
        </FadeIn>

        <ScaleIn delay={0.2}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse sua conta para gerenciar suas redes sociais</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link to="/forgot-password" className="text-xs text-violet-500 hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="pl-10"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600"
                disabled={loading || !email.trim() || !password}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Entrar
              </Button>
            </form>

            {registrationEnabled && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Não tem conta?{" "}
                <Link to="/signup" className="text-violet-500 hover:underline font-medium">
                  Criar conta grátis
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
        </ScaleIn>
      </div>
    </div>
  );
}
