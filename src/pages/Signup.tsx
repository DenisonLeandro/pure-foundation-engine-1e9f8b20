import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Loader2, AlertCircle, Mail, Lock, User, Lock as LockIcon } from "lucide-react";
import { FadeIn, Float, ShimmerText, ScaleIn } from "@/components/AnimatedComponents";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("registration_enabled")
        .limit(1)
        .maybeSingle();
      // Sem row → habilitado por padrão
      setRegistrationEnabled(data ? data.registration_enabled : true);
    })();
  }, []);

  const passwordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !passwordsMatch || !passwordValid) return;
    if (registrationEnabled === false) {
      setError("Novos registros estão temporariamente desabilitados.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: err } = await signUp(email.trim(), password, name.trim());
    if (err) {
      if (err.includes("already registered")) {
        setError("Este email já está cadastrado. Tente fazer login.");
      } else {
        setError(err);
      }
      setLoading(false);
    } else {
      // Com confirmação de email desativada, o signup já loga automaticamente.
      // Redireciona para o setup/onboarding.
      navigate("/setup");
    }
  };

  if (registrationEnabled === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (registrationEnabled === false) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
        <AnimatedBackground />
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <LockIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">Registros desabilitados</CardTitle>
            <CardDescription>
              A criação de novas contas está temporariamente indisponível. Tente novamente mais tarde.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button variant="outline" className="w-full">Voltar para o login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />
      <div className="w-full max-w-md space-y-8">
        <FadeIn>
        <div className="flex flex-col items-center gap-4 text-center">
          <Float amplitude={6}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-2xl shadow-violet-500/30">
              <Zap className="h-8 w-8" />
            </div>
          </Float>
          <div>
            <h1 className="text-3xl font-bold">
              <ShimmerText>Criar Conta</ShimmerText>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Comece a automatizar suas redes sociais</p>
          </div>
        </div>
        </FadeIn>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    autoComplete="name"
                  />
                </div>
              </div>

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
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="pl-10"
                    autoComplete="new-password"
                    required
                  />
                </div>
                {password && !passwordValid && (
                  <p className="text-xs text-destructive">A senha deve ter pelo menos 6 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    className="pl-10"
                    autoComplete="new-password"
                    required
                  />
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
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
                disabled={loading || !email.trim() || !passwordValid || !passwordsMatch}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Criar Conta
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-violet-500 hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
