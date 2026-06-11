# Etapas 1–4: Design editável na Galeria (sem IA ainda)

A migração `ALTER TABLE creations ADD COLUMN IF NOT EXISTS design_doc JSONB NULL` **já foi aplicada**. Resta o código abaixo. Chat IA fica para depois.

## O que vai mudar

### 1. `src/lib/gallery.ts`
- Novo tipo `EditableDesignDoc = { schemaVersion: number; ...StudioDoc }`
- Constante `DESIGN_DOC_SCHEMA_VERSION = 1`
- Função `sanitizeDesignDoc(input)`: clona, força `schemaVersion`, e remove qualquer string `data:` ou `blob:` (sem base64 no JSON)
- `Creation.designDoc?: EditableDesignDoc | null`
- `saveCreation` / `updateCreation` / `saveVisualToGallery` passam a aceitar `designDoc` opcional e gravar no campo `design_doc`
- `mapRow` retorna `designDoc` quando presente

### 2. Studio passa a salvar o doc junto da imagem
- `AutoStudio.autoSave` → inclui `designDoc: sanitizeDesignDoc(doc)` (best-effort, não bloqueia)
- `PublishDrawer` (auto-save ao abrir) → idem
- `OutputScreen` (caminho já existente de save) → idem

Nada muda nos fluxos de publicação/agendamento — Post for Me e Blotato continuam recebendo só URLs de imagem.

### 3. `src/pages/Gallery.tsx` — botão "Editar design"
- Novo botão `Pencil` no overlay do card (ao lado dos atuais — nenhum é removido)
- Clique:
  - Se `creation.designDoc` existe → `navigate("/studio", { state: { designDoc, creationId } })`
  - Se não existe → `toast` "Este item foi gerado como imagem estática" + botão de ação "Criar versão editável" que navega com `{ fallbackImageUrl: creation.urls[0], creationId }`

### 4. `src/pages/Studio.tsx` — aceitar o doc via nav state
- Lê `designDoc`, `creationId`, `fallbackImageUrl` do `useLocation().state`
- Se `designDoc` → abre direto no modo `assisted` com `initial = designDoc` (já suportado)
- Se só `fallbackImageUrl` → cria doc vazio com a imagem como `bgImage` do primeiro slide
- Passa `creationId` para o `StudioWorkspace`

### 5. `StudioWorkspace.tsx` — botão "Salvar alterações"
- Aceita prop `creationId?: string`
- Quando presente, mostra botão "Salvar alterações" na top-bar (ao lado de Postar/Agendar)
- Ação:
  1. `urls = await exportSlides()` (reusa o exportador atual → PNG)
  2. `await updateCreation(creationId, { urls, thumbnailUrl: urls[0], designDoc: sanitizeDesignDoc(doc) })`
  3. Toast "Design atualizado"
- Postar/Agendar continua igual

## Garantias de não-regressão
- Itens antigos (`design_doc = null`) → exibem, baixam, publicam, agendam exatamente como hoje
- Botões existentes da Galeria (Ver, Usar em Post, Baixar, Excluir) permanecem
- Migração é não destrutiva (`ADD COLUMN IF NOT EXISTS`)
- Sem `data:` / `blob:` URLs no JSON (regra obrigatória)
- `schemaVersion: 1` em todo doc gravado → permite evoluir o editor sem quebrar leituras antigas
- AppContext, AuthContext, rotas, edge functions: **intocados**
- Chat IA de edição: **fora desta entrega**

## Como vou testar depois de implementar
1. Gerar post novo no Studio → conferir na Galeria que o card tem botão "Editar design"
2. Clicar "Editar design" → Studio abre com o doc carregado, textos no lugar
3. Mover um texto / mudar cor → clicar "Salvar alterações" → toast OK
4. Voltar à Galeria → thumbnail atualizado
5. Em um item antigo (sem designDoc) → botão mostra toast informativo + opção "Criar versão editável" usando a imagem como fundo
6. Publicar/agendar um item normal → fluxo Post for Me/Blotato inalterado

## Arquivos alterados
- `src/lib/gallery.ts`
- `src/pages/Gallery.tsx`
- `src/pages/Studio.tsx`
- `src/components/studio/workspace/StudioWorkspace.tsx`
- `src/components/studio/workspace/AutoStudio.tsx`
- `src/components/studio/workspace/PublishDrawer.tsx`
- `src/components/studio/workspace/OutputScreen.tsx`

Nenhum arquivo novo. Nenhuma edge function tocada.