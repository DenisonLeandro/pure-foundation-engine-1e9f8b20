# Corrigir tela em branco ao abrir "/"

## Diagnóstico

Quando você abre o projeto, a URL é `/` (raiz). No `src/App.tsx` linha 126:

```tsx
<Route path="/" element={<Navigate to="/login" replace />} />
```

A raiz sempre manda pra `/login`. Mas `/login` está dentro de `GuestOnly`, que **redireciona usuários autenticados pra `/setup`**. E como seu onboarding já está completo, o `/setup` não tem o que mostrar de fluxo guiado e acaba ficando em branco (a página existe pra novos usuários).

Resumo do ciclo atual quando você já está logado e onboarded:

```text
/  →  /login  →  GuestOnly vê usuário  →  /setup  →  tela vazia
```

## Correção

Trocar o destino do redirect raiz por uma rota que decide certo conforme o estado de auth.

### Mudança em `src/App.tsx`

1. Criar um pequeno componente `RootRedirect` que:
   - se `loading` → mostra `PageLoader`
   - se sem usuário → `<Navigate to="/login" replace />`
   - se com usuário e `onboardingCompleted` → `<Navigate to="/dashboard" replace />`
   - se com usuário e não onboarded → `<Navigate to="/setup" replace />`

2. Substituir a linha 126 por:

```tsx
<Route path="/" element={<RootRedirect />} />
```

Com isso o fluxo passa a ser:

```text
/  →  RootRedirect  →  /dashboard  (usuário logado + onboarded)
/  →  RootRedirect  →  /setup      (logado, sem onboarding)
/  →  RootRedirect  →  /login      (deslogado)
```

## Arquivo afetado

- `src/App.tsx` — adicionar `RootRedirect` e trocar a rota `/`.

Sem mexer em layout, Studio, Gallery ou backend — é só roteamento.
