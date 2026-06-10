# Plano: corrigir tela branca silenciosa após edições/HMR

## Causa raiz confirmada
- `src/contexts/AppContext.tsx` exporta no mesmo arquivo: o componente `AppProvider`, o objeto `AppContext` e o hook `useApp`. Essa mistura quebra o React Fast Refresh do Vite — em hot updates, o módulo é reavaliado e passam a existir **duas identidades** do mesmo `AppContext`. Componentes que consomem via `useApp()` veem um contexto diferente do que `AppProvider` está provendo, e o `useContext` retorna `null`, disparando `useApp must be used within AppProvider`.
- `vite.config.ts` tem `server.hmr.overlay: false`, então essa exceção não aparece como overlay vermelho — o usuário enxerga apenas tela branca.
- Reprodução confirmada no preview com reload completo: branco + 502 em um URL com timestamp HMR de `AuthContext.tsx`, sintoma típico de módulo invalidado por Fast Refresh.

## Mudanças (somente reorganização de arquivos + 1 linha de config)

### 1. Dividir `src/contexts/AppContext.tsx` em 3 arquivos
- **Novo** `src/contexts/app-context.ts` — apenas o `createContext` e os tipos (`AppContextType`, `AppState`).
- **Novo** `src/contexts/use-app.ts` — apenas o hook `useApp` (importa o contexto de `app-context.ts`).
- **Manter** `src/contexts/AppContext.tsx` — apenas o componente `AppProvider` (importa o contexto de `app-context.ts`). Toda a lógica de estado, boot, timeouts, `loadConfigFromDb`, `saveConfigToDb`, `inFlightUsersRef`, eventos de auth, etc. permanece **idêntica, byte a byte**, dentro do `AppProvider`.

### 2. Atualizar imports do `useApp` em todo o projeto
- Trocar `import { useApp } from "@/contexts/AppContext"` por `import { useApp } from "@/contexts/use-app"` em todos os consumidores. Imports de `AppProvider` continuam vindo de `@/contexts/AppContext`.

### 3. Reativar o overlay de erro do Vite
- Em `vite.config.ts`, remover `hmr.overlay: false` (ou setar `true`). Assim, qualquer erro futuro de render aparece como overlay vermelho em vez de tela branca silenciosa.

## Garantias (não muda)
- Nenhuma alteração em: `AuthContext`, `App.tsx`, guardas de rota (`RequireAppAccess`/`RequireSetupAccess`/`GuestOnly`/`RootRedirect`), `src/integrations/supabase/client.ts`, edge functions, RLS, storage, ou qualquer feature.
- Comportamento de boot, timeouts (8s), dedupe `inFlightUsersRef`, ordem dos eventos de auth, `setConfig`/`saveConfigToDb`/`completeOnboarding`/`resetConfig`: tudo permanece idêntico.
- Sem mudanças em assinatura pública: `useApp()` continua retornando exatamente o mesmo objeto.

## Verificação
1. Após as mudanças, abrir `/dashboard` no preview com reload completo e confirmar que renderiza.
2. Fazer uma edição trivial em qualquer arquivo do projeto para forçar HMR e confirmar que não volta para tela branca nem dispara `useApp must be used within AppProvider`.
3. Checar console: sem erros novos; warnings de React Router e `postMessage` permanecem (são pré-existentes e inofensivos).

## Detalhes técnicos
```text
Antes:
AppContext.tsx
  ├─ export const AppContext = createContext(...)
  ├─ export function AppProvider(...) { ... }   ← componente
  └─ export function useApp() { ... }            ← hook
=> Fast Refresh não consegue preservar o módulo
   (mistura de exports de componente + não-componente)
=> em hot update, novo módulo cria NOVO AppContext
   AppProvider monta com Contexto B
   useApp lê Contexto A (antigo)
=> useContext === null => throw

Depois:
app-context.ts    → só createContext + tipos       (estável p/ HMR)
use-app.ts        → só hook useApp                 (estável p/ HMR)
AppContext.tsx    → só AppProvider                 (Fast Refresh OK)
=> Uma única identidade de contexto sobrevive a hot updates.
```