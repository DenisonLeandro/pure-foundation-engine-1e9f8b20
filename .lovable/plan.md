Pausar / Retomar / Cancelar já existem — falta expor melhor e cobrir o estado "generating". Também adicionar "Excluir" (permanente).

## O que muda

### Backend (`autopilot-plan/index.ts`)
- **`pause`**: aceitar também `generating` (não só `active`/`approved`). Ao pausar durante geração, os jobs pendentes de `gen_image`/`gen_caption` daquele plano viram `failed` e o plano vai para `paused`.
- **`cancel`**: já aceita `generating`, mas hoje só desagenda no Post for Me. Passar a também derrubar jobs pendentes do plano (`autopilot_jobs.status = 'queued'` do plano → `failed`), pra parar de consumir crédito de IA.
- **Nova action `delete`**: apaga o plano + posts + jobs em cascata (RLS por dono). Só permite se `status ∈ {draft, review, completed, canceled, failed}` — se estiver rodando, obriga cancelar antes.

### Hook + API client (`src/lib/api/autopilot.ts`, `src/hooks/use-autopilot.ts`)
- Adicionar `deletePlan` no cliente e mutation `useDeletePlan` no hook.
- Ajustar `PlanAction` union.

### UI — Lista (`src/pages/Autopilot.tsx`)
- Em cada card do plano, adicionar um menu "⋯" (`DropdownMenu`) no canto, com:
  - **Pausar** (visível se `active | approved | generating`)
  - **Retomar** (visível se `paused`)
  - **Cancelar** (visível se não `completed | canceled`) — com confirmação
  - **Excluir permanentemente** (sempre visível, mas desabilitado enquanto estiver rodando; com confirmação vermelha)
- O clique no card continua abrindo o detalhe; o menu para propagação.

### UI — Detalhe (`src/components/autopilot/AutopilotPlanDetail.tsx`)
- Ajustar `canPause` para incluir `generating` (rótulo do botão vira "Parar geração" nesse caso).
- Adicionar botão **Excluir** ao lado do Cancelar (mesmas regras).
- Melhorar os tooltips/descrições nos diálogos:
  - Pausar: "Suspende publicações agendadas. Nada é perdido — dá para retomar depois."
  - Retomar: "Reagenda os posts aprovados que ainda não publicaram."
  - Cancelar: "Interrompe o plano de vez. Posts não publicados são desagendados. Não dá para retomar."
  - Excluir: "Remove o plano e todo o conteúdo dele. Ação irreversível."

## Arquivos afetados
- `supabase/functions/autopilot-plan/index.ts`
- `src/lib/api/autopilot.ts`
- `src/hooks/use-autopilot.ts`
- `src/pages/Autopilot.tsx`
- `src/components/autopilot/AutopilotPlanDetail.tsx`

## Fora do escopo
- Não altero a schema (as ações usam colunas existentes).
- Não mexo no worker / gerador de imagem.