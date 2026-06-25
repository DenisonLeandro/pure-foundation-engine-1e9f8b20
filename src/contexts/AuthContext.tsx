import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { userStorage } from "@/lib/storage";
import type { User, Session } from "@supabase/supabase-js";

export type AccountType = "owner" | "employee";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthEnabled: boolean;
  accountType: AccountType | null;
  accountTypeLoading: boolean;
  refreshAccountType: () => Promise<void>;
  signUp: (email: string, password: string, name?: string, accountType?: AccountType) => Promise<{ error: string | null }>;
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
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [accountTypeLoading, setAccountTypeLoading] = useState(false);

  const fetchAccountType = useCallback(async (uid: string | null) => {
    if (!uid || !supabaseConfigured) {
      setAccountType(null);
      return;
    }
    setAccountTypeLoading(true);
    try {
      // Cast to any because the generated Supabase types may not include `profiles` yet on first deploy.
      // Default to 'owner' on any miss to preserve existing user behavior.
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => {
          select: (cols: string) => {
            eq: (k: string, v: string) => {
              maybeSingle: () => Promise<{ data: { account_type?: string } | null; error: { message: string } | null }>;
            };
          };
        };
      })
        .from("profiles")
        .select("account_type")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) {
        console.warn("[AuthContext] profile fetch failed:", error.message);
        setAccountType("owner");
      } else {
        const t = data?.account_type;
        setAccountType(t === "employee" ? "employee" : "owner");
      }
    } catch (e) {
      console.warn("[AuthContext] profile fetch threw:", e);
      setAccountType("owner");
    } finally {
      setAccountTypeLoading(false);
    }
  }, []);

  const refreshAccountType = useCallback(async () => {
    await fetchAccountType(user?.id ?? null);
  }, [fetchAccountType, user?.id]);

  useEffect(() => {
    if (!supabaseConfigured) {
      console.info("[boot][AuthContext] backend não configurado; liberando auth");
      setLoading(false);
      return;
    }

    let done = false;
    const finish = () => { if (!done) { done = true; setLoading(false); } };

    const safety = window.setTimeout(() => {
      if (!done) console.warn("[AuthContext] getSession timeout — liberando UI");
      finish();
    }, 8000);

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.info("[boot][AuthContext] getSession resolvido", { hasUser: !!s?.user });
      setSession(s);
      setUser(s?.user ?? null);
      finish();
    }).catch((err) => {
      console.warn("[AuthContext] getSession falhou:", err);
      finish();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.info("[boot][AuthContext] auth event", { event, hasUser: !!s?.user });
      setSession(s);
      setUser(s?.user ?? null);
      finish();
    });

    return () => { window.clearTimeout(safety); subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    fetchAccountType(user?.id ?? null);
  }, [user?.id, fetchAccountType]);


  const signUp = async (email: string, password: string, name?: string, accountType: AccountType = "owner") => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || "", account_type: accountType } },
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
    try { userStorage.clearUser(); } catch (e) { console.warn("[auth] clearUser falhou:", e); }
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) { console.warn("[auth] limpar token supabase falhou:", e); }
    setSession(null);
    setUser(null);
    setAccountType(null);
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
      accountType,
      accountTypeLoading,
      refreshAccountType,
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
