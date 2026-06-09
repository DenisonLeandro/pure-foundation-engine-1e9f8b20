## Problema identificado
A tela branca acontece no reabrir da app já caindo em rota interna (`/dashboard`), e o ponto mais suspeito é o boot autenticado/hidratação inicial entre `AuthProvider`, `AppProvider`, `RequireAuth`, `RequireOnboarding` e `AppLayout`.

**Do I know what the issue is?**
Ainda não com 100% de certeza, mas já isolei o problema para o fluxo de inicialização/autenticação, não para caption, imagens, nem APIs do Studio.

## Arquivos isolados
- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/contexts/AppContext.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/layout/AppSidebar.tsx`

## O que vou implementar
1. **Unificar o gate de boot da app**
   - Garantir uma decisão única e determinística antes de renderizar rotas internas.
   - Evitar estados intermediários em que auth já resolveu, mas config/onboarding ainda não.

2. **Blindar hidratação de sessão e config**
   - Ajustar o fluxo para que o carregamento de config dependa do estado real de sessão validado.
   - Remover a possibilidade de rota interna montar com dados de boot ainda indefinidos.

3. **Eliminar render “vazio” em refresh/reopen**
   - Trocar qualquer caminho implícito que hoje possa deixar layout/rotas sem conteúdo por fallback visual explícito.
   - Garantir que `/`, `/dashboard` e demais rotas internas sempre caiam em: loader, redirect válido ou conteúdo.

4. **Adicionar instrumentação mínima de diagnóstico**
   - Inserir logs pontuais no boot para capturar o estado exato se o problema voltar.
   - Foco em transições de sessão, config e redirects.

5. **Validar os cenários críticos**
   - Abrir raiz `/`
   - Abrir `/dashboard` diretamente
   - Reabrir com sessão existente
   - Sessão ausente/deslogada

## Detalhes técnicos
- O padrão encontrado na investigação e na busca externa bate com problemas de **lazy routes + redirects + hidratação assíncrona** gerando tela branca/intermitente em refresh.
- O ajuste será **somente no fluxo de inicialização/roteamento**.
- Não vou mexer em autenticação funcional, regras de negócio, caption generation, seleção de imagens, armazenamento de chaves, CORS ou edge functions.

## Resultado esperado
Ao reabrir o projeto, a app deve sempre mostrar:
- login, ou
- setup, ou
- dashboard/layout

Nunca uma tela branca sem feedback.