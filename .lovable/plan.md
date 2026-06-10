# Plano para corrigir a tela branca

## Objetivo
Eliminar o estado em que o app abre com tela totalmente branca ao reabrir o projeto, sem mexer em autenticação, geração de legenda, seleção de imagem, CORS ou lógica de negócio fora do boot/renderização.

## O que vou fazer
1. Ajustar o gate de inicialização das rotas internas
   - Revisar a sequência entre `AuthProvider`, `AppProvider`, `RootRedirect`, `RequireAuth`, `RequireOnboarding` e `AppLayout`.
   - Garantir que nenhuma rota interna possa cair num estado intermediário que renderize vazio.

2. Corrigir o fluxo de redirecionamento para `/setup?manage=1`
   - Hoje `/studio` pode acabar redirecionando para `/setup?manage=1`.
   - Vou tornar esse redirecionamento determinístico para evitar flicker, loop ou frame vazio durante a troca de rota.

3. Remover caminhos de renderização invisíveis
   - Revisar `Setup`, `AppLayout` e a lógica de loader para garantir que sempre exista conteúdo visível enquanto o app decide a rota.
   - Se houver estado transitório ambíguo, substituir por loader/placeholder explícito em vez de renderização “em branco”.

4. Validar o cenário exato do bug
   - Testar as rotas críticas: `/`, `/studio`, `/dashboard` e `/setup?manage=1`.
   - Verificar console, rede e preview para confirmar que a página não fica mais vazia.

## Arquivos mais prováveis
- `src/App.tsx`
- `src/contexts/AppContext.tsx`
- `src/contexts/AuthContext.tsx`
- `src/pages/Setup.tsx`
- `src/components/layout/AppLayout.tsx`

## Achado principal da investigação
- No meu teste, `/studio` não ficou realmente vazio: ele redirecionou para `/setup?manage=1`, e essa tela renderizou normalmente.
- Isso indica que o problema mais provável está no estado transitório de boot/redirecionamento, não no conteúdo do Studio em si.

## Fora de escopo
- Autenticação e provedores
- Armazenamento de chaves
- Caption generation
- Seleção de imagens
- Edge functions e integrações externas

## Resultado esperado
Ao reabrir o projeto, o app deve sempre mostrar uma tela válida visível (loader, setup, dashboard ou studio), sem cair numa página totalmente branca.

## Detalhes técnicos
- Fortalecer guards de rota para evitar `Navigate` em cascata durante `loading/configLoading`
- Garantir que o modo manage do `Setup` não dependa de estado ainda não hidratado
- Centralizar a decisão de rota inicial para impedir transições sem renderização