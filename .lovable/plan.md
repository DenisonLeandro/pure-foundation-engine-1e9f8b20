## Título dos posts em todo lugar que mostra "Post #abc12345"

Hoje a Galeria e o seletor de "Vincular post" em `/artigos` mostram `Post #abc12345` porque `creations` não tem campo de nome. Vamos adicionar título editável + geração por IA e usar esse título em todas as listagens.

### 1. Banco
Migration: adicionar coluna `title text` (nullable) em `public.creations`. Sem default — quando vazio, fallback `Post #abc12345`.

### 2. Camada de dados
- `src/lib/gallery.ts`: incluir `title?: string` no tipo `Creation` e permitir `title` em `updateCreation`.
- Helper compartilhado `getCreationLabel(creation)` que retorna `title?.trim() || "Post #" + id.slice(0,8)` — usado pela Galeria e por `/artigos`.

### 3. UI da Galeria (`src/pages/Gallery.tsx`)
- `CreationCard`: exibe `getCreationLabel(creation)` em vez do id slice.
- Botão **Renomear** (ícone `Pencil`) no overlay do card (só fora do modo seleção), ao lado de Excluir.
- Abre `Dialog` com:
  - `Input` com o título atual.
  - Botão **"Gerar com IA"** (ícone `Sparkles`) — chama `aiAssist` pedindo um título curto em pt-BR (máx ~60 chars, sem aspas/emojis), construído a partir de `caption`, `prompt` e `template_name` do post; preenche o input.
  - Botões **Cancelar** / **Salvar** — Salvar chama `updateCreation(id, { title })`, atualiza estado local, mostra toast.

### 4. Página de Artigos (`src/pages/Articles.tsx`)
- Trocar `Post #${c.id.slice(0, 8)}` por `getCreationLabel(c)` nos dois `<Select>` (Artigo Manual + Gerar de Post).
- Resultado: o usuário vê o nome real do post na hora de vincular.

### Detalhes técnicos
- Prompt da IA (system): "Você cria títulos curtos em português do Brasil para posts de redes sociais. Responda apenas com o título, sem aspas, sem emojis, máximo 60 caracteres."
- Input do usuário: `caption` (primeiros ~500 chars) + `prompt` + `template_name`; fallback "Post de rede social" se tudo estiver vazio.
- `title` é trimmed e limitado a 120 chars antes de salvar; trim do retorno da IA também remove aspas externas se vierem.

### Arquivos afetados
- Nova migration (add coluna `title` em `creations`).
- `src/lib/gallery.ts` — tipo + `updateCreation` + helper `getCreationLabel`.
- `src/pages/Gallery.tsx` — exibição do título, botão Renomear, Dialog com gerar-por-IA.
- `src/pages/Articles.tsx` — usar `getCreationLabel` nos seletores.
