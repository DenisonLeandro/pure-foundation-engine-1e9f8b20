## Problema

Ao abrir da Galeria, no Studio (canvas), aparecem 2 logos: a que a IA já carimbou dentro da imagem + uma segunda camada `brand_logo` sobreposta pelo Studio.

O ajuste anterior marcava `logoBaked: true` em posts novos do "IA cria a arte completa" e adicionava um guard no `useEffect` de logo. Ainda assim a segunda camada está aparecendo — provável causa: em algum caminho o `logoBaked` não sobrevive (sanitize/persist em cadeia, dedup por prompt em `saveVisualToGallery`, ou o post foi salvo antes do fix chegar). O `useEffect` do StudioWorkspace então roda `applyPreparedBrandLogo` porque o doc não tem `logoBaked` nem camada `brand_logo` pré-existente.

## Correção (defensiva, em 3 camadas)

### 1. `src/pages/Studio.tsx` — normalizar o doc de entrada

Antes de entregar o doc ao `StudioProvider`, aplicar uma função `stampLogoBakedIfAiArt(nav, doc)` em **ambos** os caminhos (`prepareDesignDocForEdit` e `buildStaticFallbackDoc`) que:

- Detecta um post de "IA cria a arte completa" por qualquer um destes sinais:
  - `nav.title === "Studio · IA completa"` (templateName da Galeria).
  - `doc.logoBaked === true` (posts salvos pelo fix anterior).
  - `doc.canvas?.source === "finalImage"` (marcador que o AiArtStudio grava).
  - Doc "estático": todos os slides sem `els` editáveis e com `bgImage` presente em `nav.finalImageUrls`.
- Quando detectado: força `logoBaked: true` **e** remove qualquer `el` com `role === "brand_logo"` de todos os slides (limpeza defensiva, caso alguém tenha sobreposto no passado).

### 2. `src/components/studio/workspace/StudioWorkspace.tsx` — endurecer o guard

O `useEffect` que aplica a logo passa a checar, além de `doc.logoBaked`:

- Se todos os slides já têm `bgImage` **e** nenhum tem `els` editáveis não-logo (fallback estático), não aplica logo. Isso cobre posts antigos abertos como imagem final onde a logo já está queimada no PNG.
- Mantém o retorno antecipado original.

### 3. `src/components/studio/workspace/AiArtStudio.tsx` — garantir persistência do flag

- Continuar salvando `logoBaked: true` no designDoc.
- Adicionalmente marcar `canvas.source: "finalImage"` (já está) para que o passo 1 do Studio detecte mesmo se o campo `logoBaked` for perdido em alguma normalização futura.
- Nenhuma outra mudança de lógica.

## Fora de escopo

- Não altera a composição da logo dentro do AiArtStudio (a IA continua carimbando).
- Não muda edge functions, DB, publish drawer, `renderDocOffscreen` nem `gallery-refresh`.
- Não afeta posts editáveis normais (com `els` de texto/forma) — o guard só age quando o slide é uma imagem final com logo queimada.

## Como validar

1. Abrir "IA cria a arte completa", gerar arte, salvar.
2. Ir na Galeria → clicar Editar no post recém-criado.
3. Canvas do Studio deve mostrar **apenas 1 logo** (a queimada pela IA), sem selo extra no canto.
4. Repetir com um post antigo do mesmo modo (templateName "Studio · IA completa") — mesmo comportamento.
