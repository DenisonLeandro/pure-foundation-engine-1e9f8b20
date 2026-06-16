import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { userStorage } from "@/lib/storage";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthEnabled: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      // Supabase not configured — skip auth, allow access
      console.info("[boot][AuthContext] backend não configurado; liberando auth");
      setLoading(false);
      return;
    }

    let done = false;
    const finish = () => { if (!done) { done = true; setLoading(false); } };

    // Safety net: never let the auth loader stall forever (8s).
    const safety = window.setTimeout(() => {
      if (!done) console.warn("[AuthContext] getSession timeout — liberando UI");
      finish();
    }, 8000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.info("[boot][AuthContext] getSession resolvido", { hasUser: !!s?.user });
      setSession(s);
      setUser(s?.user ?? null);
      finish();
    }).catch((err) => {
      console.warn("[AuthContext] getSession falhou:", err);
      finish();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.info("[boot][AuthContext] auth event", { event, hasUser: !!s?.user });
      setSession(s);
      setUser(s?.user ?? null);
      finish();
    });

    return () => { window.clearTimeout(safety); subscription.unsubscribe(); };
  }, []);


  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || "" } },
      });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Falha ao cadastrar." };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) return { error: null };
      const msg = error.message || "";
      if (/invalid login credentials/i.test(msg)) return { error: "Email ou senha inválidos." };
      if (/failed to fetch|network/i.test(msg)) return { error: "Não foi possível autenticar. Verifique sua conexão." };
      if (/email not confirmed/i.test(msg)) return { error: "Confirme seu email antes de entrar." };
      return { error: msg };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Não foi possível autenticar." };
    }
  };

  const signOut = async () => {
    // 1) Limpa estado local primeiro — não depende de rede.
    try { userStorage.clearUser(); } catch (e) { console.warn("[auth] clearUser falhou:", e); }
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) { console.warn("[auth] limpar token supabase falhou:", e); }
    setSession(null);
    setUser(null);
    // 2) signOut local (não faz request de rede) — apenas para disparar SIGNED_OUT.
    try { await supabase.auth.signOut({ scope: "local" }); }
    catch (err) { console.warn("[auth] signOut falhou:", err); }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Falha ao enviar email." };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Falha ao atualizar senha." };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAuthEnabled: supabaseConfigured,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
