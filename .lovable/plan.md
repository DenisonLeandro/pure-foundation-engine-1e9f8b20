## Por que a galeria fica "horrível" mas o editor está perfeito

A galeria não renderiza o post — ela só exibe o **PNG que foi salvo no banco na hora em que o post foi criado** (`creations.urls[]` e `thumbnail_url`, gerados por `renderDocOffscreen` naquele momento).

Ou seja:
- **Editor:** renderiza ao vivo a partir do `design_doc` + logo atual do storage → sempre mostra o resultado com as regras mais novas (tamanho da logo, qualidade, etc.).
- **Galeria:** mostra um PNG estático, congelado. Se o post foi criado ANTES da última correção da logo, ele carrega para sempre com a logo pequena/embaçada — mesmo que você reabra e edite, o thumbnail só troca se você **re-salvar** o post.

Isso explica exatamente o print: o mesmo post aparece com logo pequena na galeria (arquivo antigo) e com logo maior/nítida quando aberto (renderizado com as regras novas dentro do fluxo do editor/preview).

Além disso, encontrei um bug menor em `src/pages/Gallery.tsx`: a tag `<img>` do thumbnail está **duplicada** (linhas 641–651 e 665–675). Não é a causa da baixa qualidade, mas está renderizando duas camadas sobrepostas no card.

## Correção proposta (2 partes)

### 1. Regenerar os thumbnails desatualizados (fix definitivo)
Quando a galeria for aberta, para cada post que:
- tenha `design_doc`, e
- tenha layer `brand_logo` com layout antigo (`docHasCurrentBrandLogo(doc, currentBrandLogoUrl) === false`),

executar em background:
1. `applyBrandLogo(doc, currentLogoUrl)` para atualizar a logo.
2. `renderDocOffscreen(doc, brand)` para gerar os PNGs novos.
3. `updateCreation(id, { urls, thumbnailUrl, designDoc })` para persistir.

Detalhes:
- Fila serial (1 por vez) com limite de N regenerações por sessão para não travar a UI.
- Sinalizador local (`Set<id>` em memória) para não reprocessar duas vezes na mesma sessão.
- Não regenera posts sem `design_doc` (impossível — só existe a imagem final).
- Não regenera posts publicados/agendados sem confirmação, para não alterar arte já divulgada.
- Toast discreto ao terminar ("Miniaturas atualizadas: N").

### 2. Corrigir o `<img>` duplicado no card
Em `src/pages/Gallery.tsx`, remover o segundo bloco `<img>` (linhas 665–675) — sobra apenas o primeiro.

## Fora de escopo
- Não muda o pipeline de criação (`renderDocOffscreen`, tamanho da logo etc.), que já foi corrigido no turno anterior.
- Não altera posts publicados/agendados.
- Não muda o upload da logo em Marcas nem o `brand_profiles.logo_url`.

## Arquivos a alterar
- `src/pages/Gallery.tsx` — remover `<img>` duplicado + gatilho de regeneração em background.
- Novo `src/lib/gallery-refresh.ts` (ou similar) — helper `refreshOutdatedThumbnails(creations, brand)` encapsulando fila/verificação/persistência.
