## Sincronização com GitHub (branch main)

O Lovable já mantém sincronização bidirecional automática com o GitHub em tempo real. Quando você faz push na branch `main`, as mudanças aparecem aqui sozinhas — não existe um comando manual de "pull" pra eu rodar.

Pelo que vejo no projeto agora, **as mudanças já estão sincronizadas**:

- `supabase/functions/cost-dashboard/index.ts` — presente
- `src/pages/CostDashboard.tsx` — presente
- Bloco `[functions.cost-dashboard]` com `verify_jwt = false` — presente em `supabase/config.toml`
- `openai-image`, `higgsfield-proxy`, `firecrawl-search`, `postforme-proxy`, `blotato-proxy`, `generate-content` — todas presentes em `supabase/functions/`

### Plano

1. **Verificar versões reais** das 6 edge functions citadas + `cost-dashboard` lendo cada `index.ts` e confirmando que batem com o que está no GitHub (timestamps/headers/lógica).
2. **Reimplantar as 7 edge functions** via `supabase--deploy_edge_functions` para garantir que a versão rodando no servidor é exatamente a do código atual (edge functions implantam sozinhas, mas um redeploy explícito elimina qualquer dúvida de "ficou versão antiga rodando").
3. **Smoke test rápido**: chamar `cost-dashboard` com senha inválida via `supabase--curl_edge_functions` só pra confirmar que respondeu `401` (prova que está no ar).
4. **Confirmar pendências de banco**: rodar `supabase--read_query` pra checar se existe a tabela `app_secrets` com a linha `cost_dashboard_password` e a tabela `api_usage_logs`. Se faltar algo, te aviso — não vou criar migration sem sua confirmação, pra não bagunçar dados.
5. **Relatório final** com o que foi reimplantado, o que está OK e o que (se algo) precisa de ação sua (ex.: definir a senha do painel de custos).

### O que NÃO vou mexer

- Nada de código de produto (Studio, Galeria, ConnectAccountDialog, etc.).
- Nada de migrations novas sem te avisar antes.
- `supabase/config.toml` fica como está.

Pode aprovar pra eu executar?
