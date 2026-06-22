## Por que apareceram 6 rascunhos iguais

Cada um desses 6 cartões é uma **criação nova** salva na Galeria — mesmo conteúdo, IDs diferentes (`24e4ccb0`, `762da1a6`, `cbd6f066`, `b5648996`, etc.), todos com o mesmo `prompt` e gerados entre 12:54 e 13:33 de hoje, na mesma empresa.

A causa está no fluxo de salvar do Studio:

1. **`OutputScreen` (Resultado automático)** — o botão "Salvar na galeria" chama `saveVisualToGallery(...)` direto (linha 185), **sem rastrear `creationId`**. Cada clique cria um registro novo.
2. **`StudioWorkspace` (Refinar no canvas)** — `handleSaveToGallery` só atualiza se já existir `creationId` no estado local. Quando você entra pelo "Refinar no canvas" a partir do Output, o `creationId` da entrada anterior **não é propagado**, então o primeiro save vira uma **nova** linha em vez de atualizar a que já estava na galeria.
3. **Auto-save / regenerações** — quando você muda estilo, regenera ou salva de novo após pequenas edições, o ciclo se repete e cada passada vira mais um rascunho.

Resultado: 1 conteúdo → várias linhas (umas viraram "Publicado" quando você postou, as outras ficaram "Rascunho").

Não é o autopilot, não é cron e não é bug do banco — é o Studio criando uma nova `creation` toda vez em vez de atualizar a existente.

## Como corrigir (proposta — peça "implementar" para aplicar)

Objetivo: 1 sessão de design = 1 entrada na Galeria. Salvar de novo deve **atualizar**, não duplicar.

### 1. Propagar `creationId` do Output para o canvas
- Em `OutputScreen.tsx`, ao salvar (linha 185), guardar o `saved.id` retornado num ref/estado e usar `updateCreation` em cliques subsequentes do mesmo "Salvar".
- Ao chamar `onEditInCanvas(doc)` (linha 201), passar também esse `creationId` para o `StudioWorkspace` inicializar `setCreationId(...)`. Assim "Salvar" no canvas atualiza a mesma linha em vez de criar outra.

### 2. Limpar os 5 rascunhos duplicados existentes
Manter o mais recente de cada grupo (ou o publicado, se houver) e apagar os demais. Concretamente, na sua empresa, manter:
- `b864342d` (publicado) e `efc0efdb` (publicado)
- E apagar os 4 rascunhos duplicados: `24e4ccb0`, `762da1a6`, `cbd6f066`, `b5648996`.

Faço isso via `DELETE` direto na tabela `creations`, com aprovação sua antes de rodar.

### 3. (Opcional) Guard de deduplicação no `saveVisualToGallery`
Antes de inserir, verificar se já existe nas últimas X horas uma `creation` com mesmo `company_id` + mesmo `prompt` (hash) + mesmo conjunto de `urls`. Se sim, retornar a existente em vez de criar. Rede de segurança caso a propagação do `creationId` falhe.

## Escopo
- **Frontend apenas** nas correções 1 e 3 (`OutputScreen.tsx`, `StudioWorkspace.tsx`, `lib/gallery.ts`). Sem mudanças em edge functions, autopilot, RLS ou schema.
- **Limpeza** (item 2): um único `DELETE` na tabela `creations`, com sua aprovação.

Me diga se quer:
- (a) só limpar os 4 duplicados agora, ou
- (b) limpar + aplicar a correção do fluxo (recomendado), ou
- (c) limpar + correção + guard de deduplicação (mais robusto).
