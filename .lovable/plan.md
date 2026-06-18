## Modo seleção para exclusão em massa na Galeria

Adicionar um botão "Selecionar" na Galeria que ativa um modo de seleção múltipla, permitindo escolher vários posts e apagá-los de uma vez.

### Mudanças em `src/pages/Gallery.tsx`

1. **Novos estados**:
   - `selectMode: boolean` — modo seleção ligado/desligado
   - `selectedIds: Set<string>` — IDs selecionados
   - `bulkDeleting: boolean` — loading da exclusão
   - `confirmOpen: boolean` — abre AlertDialog de confirmação

2. **Barra de ações (ao lado dos filtros)**:
   - Quando `selectMode === false`: botão `Selecionar` (outline).
   - Quando `selectMode === true`:
     - Texto "N selecionados"
     - Botão `Selecionar tudo` / `Limpar seleção`
     - Botão `Excluir (N)` (destructive, desabilitado se N=0) → abre confirmação
     - Botão `Cancelar` → sai do modo seleção

3. **CreationCard**:
   - Receber props `selectMode`, `selected`, `onToggleSelect`.
   - Em modo seleção: clicar no card alterna seleção; overlay de hover com ações fica desabilitado; mostra um `Checkbox` no canto superior direito sempre visível; borda violeta + ring quando selecionado.
   - Fora do modo seleção: comportamento atual inalterado.

4. **Exclusão em massa**:
   - `handleBulkDelete()`: `await Promise.all(ids.map(deleteCreation))`, atualiza `creations` removendo os IDs localmente (sem refetch completo), limpa seleção, sai do modo seleção, toast "N criações removidas".
   - Confirmação via `AlertDialog` ("Excluir N criações? Esta ação não pode ser desfeita.")

5. **Detalhes de UX**:
   - Trocar filtro mantém seleção (IDs permanecem válidos).
   - Sair do modo limpa `selectedIds`.
   - Ícone do botão: `CheckSquare` (lucide) para "Selecionar", `Trash2` no botão de excluir.

Nenhuma mudança em `gallery.ts`, schema ou outras telas. Apenas frontend.
