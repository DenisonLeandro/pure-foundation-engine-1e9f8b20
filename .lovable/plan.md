## Plano

1. **Conferir o estado real do backend**
   - Verificar quais migrations do Autopilot v2 já foram aplicadas.
   - Confirmar se existe ou não a migration `20260709140000_autopilot_v2_cron_vault.sql` no projeto; hoje encontrei `20260709120000`, `20260709130000` e uma migration combinada `20260709134945...` que ainda usa o parâmetro quebrado `supabase.service_role_key`.

2. **Aplicar as migrations pendentes do Autopilot v2**
   - Aplicar `20260709120000_autopilot_v2_schema.sql` e `20260709130000_autopilot_v2_engine.sql` se ainda estiverem pendentes.
   - Se a migration `20260709140000_autopilot_v2_cron_vault.sql` realmente estiver ausente, criar/aplicar uma migration corretiva equivalente, trocando o cron para ler a chave segura `autopilot_service_key` no Vault em vez de `current_setting('supabase.service_role_key')`.

3. **Criar/atualizar o segredo `autopilot_service_key` sem expor a chave**
   - Criar o segredo no Vault usando a service role key já armazenada no backend, sem imprimir nem revelar o valor.
   - Evitar pedir a chave manualmente ao usuário.

4. **Reagendar e validar o cron `autopilot-tick`**
   - Desagendar qualquer versão antiga do cron que ainda use `supabase.service_role_key`.
   - Recriar o job `autopilot-tick` apontando para a função correta e usando `autopilot_service_key`.
   - Conferir `cron.job_run_details` para garantir que o erro `unrecognized configuration parameter` parou.

5. **Confirmar funções e secrets necessários**
   - Confirmar deploy das funções `autopilot-parse`, `autopilot-plan`, `autopilot-worker` e `autopilot-tick`.
   - Conferir se `LOVABLE_API_KEY` existe.
   - Verificar como `openai-image` está resolvendo imagem: ela usa `LOVABLE_API_KEY` via Lovable AI Gateway e só usa `OPENAI_API_KEY` como fallback; validarei se há falta real de secret ou se o gateway já cobre a geração sem baixar qualidade.

6. **Teste final**
   - Executar/acionar o tick depois da correção.
   - Verificar logs das funções e jobs para confirmar que a fila sai de `queued` e começa a processar `gen_image`/`gen_caption`.