## Problema

O botão "Sair da conta" (em `ManagePreferencesView`) não funciona porque:

1. `supabase.auth.signOut()` está fazendo uma chamada de rede ao backend que está retornando `TypeError: Failed to fetch` (visível nos logs do console agora — várias falhas de fetch para o Supabase).
2. O `signOut` padrão usa `scope: 'global'`, que exige rede. Quando a rede falha, ele lança erro.
3. O `catch` em `AuthContext.signOut` engole o erro, mas a chave de sessão do Supabase (`sb-<ref>-auth-token`) **nunca é removida do localStorage** — `userStorage.clearUser()` só limpa chaves com prefixo `app_u:` / `mega_u:`, não o token do Supabase.
4. Resultado: o usuário continua logado, o `onAuthStateChange` não dispara `SIGNED_OUT`, e o `Navigate to="/login"` em `handleSignOut` pode nem rodar (a Promise pode ficar pendente antes do catch interno do GoTrue).

## Correção (escopo mínimo, só logout)

**`src/contexts/AuthContext.tsx` — `signOut`:**
- Forçar limpeza local primeiro, sempre, independente de rede:
  - `setSession(null); setUser(null);`
  - Remover manualmente todas as chaves `sb-*-auth-token` do `localStorage` (cobre o caso de rede caída).
  - Manter `userStorage.clearUser()` para chaves do app.
- Em seguida, disparar `supabase.auth.signOut({ scope: 'local' })` dentro de try/catch — `scope: 'local'` não exige rede e apenas limpa o storage do client; serve como redundância e garante que o GoTrue interno dispare `SIGNED_OUT`.
- Não aguardar nenhuma chamada de rede que possa travar.

**`src/components/setup/ManagePreferencesView.tsx` — `handleSignOut`:**
- Após `await signOut()`, usar `window.location.assign("/login")` em vez de `navigate("/login")`, para garantir um boot limpo (descarta contextos com estado obsoleto e evita ficar preso em `/criar-empresa` por causa de cache de `CompanyContext`).

## Fora de escopo (não mexer)

- Studio, Galeria, integrações, RLS, company_configs, chaves, RPCs, schema do banco.
- Não alterar `src/integrations/supabase/client.ts` (auto-gerado / fallback público já correto).
- Não tentar "consertar" os outros `Failed to fetch` (CompanyContext, CreateCompany) — são sintoma de instabilidade externa do backend, fora do pedido.

## Arquivos alterados

- `src/contexts/AuthContext.tsx` (função `signOut`)
- `src/components/setup/ManagePreferencesView.tsx` (função `handleSignOut`)

## Verificação

1. Clicar em "Sair da conta" → confirmar → redireciona para `/login` mesmo com rede instável.
2. Após logout, `localStorage` não contém mais chaves `sb-*-auth-token`.
3. Recarregar a página em `/dashboard` → redireciona para `/login` (sessão realmente foi embora).
