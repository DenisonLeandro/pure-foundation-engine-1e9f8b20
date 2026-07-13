## Problema

O reagendamento retorna `Invalid Request` porque o `PUT /v1/social-posts/{id}` do Post for Me exige o **`CreateSocialPostDto` completo** (caption, social_accounts, media, etc.) — não aceita PATCH parcial. Hoje enviamos só `{ scheduled_at }`, então a API rejeita.

## Solução

Antes do PUT, buscar o post atual e mesclar os campos, sobrescrevendo apenas `scheduled_at`.

### 1. `src/lib/api/postforme.ts`
- Adicionar `pfmGetPost(id)` que chama o endpoint já existente `pfm_get_post` no proxy.

### 2. `src/pages/Schedule.tsx` — `handleSaveReschedule`
Sequência nova:
1. `const current = await api.pfmGetPost(editing.id)` (fonte da verdade, com `account_configurations`, `platform_configurations`, `media` etc.).
2. Montar payload apenas com os campos aceitos pelo `CreateSocialPostDto`:
   - `caption`
   - `social_accounts` (extraindo `id` caso venha como objeto)
   - `media` (mantendo `{ url }`)
   - `platform_configurations` (se existir)
   - `account_configurations` (se existir)
   - `scheduled_at`: **novo ISO** montado a partir de `editDate` + `editTime`
   - `isDraft: false`
3. `await api.pfmUpdatePost(editing.id, payload)`.
4. Toast + refetch como já está.

Nenhuma outra tela, edge function, DB ou fluxo é tocado. Apenas conserta o erro no dialog "Reagendar post" da Agenda.

### Nota
`pfm_get_post` já está mapeado no `postforme-proxy` (linha 177) — não precisa mexer no edge function.