## Problema

Ao clicar em **Editar** na Galeria, o Studio reabre o `design_doc` salvo, mas o resultado fica diferente da imagem na Galeria: texto maior, quebrando em mais linhas, e fora de posição.

**Causa raiz (confirmada lendo `src/pages/Studio.tsx` + `src/components/studio/workspace/types.ts`):**

1. O `design_doc` foi autorado num canvas (ex.: 360×450 — padrão `CANVAS_W/CANVAS_H`) e a imagem final foi exportada desse mesmo canvas via `html2canvas` no `DesignCanvas.tsx`.
2. Hoje, ao abrir para editar, `prepareDesignDocForEdit` mantém `doc.canvas` se ele existir, ou cria um novo canvas a partir das dimensões da imagem final (`canvasFromImageMeta`) — **sem reposicionar/reescalar os elementos**.
3. Quando o canvas atual ≠ canvas em que o design foi autorado, todos os `x/y/w/h/fontSize` dos elementos passam a estar "errados" em relação ao novo canvas → texto desalinhado, quebra de linha diferente, tamanho aparente diferente.
4. Além disso, hoje a imagem final salva **não é usada como fundo** quando há `design_doc`, então o fundo também pode divergir (foto recortada de forma diferente do export).

## Objetivo

Quando o usuário clica **Editar** na Galeria, o Studio abre:
- com a **imagem final da Galeria como fundo do canvas**, no mesmo aspect ratio do export, e
- com **todas as camadas do `design_doc` por cima, alinhadas exatamente** sobre o texto/elementos "queimados" da imagem,
- **tudo continua editável** (texto, posição, cor, fonte, imagem, forma, fundo).

Sem chamar IA, sem regerar imagem, sem gastar créditos, sem duplicar post.

## Mudanças

### 1. `src/components/studio/workspace/types.ts`
Acrescentar um campo opcional `authoredCanvas?: { width: number; height: number }` em `StudioDoc` para guardar o canvas em que o `design_doc` foi originalmente desenhado. Não muda nada existente.

### 2. `src/components/studio/workspace/StudioProvider.tsx` (e pontos de save)
No momento de **salvar** (`saveCreation` / `updateCreation`, em `OutputScreen.tsx`, `PublishDrawer.tsx`, `StudioWorkspace.tsx`, `AutoStudio.tsx`), antes de mandar `designDoc`, garantir que ele leva:
- `canvas: { width, height, aspectRatio }` do canvas atual;
- `authoredCanvas: { width, height }` igual ao canvas usado para gerar a imagem final (mesmo valor — o que importa é registrar com qual base os `x/y/w/h/fontSize` foram autorados).

Isso resolve o problema **para sempre, em novos posts**.

### 3. `src/pages/Studio.tsx` — `prepareDesignDocForEdit`

Reescrever a função para fazer **três coisas**, nesta ordem:

1. **Definir o canvas alvo** = aspect ratio da imagem final da Galeria (`finalImageMeta[0]`). Se não houver, cai no `doc.canvas` salvo. Se nem isso, no fallback 360×450.

2. **Reescalar os elementos** do `design_doc` proporcionalmente do `authoredCanvas` (ou `doc.canvas` legado, ou fallback 360×450 para posts antigos sem registro) para o canvas alvo:
   - `sx = target.width / authored.width`
   - `sy = target.height / authored.height`
   - aplica em `x, y, w, h` de cada `El`;
   - aplica `min(sx, sy)` em `fontSize`, `letterSpacing`, `strokeWidth`, `radius` (escala uniforme para não distorcer tipografia).
   - Não toca em cor, texto, fonte, peso, alinhamento, rotação, opacidade.

3. **Colar a imagem final como fundo** de cada slide:
   - `slide.bgImage = finalImageUrls[i]` (se existir);
   - `slide.bgFit = "cover"` no aspect ratio do próprio export → fica visualmente pixel-perfect com a Galeria;
   - Mantém `slide.els` (já reescalados) por cima. Como as posições agora batem com o canvas, as camadas editáveis ficam exatamente sobre o conteúdo "queimado" da imagem. Visualmente: idêntico à Galeria.

> Resultado prático: o usuário vê a foto da Galeria, com o texto editável posicionado exatamente sobre o texto da foto. Quando edita uma frase, o novo texto cobre o antigo. Pequeno trade-off conhecido: se o texto novo for **mais curto** que o antigo, pode aparecer um leve "fantasma" do texto antigo aparecendo nas bordas. Aceitável dado o pedido (editável + idêntico), e some assim que salvar/re-exportar.

### 4. `src/pages/Gallery.tsx`
Já passa `finalImageUrls` e `finalImageMeta` — apenas garantir que continua passando para **todos** os posts (inclusive os que têm `design_doc`), não só para fallback.

### 5. Compatibilidade com posts antigos
- Posts **com `design_doc` mas sem `authoredCanvas`**: assume `authoredCanvas = doc.canvas ?? { 360, 450 }`. Resolve a maioria dos casos legados.
- Posts **sem `design_doc`**: continua no fallback estático já existente (imagem final como `bgImage`, sem camadas).
- Posts novos salvos após esse fix: sempre com `authoredCanvas` correto → fidelidade perfeita.

### 6. Logs de diagnóstico
Manter / ajustar `[studio:open]` para imprimir: `authoredCanvas`, `targetCanvas`, `scaleX`, `scaleY`, `loadedFrom`, `bgImageApplied`. Sem dados sensíveis.

## Garantias

- ❌ Nenhuma chamada a API de IA, Pexels, OpenAI, Higgsfield, etc.
- ❌ Nenhum crédito gasto.
- ❌ Nenhum post duplicado — `Salvar` continua usando `updateCreation(creationId, …)`.
- ✅ Camadas continuam 100% editáveis (texto, fonte, cor, posição, tamanho, fundo, imagem, forma).
- ✅ Fallback estático preservado para posts antigos sem `design_doc`.

## Arquivos afetados

- `src/pages/Studio.tsx` (lógica de reescala + bgImage)
- `src/components/studio/workspace/types.ts` (campo `authoredCanvas`)
- `src/components/studio/workspace/StudioWorkspace.tsx`
- `src/components/studio/workspace/OutputScreen.tsx`
- `src/components/studio/workspace/PublishDrawer.tsx`
- `src/components/studio/workspace/AutoStudio.tsx`
- `src/pages/Gallery.tsx` (garantir passagem de `finalImageUrls`/`Meta` sempre)
