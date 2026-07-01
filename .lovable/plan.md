## Corrigir botão de apagar agendamento na tela Agenda

### Diagnóstico
Em `src/pages/Schedule.tsx` (linha 236), o card do post agendado tem um `onClick={() => handleOpenPost(post)}` no `<div>` externo, que navega para `/studio`. Quando o usuário clica no ícone da lixeira (linha 253), o clique abre o `AlertDialog` mas também sobe para o `div` pai, disparando a navegação — a página é desmontada antes do diálogo aparecer, ou o diálogo abre e some imediatamente. O mesmo problema afeta o botão "Duplicar".

### Correção
Em `src/pages/Schedule.tsx`:
1. Adicionar `e.stopPropagation()` no `onClick` do botão "Duplicar" (linha 246).
2. Adicionar `onClick={(e) => e.stopPropagation()}` no `AlertDialogTrigger` (envolvendo o botão da lixeira na linha 253) para impedir que o clique de abrir o diálogo suba até o div do card.

Não altera nenhum outro fluxo — apagar, listar, navegar ao clicar no corpo do card continuam funcionando como hoje.