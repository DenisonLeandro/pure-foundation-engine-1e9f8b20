## Objetivo

Isolar **tudo** por empresa, exceto as chaves de API (que continuam no perfil do dono em `user_configs` e servem para todas as empresas dele).

## O que já está isolado por empresa hoje

`companies`, `company_configs`, `company_members`, `company_invites`, `company_invite_companies`, `company_social_accounts`, `brand_profiles`, `articles`, `creations`, `post_history`. Vou só **auditar as queries** dessas páginas e garantir que todas filtram por `activeCompanyId` (e que o cache invalida ao trocar de empresa).

## O que NÃO é isolado e precisa ser

Tabelas que hoje só têm `user_id`:

- `saved_sources` (fontes)
- `analytics_snapshots` (analytics + insights)
- `autopilot_configs`, `autopilot_calendars`, `autopilot_posts` (autopilot/agenda)

E dados em `localStorage` que hoje são por usuário e vazam entre empresas do mesmo dono:

- `analytics`, `structured_insights`, `profile_urls`, `enrich_analytics` (Analytics / Insights / Dashboard)
- chaves de UI scopadas a "última coisa usada" (ex.: brand selecionada, último carrossel etc.)

E a **agenda Post for Me**: `usePfmPosts` devolve todos os posts agendados na chave do dono, sem cortar pelos `social_account_id` da empresa ativa.

## O que continua user-scoped (intencional)

- `user_configs` → chaves de API (Post for Me, Blotato, Pexels, Apify, Firecrawl, Higgsfield, ElevenLabs). Uma vez por dono, valem para todas as empresas dele.
- `profiles`, `user_roles` → metadados do usuário.

## Plano

### 1. Migration única

Para `saved_sources`, `analytics_snapshots`, `autopilot_configs`, `autopilot_calendars`, `autopilot_posts`:

1. `ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE` (nullable nesta fase para não quebrar nada em execução).
2. **Backfill** com a primeira `companies.id` do `user_id` correspondente — é a empresa onde esses dados já apareciam.
3. Index em `(company_id)`.
4. RLS reescrita para exigir `public.is_company_member(company_id, auth.uid())` em SELECT/INSERT/UPDATE/DELETE. Fallback `company_id IS NULL ⇒ user_id = auth.uid()` só para registros legados não backfilladados (não deve sobrar nenhum, mas evita sumir algo).

Numa migration de fase 2 (depois que a UI já gravar `company_id` sempre), viro `NOT NULL`.

### 2. Front-end — filtro por `activeCompanyId` em todas as queries

| Página / hook | Mudança |
| --- | --- |
| `src/pages/Sources.tsx` | query + insert usam `company_id = activeCompanyId`; key `["saved_sources", companyId]` |
| `src/hooks/use-autopilot.ts` (5 hooks) | filtra e grava `company_id`; keys incluem `companyId` |
| `src/pages/Autopilot.tsx`, `src/components/autopilot/AutopilotWizard.tsx` | passam `activeCompanyId` ao salvar |
| `src/pages/Analytics.tsx` | filtra `analytics_snapshots` por `company_id`, grava com `company_id` |
| `src/pages/Insights.tsx` | mesma filtragem + key com `companyId` |
| `src/pages/Schedule.tsx`, `src/pages/Dashboard.tsx` (agenda) | trocam `usePfmPosts` por novo `useCompanyPfmPosts(companyId, opts)` que intersecta `pfmListPosts` com `listCompanySocialAccounts(companyId)` |
| `src/pages/Articles.tsx`, `src/pages/Brands.tsx` | auditar — já são por empresa, só conferir filtro e cache key |

### 3. Novo `src/lib/companyStorage.ts`

Wrapper igual ao `userStorage`, com prefixo `app_uc:<uid>:<companyId>:<key>`. Tem migração one-shot: primeira leitura por empresa, se a chave nova estiver vazia mas existir a chave antiga em `userStorage`, copia para a empresa ativa (assim o que você já tem hoje fica preso na primeira empresa, sem vazar para a Teste).

Substituir em Analytics/Insights/Dashboard as chaves `analytics`, `structured_insights`, `profile_urls`, `enrich_analytics`. Outras chaves de UI por usuário continuam como estão.

### 4. Novo hook `useCompanyPfmPosts(companyId, opts)`

Em `src/hooks/use-blotato.ts`. Faz `pfmListPosts(opts)` + `listCompanySocialAccounts(companyId)` e devolve só os posts cujo `social_account_id` está vinculado à empresa ativa. Mesma estratégia do `useCompanyPfmAccounts` que já existe.

### 5. Invalidação no `CompanyContext`

Adicionar à invalidação ao trocar de empresa: `["saved_sources"]`, `["autopilot"]`, `["analytics_snapshots_latest"]`, `["articles"]`, `["brand_profiles"]`. As keys `["pfm"]` e `["company"]` já são invalidadas.

## O que NÃO muda

- Chaves de API, perfil do dono, papéis, convites.
- Layout/UX das páginas.
- Posts, fontes, calendários e snapshots existentes — ganham `company_id` apontando para a primeira empresa do dono (onde já apareciam), sem perda nem duplicação.

## Validação

- Empresa Teste: agenda, fontes, analytics, insights e autopilot vazios (ou apenas com o que foi criado nela).
- Denison: tudo continua aparecendo como antes.
- Criar/agendar/extrair na Teste → não aparece no Denison e vice-versa.
- Chaves de API continuam servindo as duas empresas sem reconfiguração.
- `tsgo` limpo.
