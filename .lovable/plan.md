
# Investigação

Pelo replay e pelo screenshot:
- O preview externo (`/login`) renderiza normalmente — o bundle e o React montam sem crash.
- No `/dashboard` o DOM chega a pintar KPIs ("100 seguidores · meta", "Próximos 30 dias 0"), mas a região visual do preview fica branca.
- Não há erros no console nem 4xx/5xx relevantes nos requests; só warning de React Router.

Isso descarta crash global e aponta para 3 causas reais ainda presentes (apesar das correções anteriores):

1. **`AppContext` sem guarda `supabaseConfigured`** — diferente do `AuthContext`. Se a sessão demora/trava, `configLoading` só libera no timeout de 8s, e nesse intervalo o usuário vê tela branca (o `PageLoader` light = `bg-background` branco + spinner pequeno → parece "vazio").
2. **Corrida `finishedRef` × `loadingRef` em `AppContext`** — quando `getSession()` retorna `null` e o `INITIAL_SESSION` chega logo depois com usuário, o dedupe pode pular o `loadConfigFromDb`, deixando `onboardingCompleted=false` e mandando o usuário pra `/setup` em loop silencioso.
3. **`Dashboard.tsx` faz `JSON.parse(pendingRaw)` sem try/catch** (linha 87). Se `onboarding_pending` estiver corrompido, lança no render → `ErrorBoundary` global pode aparecer, mas como o card usa `bg-background` branco e o usuário precisa rolar, parece "branco".
4. **`AppLayout` ainda re-checa `configLoading` e esconde `<Outlet/>`** — guarda redundante já que `RequireAppAccess` cobre. Se `configLoading` flipar, esconde o conteúdo todo.
5. **Tema** — `ThemeBoot` aplica tema, mas o usuário está em light (CSS default). Background branco + cards brancos + texto claro de placeholders pode parecer "tudo branco" em viewport zoomed-out (dpr=0.66).

# Plano de correção

## 1) `src/contexts/AppContext.tsx`
- Importar `supabaseConfigured` de `@/lib/supabase`.
- No topo do `useEffect` de boot: `if (!supabaseConfigured) { setConfigLoading(false); return; }`.
- Remover o dedupe via `finishedRef` na pipeline de `onAuthStateChange`: deixar que `loadConfigFromDb` sempre rode em `SIGNED_IN`/`INITIAL_SESSION`, e que o `finally` interno (`setConfigLoading(false)`) seja a única fonte de verdade.
- Trocar `loadingRef` por um Set/contador de in-flight só para evitar request duplicada à tabela, sem bloquear o pipeline de "boot finalizado".

## 2) `src/pages/Dashboard.tsx` (linhas ~86–96)
- Encapsular o `JSON.parse(pendingRaw)` em `try/catch`, descartando `onboarding_pending` corrompido (`userStorage.remove("onboarding_pending")`) — mesmo padrão já usado para `analytics`.

## 3) `src/components/layout/AppLayout.tsx`
- Remover o bloco `if (configLoading) return <spinner/>` — o gate já vive em `RequireAppAccess`. Renderizar sempre `<AppSidebar/>` + `<Outlet/>`.

## 4) `src/App.tsx`
- Trocar o `PageLoader` único por um fallback visível (fundo `bg-background`, texto "Carregando…" + spinner já no primeiro frame, sem depender de animação CSS atrasada).
- Envolver cada `Route` lazy crítico (`Dashboard`, `Studio`, `Setup`) em um `<Suspense>` próprio + `ErrorBoundary` local, para falhas de chunk virarem erro visível em vez de spinner infinito.

## 5) Diagnóstico ativo (temporário)
- Adicionar `console.info("[boot] AuthContext: loading=…, user=…")` e `console.info("[boot] AppContext: configLoading=…, onboarding=…")` nos transições de estado, para que numa nova reprodução o log mostre exatamente em qual gate o app travou.

## 6) Validação
- `browser--view_preview` em `/login`, autenticar (com o usuário), abrir `/dashboard` e `/setup?manage=1`, conferir screenshot + console + network.
- Confirmar que sumiu o branco e que os logs `[boot]` mostram `configLoading=false` em < 1s no caminho com sessão válida.

# Arquivos a editar

- `src/contexts/AppContext.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/pages/Dashboard.tsx`
- `src/App.tsx`

# O que NÃO muda

- Autenticação, fluxo de chaves, geração de legendas, seleção de imagens, edge functions, storage, CORS.
