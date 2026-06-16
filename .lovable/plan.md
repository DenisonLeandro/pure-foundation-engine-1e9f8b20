# Restaurar edição da Galeria (sem reintroduzir o timeout)

## O que quebrou

Na correção anterior eu removi `design_doc` do `SELECT` da listagem (`getCreations`) para baixar o payload. Acontece que `src/pages/Gallery.tsx` lia `creation.designDoc` direto do objeto da lista quando você clica em **Editar**. Como o campo agora vem `null`, o Studio abre sem o design original.

`design_doc` precisa continuar fora da listagem (era 8–11 MB por linha somados às URLs — o que travava tudo). A solução é buscar o `design_doc` **sob demanda** no momento de editar.

## Correção

### `src/pages/Gallery.tsx`
No `handleEdit` (linhas ~110–130), antes de navegar para `/studio`:

1. Chamar `getCreation(creation.id)` (já existe em `src/lib/gallery.ts` e traz `*`, incluindo `design_doc`).
2. Usar o `designDoc` do resultado completo no `navigate(..., { state: { designDoc, ... } })`.
3. Fallback: se a busca falhar, manter o comportamento atual (abrir Studio com as imagens como fundo) para não bloquear.
4. Pequeno feedback visual: desabilitar o botão durante o fetch (já há `editingId` no componente — reaproveitar).

### `src/lib/gallery.ts`
Sem mudança no schema/RLS. `getCreation(id)` já existe e retorna o design completo.

### Fora de escopo
- RLS, schema, Studio, Post for Me, Blotato, Autopilot, company_configs, chaves de API, agendamento, aprovação, permissões.
- Não voltar `design_doc` para o `SELECT` da listagem (causaria o timeout de novo).

## Resultado esperado

- Galeria continua carregando rápido (payload pequeno).
- Clicar em **Editar** em qualquer post abre o Studio com o `design_doc` original carregado, exatamente como antes.
- Posts antigos sem `design_doc` seguem o fallback já existente (imagens como fundo).
