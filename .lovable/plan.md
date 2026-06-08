# Plano para eliminar a tela branca recorrente

## O que está acontecendo
A tela branca parece ter mais de uma causa, mas o principal problema estrutural já identificado é este:

- `src/components/layout/AppLayout.tsx` retorna `null` enquanto `configLoading` está `true`
- quando a sessão já existe e o app tenta montar as rotas autenticadas, isso pode deixar a tela literalmente vazia durante o boot
- em paralelo, a integração social ainda pode gerar erro de provider não configurado; isso não deveria derrubar a interface, mas hoje ainda participa do cenário de falha percebida
- já confirmei que no acesso público `/login` o app renderiza normalmente, então o problema não é o projeto inteiro “não subir”, e sim um fluxo específico de inicialização/sessão/configuração

## O que vou corrigir
1. Corrigir o boot visual do app autenticado
- trocar o `return null` de `AppLayout` por um estado de carregamento visível e estável
- garantir fundo, altura mínima e feedback visual consistentes durante `configLoading`
- revisar o fluxo entre `RequireAuth`, `RequireOnboarding` e `AppLayout` para evitar janelas de tela vazia em redirects

2. Blindar o carregamento da configuração do usuário
- revisar `AppContext` para evitar estados intermediários em que auth já resolveu, mas config ainda não terminou e a árvore fica sem render
- verificar se há corrida entre `getSession`, `onAuthStateChange` e `loadConfigFromDb`
- garantir fallback seguro quando a leitura da configuração falhar ou vier vazia

3. Conter falhas da integração social sem impactar a tela inteira
- revisar `src/lib/api/postforme.ts`, `ConnectAccountDialog` e `ManageAccountsView`
- manter o erro “Social provider app credentials not found” como mensagem tratável de UI, nunca como estado que possa quebrar a navegação ou bloquear o boot
- garantir que consultas de contas conectadas exibam erro amigável/estado vazio sem propagar quebra visual

4. Validar o fluxo real que hoje falha
- verificar preview nas rotas principais do boot: `/`, `/login`, `/setup`, `/setup?manage=1`
- confirmar que sessão existente não cai em tela vazia
- confirmar que ausência de credenciais OAuth do provider social não gera branco, só aviso controlado

## Arquivos-alvo
- `src/components/layout/AppLayout.tsx`
- `src/contexts/AppContext.tsx`
- `src/App.tsx` (se precisar alinhar loaders/guards)
- `src/lib/api/postforme.ts`
- `src/components/ConnectAccountDialog.tsx`
- `src/components/setup/ManageAccountsView.tsx`

## Detalhes técnicos
- não vou ampliar escopo para novas features
- não vou mexer em schema, auth provider ou tabelas
- a correção será focada em boot, loading states, guards e contenção de erro
- vou preservar as mensagens em pt-BR

## Resultado esperado
- abrir o projeto não gera mais tela branca
- sessões autenticadas mostram loader ou conteúdo, nunca `null`
- erros do provider social aparecem apenas como aviso tratável
- o preview deixa de parecer quebrado no carregamento inicial