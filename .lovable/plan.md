## Problema

No modo **"IA cria a arte completa"** (`AiArtStudio`), a IA gera a arte e o app **carimba a logo real da marca no canto superior esquerdo via canvas** antes de salvar na Galeria. Ou seja, a imagem salva já tem a logo pintada dentro.

Quando o usuário abre esse post no Studio para publicar, o `StudioWorkspace` roda um efeito que **aplica automaticamente uma camada `brand_logo` sobre a imagem** — resultado: **duas logos** (a pintada dentro da imagem + a camada nova).

O guarda atual (`if (editingCreationId && !hasLogo) return;`) não protege esse caso: a criação salva pelo AiArtStudio não tem `designDoc`, então o Studio abre um doc de fallback com `els: []` (sem camada `brand_logo`), o efeito considera "não tem logo ainda" e adiciona a camada por cima da imagem já com logo.

O usuário quer manter a IA gerando/embutindo a logo e apenas remover a duplicação.

## Fix (escopo mínimo, só apresentação)

Sinalizar que o post do AiArtStudio já tem a logo embutida e fazer o Studio pular a aplicação automática nesses casos.

### 1. `src/components/studio/workspace/types.ts`
Adicionar campo opcional `logoBaked?: boolean` em `StudioDoc`. Marca "a logo já está pintada dentro das imagens deste doc — não sobrepor camada".

### 2. `src/components/studio/workspace/AiArtStudio.tsx`
No `handleSave`, montar um `designDoc` mínimo e enviá-lo para `saveVisualToGallery`:
- `format: "post"`, `brandId`, `canvas` derivado das dimensões da imagem (1024×1280),
- 1 slide com `bgImage: resultUrl` (imagem composta) e `els: []`,
- `logoBaked: true`,
- `caption: ""`, `hashtags: []`, `platforms: []`, `schedule: { when: "now" }`.

Isso garante que, ao reabrir da Galeria, o `prepareDesignDocForEdit` carregue o doc com a marcação preservada.

### 3. `src/components/studio/workspace/StudioWorkspace.tsx`
No efeito que aplica a logo (linhas ~169–180), incluir guarda no topo:
```ts
if (doc.logoBaked) return;
```
Também tratar como "já tem logo" em `docHasBrandLogo` conceitualmente: como o efeito já sai, basta o `return` cedo — sem outras mudanças.

### 4. Fallback para posts antigos do AiArtStudio
Criações salvas antes deste fix não têm `designDoc` nem `logoBaked`. Para elas, quando abertas por `buildStaticFallbackDoc` (Studio.tsx), detectar heurística simples: se `nav.title === "Studio · IA completa"` (templateName usado pelo AiArtStudio) → setar `logoBaked: true` no doc de fallback. Uma linha em `buildStaticFallbackDoc`.

## Fora de escopo

- Nenhuma mudança em edge functions, banco, prompts da IA ou fluxo de publicação.
- A composição (canvas + baked logo) do AiArtStudio continua exatamente como está — usuário pediu para manter.
- Outros modos do Studio (Modo 2 / assistido / auto) continuam aplicando a camada de logo normalmente.

## Verificação

1. Gerar um post no modo "IA cria tudo" com marca com logo → salvar na Galeria.
2. Abrir esse post na Galeria → clicar em editar/postar → confirmar visualmente **uma única logo**.
3. Gerar um post no Modo 2 (assistido, com imagem stock) → confirmar que a camada de logo continua sendo aplicada (não regride).
