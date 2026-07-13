## Objetivo
Permitir reagendar (alterar data/hora) e excluir posts agendados **direto pela página Agenda**, sem abrir o Studio. Assim dá para, por ex., manter 1 dos 3 posts de hoje e mover os outros para outro dia com poucos cliques.

## Escopo (o que muda)
Somente frontend + um wrapper de API. Nada de banco, edge functions ou lógica do Autopilot.

### 1. `src/lib/api/postforme.ts`
Adicionar wrapper que já existe no proxy (`pfm_update_post`, PUT `/social-posts/:id`):
```ts
export async function pfmUpdatePost(id: string, data: Record<string, unknown>): Promise<any> {
  return callPfm("pfm_update_post", { id, data });
}
```
Usado para enviar `{ scheduled_at: "<ISO>" }` ao Post for Me. Excluir já existe (`pfmDeletePost`).

### 2. `src/pages/Schedule.tsx` — UI de reagendamento
Comportamento novo ao clicar num post (tanto no card de "Próximos Posts" quanto no chip do calendário):

- Abrir um **Dialog "Reagendar post"** (shadcn `Dialog`) com:
  - Preview da legenda (read-only, 3 linhas).
  - Campo **Data** (`<input type="date">`) e **Hora** (`<input type="time">`) já preenchidos com o `scheduled_at` atual (fuso local do navegador).
  - Botões: **Cancelar**, **Excluir** (com confirmação), **Salvar novo horário** (primário).
- Ao salvar: monta ISO a partir de data+hora local, chama `pfmUpdatePost(post.id, { scheduled_at })`, toast de sucesso/erro e `postsQuery.refetch()`.
- Ao excluir: usa o fluxo já existente (`pfmDeletePost`) e fecha o modal.
- Manter opção **"Duplicar"** já existente como um botão secundário no rodapé do dialog (redireciona ao Studio como hoje).
- Remover o clique-abre-Studio direto; agora o Studio só é aberto explicitamente via "Duplicar/Editar conteúdo" dentro do dialog (rótulo: **Editar conteúdo no Studio**).

Nenhuma outra tela é alterada.

### 3. Fuso horário
Usar horário local do navegador para popular/ler os inputs e converter para ISO com `new Date(y, m, d, h, min).toISOString()`. Sem dependência nova.

### 4. Tratamento de erro
Se `pfmUpdatePost` falhar (ex.: PFM auth expirado), mostrar toast com a mensagem; reaproveita `isPfmAuthError` já importado — se for auth, sugerir reconectar (mensagem, sem mudar de rota automaticamente).

## Fora do escopo
- Não altero edge functions, banco, `autopilot_posts`, nem `pfm_update_post` no proxy (já está pronto).
- Não implemento drag-and-drop no calendário (posso adicionar depois se você quiser).
- Não mexo em Studio, Autopilot, nem em posts já publicados.

## Verificação
1. Abrir /schedule, clicar num post agendado → dialog abre com data/hora atuais.
2. Alterar para outro dia/hora, Salvar → toast "Post reagendado", card some do dia antigo e aparece no novo.
3. Clicar em Excluir dentro do dialog → post some da agenda.
4. Repetir com 3 posts do mesmo dia: manter 1, mover 2 para outra data — confirmar visualmente no calendário.
