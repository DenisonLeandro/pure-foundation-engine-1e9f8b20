## Objetivo
Colocar o Autopilot v2 em produção: aplicar as migrations pendentes em `supabase/migrations` (schema + engine) e publicar as edge functions do fluxo v2.

## Passos

1. **Aplicar migrations pendentes** (`supabase/migrations`)
   - Rodar todas as migrations ainda não aplicadas relativas ao Autopilot v2: tabelas `autopilot_plans`, `autopilot_posts`, `autopilot_jobs`, RPCs (`autopilot_claim_jobs`, `autopilot_requeue_stuck_jobs`), GRANTs e políticas RLS.
   - Verificar que o schema v1 antigo (`autopilot_configs`, `autopilot_calendars`) foi tratado conforme já definido nas migrations existentes (não vou reescrever migrations — apenas aplicar as que já estão no repositório).
   - Confirmar agendamento do `pg_cron` para chamar `autopilot-tick` a cada minuto (se essa parte já estiver em uma migration existente, ela roda junto).

2. **Deploy das edge functions**
   - `autopilot-parse` — cola → grade estruturada.
   - `autopilot-plan` — painel de ações (create/approve/regen/pause/resume/cancel).
   - `autopilot-worker` — drena a fila de jobs.
   - `autopilot-tick` — batida periódica; reenfileira jobs presos, confirma posts, avança planos, invoca worker.

3. **Verificação pós-deploy**
   - Checar logs de boot de cada função (sem erros de import / lockfile).
   - Chamar `autopilot-tick` com a service key para confirmar que responde `{ ok: true, ... }`.
   - Se algum deploy falhar por `deno.lock` incompatível, remover/renomear o lockfile e re-deployar.

## Fora de escopo
- Nenhuma mudança de código nas functions ou no frontend.
- Nenhuma reescrita de migrations existentes; apenas execução das que já estão versionadas.
