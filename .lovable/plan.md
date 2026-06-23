# Parar de duplicar posts na Galeria

## O que vai acontecer (resumo)
- Limpeza única no banco: para cada grupo de posts repetidos (mesma empresa + mesmo conteúdo/prompt), fico com **uma cópia só** — a mais recente — e apago as edições antigas.
- Nada de publicação é perdido: se qualquer cópia do grupo estava **Publicado**, a cópia que sobra herda esse status. Agendamentos do Post for Me ficam intactos (ficam no serviço externo, não no banco) e o vínculo com Artigos é transferido pra cópia que sobra antes do delete.
- Daqui pra frente: abrir o painel de publicar e republicar **não cria linha nova** — atualiza a mesma. Cada post da Galeria vira "um post" com histórico, não 4 cards iguais.

## Como vou fazer (técnico)

### 1. Migração SQL (uma vez só)
1. Transferir vínculos antes de apagar:
   - `articles.linked_creation_id` → repontar pro `id` "vencedor" do grupo.
   - `autopilot_posts.visual_creation_id` (text) → idem.
2. Eleger vencedor por grupo `(company_id, prompt)` onde `prompt is not null`:
   - vencedor = `MAX(created_at)` (cópia mais recente, com as últimas edições).
   - antes de apagar, fazer `UPDATE` no vencedor: `published = bool_or(published)` e `caption = coalesce(vencedor.caption, qualquer caption não vazia do grupo)` pra não perder legenda editada.
3. `DELETE FROM creations` das cópias perdedoras.
4. Criar índice único parcial pra travar duplicação futura:
   ```sql
   CREATE UNIQUE INDEX creations_unique_per_company_prompt
   ON public.creations (company_id, md5(prompt))
   WHERE prompt IS NOT NULL AND company_id IS NOT NULL;
   ```
   Posts sem prompt (uploads avulsos) continuam livres — não trava nada legítimo.

### 2. `src/components/studio/workspace/PublishDrawer.tsx`
- Hoje o `useEffect` chama `saveVisualToGallery` **toda vez que o drawer abre**. Vou:
  - Guardar `creationId` em `useRef` da sessão do drawer.
  - Salvar só **uma vez** por sessão; nas próximas aberturas com o mesmo `doc`, reutilizar o id.
  - Passar `creationId` pro `PublishPanel`.

### 3. `src/lib/gallery.ts` — `saveVisualToGallery`
- Antes de inserir, fazer `select id from creations where company_id = ? and prompt = ? limit 1`.
- Se achar: chamar `updateCreation(id, { urls, designDoc, caption, thumbnailUrl })` e devolver o existente.
- Se não achar: inserir normalmente.
- Isso cobre também o caminho do Autopilot e qualquer outro lugar que use a função.

### 4. `src/components/studio/PublishPanel.tsx` e `src/components/studio/workspace/OutputScreen.tsx`
- Aceitar prop opcional `creationId?: string`.
- No `publish()`:
  - Se `creationId` veio: ao concluir, chamar `markAsPublished(creationId)` direto — **não** chamar `saveUploadToGallery(hosted)` nem `markAsPublishedByUrls(hosted)` (que falhavam porque a URL hospedada no PFM é nova e nunca casava, deixando a linha como "Rascunho" pra sempre).
  - Se não veio (fluxo legado): manter o comportamento atual.

## O que **não** vou mexer
- Tabela `autopilot_posts` e o cron — agendamentos do Autopilot ficam como estão.
- Agendamentos no Post for Me — vivem no serviço externo, a limpeza do banco não os toca.
- Uploads avulsos sem `prompt` (não entram no índice único, continuam podendo ter múltiplas linhas).

## Resultado esperado
- A Galeria atual com ~4 cópias de cada post passa a mostrar **1 card por post**, mantendo o status "Publicado" onde havia.
- Republicar/reagendar atualiza o mesmo card em vez de criar novos.
- Se o banco rejeitar uma inserção duplicada por engano (índice único), o app trata como atualização e segue sem erro.
