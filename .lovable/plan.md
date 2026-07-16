Analisei o código e identifiquei que **os 3 problemas estão conectados** — o #3 (recarregar ao voltar da aba) na verdade agrava o #1, porque ao voltar pra aba o Studio remonta e re-abre o post errado. Por isso a ordem certa começa pelo #3.

## Ordem proposta

### 1º — Problema #3: app recarrega ao voltar para a aba

**Causa raiz** (encontrada em `src/contexts/AppContext.tsx` linhas 230-244 e no replay/console):
- O Supabase re-emite eventos `SIGNED_IN` / `TOKEN_REFRESHED` sempre que a aba volta ao foco.
- No `AppContext`, todo evento `SIGNED_IN` chama `setConfigLoading(true)` → o `PageLoader` toma a tela inteira → o `<Studio/>` (e qualquer outra página) é **desmontado**, perdendo todo o estado em memória (texto que você digitou, seleção, slide atual etc).
- Ao remontar, o Studio tenta restaurar do rascunho local (`loadLatestStudioDraft`), que pode estar defasado — daí a sensação de "voltou pra onde tava antes, mas errado".

Isso é visível no seu log: `carregando config (SIGNED_IN)` aparece toda vez que você troca de aba, e no session replay a tela "Carregando... Preparando sua área de trabalho." reaparece várias vezes.

**Correção (sem mudar funcionalidade)**:
- No `AppContext`, tratar `SIGNED_IN` que chega **depois** do primeiro carregamento como um `TOKEN_REFRESHED` silencioso: recarregar config em background **sem** setar `configLoading=true` (que é o que dispara o PageLoader e desmonta a árvore).
- Só bloquear UI no primeiro `INITIAL_SESSION` / `getSession`. Depois disso, revalidações são silenciosas.
- Fazer o mesmo tratamento em `AuthContext` (evitar re-render que force `loading=true`).

Resultado: você troca de aba, volta, e o Studio (e todas as outras telas) continua exatamente como estava.

### 2º — Problema #1: post agendado abre em tela roxa aleatória

**Causa raiz** (em `src/pages/Schedule.tsx` linha 140-142 e `src/pages/Studio.tsx` linha 149-184):
- Posts agendados são armazenados no Post for Me (só têm `caption` + `media urls`, não têm o `design_doc` original).
- A ação atual só faz `navigate("/studio", { state: { sourceContent: post.caption } })` — sem `designDoc`, sem `creationId`, sem `mediaUrls`.
- Sem `designDoc`, o Studio cai no fluxo padrão: `emptyDoc()` → gera um `blankSlide()` com **gradiente roxo/fúcsia** (`#8b5cf6 → #d946ef`) e texto placeholder "Toque para editar". Esse é exatamente o "tela roxa com título aleatório" que você vê.

**Correção (sem mudar funcionalidade)**:
- Ao criar o post pelo Autopilot / Studio, gravar na tabela de posts (autopilot_posts / gallery_creations) o link entre o `pfm_post_id` e o `creationId` original (que já contém o `design_doc` completo).
- No Schedule, adicionar botão **"Editar com Studio"** que:
  1. Busca o `creationId` associado ao post agendado.
  2. Carrega o `design_doc`, `finalImageUrls`, `caption` da Galeria.
  3. Navega para `/studio` com `state: { mode: "edit", creationId, designDoc, finalImageUrls, caption, ... }` — o Studio já sabe reabrir corretamente nesse formato (ver `prepareDesignDocForEdit` em `Studio.tsx`).
- Se um post agendado antigo não tiver esse vínculo, exibir uma mensagem clara ("Este post foi agendado antes da atualização — abra a Galeria para editar") em vez de abrir uma tela roxa.

### 3º — Problema #2: analytics do Facebook zerado

**Correção (sem mudar funcionalidade)**:
- Vou investigar `supabase/functions/social-analytics/index.ts` e o hook de analytics para identificar por que os dados do Facebook chegam zerados enquanto o Instagram vem certo.
- Suspeitas iniciais (a confirmar): (a) o provider da Apify para Facebook está com o ator errado / retornando payload sem os campos esperados; (b) o mapeamento normaliza `page_likes`/`followers_count` só para o Instagram e ignora o campo equivalente do Facebook; (c) faltam credenciais / URL do perfil do Facebook no `profile_urls` da empresa.
- A correção será localizada no edge function e no normalizador — sem tocar em UI nem alterar a interface pública.

## O que quero confirmar antes de tocar em código

1. Você aprova começar pelo **#3** (recarregar ao voltar), depois **#1** (editar com Studio), depois **#2** (Facebook analytics)?
2. Para o #1: no post agendado, você prefere um botão **"Editar com Studio"** separado, ou que **clicar no card** já abra o Studio direto (em vez do dialog de reagendar)?
3. Para o #2: você pode me dizer qual conta do Facebook está conectada (nome da página) para eu poder consultar o log do `social-analytics` e ver o payload que a Apify está devolvendo?

Depois que você aprovar essa ordem e responder as perguntas, eu volto com um plano detalhado do primeiro item para você aprovar antes de codar qualquer coisa — como você pediu.