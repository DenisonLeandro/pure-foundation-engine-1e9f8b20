## Princípio único

Cada empresa é uma "sub-conta" isolada do dono. **Tudo é por empresa**, exceto:

- As **chaves de API** (Post for Me, Blotato, Pexels, Apify, Firecrawl, Higgsfield, etc.) — ficam no perfil do dono e atendem todas as empresas dele.
- O **dono** em si (mesma conta de login).

Qualquer outra coisa — contas de rede social conectadas, posts criados, agendamentos, galeria, analytics/insights, autopilot, marcas/brand profiles, fontes salvas, configurações de empresa — pertence a uma empresa específica e não vaza para outra.

## Diagnóstico atual

Já é por empresa (OK): `creations`, `post_history`, `brand_profiles`, `saved_sources`, `company_configs`, `autopilot_*`, `analytics_snapshots`, `company_members`, `company_invites`.

Vaza entre empresas (precisa corrigir):

- **Contas de redes sociais**: a página Contas, Dashboard, Analytics, Publish, Schedule, Autopilot e Setup chamam `usePfmAccounts()` direto, que devolve todas as contas da chave PFM do dono. A tabela `company_social_accounts` existe e tem o vínculo correto, mas nenhuma tela filtra por ela. Resultado: empresa nova "herda" as contas da antiga.
- **`ConnectAccountDialog`** insere o vínculo, mas como nenhuma tela respeita o vínculo, na prática tudo aparece em todas as empresas.

## Plano

### 1. Backfill seguro das contas existentes

`company_social_accounts` está vazio. Só "ligar o filtro" faria as contas sumirem de todo lado. Então:

- Adicionar um aviso na página **Contas** quando houver contas no PFM do dono que ainda não estão vinculadas a nenhuma empresa dele: *"N contas sem empresa. Vincular à empresa X (mais antiga)?"* com botão **Vincular**.
- Botão chama uma edge function `backfill-company-social-accounts` (idempotente) que pega a empresa mais antiga do dono e faz `upsert` de cada conta PFM no link table.
- Em paralelo, dar ao usuário um diálogo **"Vincular conta existente"** para escolher manualmente qual conta vai para qual empresa (útil quando ele quer dividir).

### 2. Filtrar todas as telas por empresa ativa

Novo hook `useCompanyPfmAccounts(platform?)` em `src/hooks/use-blotato.ts` que cruza `pfmListAccounts` (chave do dono) com `listCompanySocialAccounts(activeCompanyId)` e devolve apenas a interseção. Mesmo shape do `usePfmAccounts` para troca direta.

Substituir `usePfmAccounts()` por `useCompanyPfmAccounts()` em:

- `src/pages/Accounts.tsx`
- `src/pages/Dashboard.tsx` (contador, lista, cards)
- `src/pages/Analytics.tsx` (todas as métricas e insights)
- `src/components/setup/ManageAccountsView.tsx`
- `src/components/studio/PublishPanel.tsx`
- `src/components/studio/workspace/OutputScreen.tsx`
- `src/components/autopilot/AutopilotWizard.tsx`

### 3. Conectar / desconectar respeitam a empresa ativa

- **Conectar**: `ConnectAccountDialog` já chama `linkSocialAccountToCompany` no callback de sucesso — apenas garantir que usa `useCompany().activeCompanyId` e nunca um fallback.
- **Desconectar** (na página Contas): por padrão só remove o vínculo desta empresa (`unlinkSocialAccountFromCompany`). Se for o último vínculo daquela conta entre todas as empresas do dono, aí sim revoga o OAuth no PFM (`pfmDisconnectAccount`). Há também checkbox *"Desconectar de todas as empresas"* para forçar revogação.

### 4. Reforçar isolamento de outros dados (verificação)

Auditar cada query do app e garantir que está com `WHERE company_id = activeCompanyId`:

- Galeria (`creations`), Schedule, Studio (rascunhos), Analytics (snapshots), Autopilot (config/posts/calendar), Brand profiles, Saved sources.

Se algum endpoint ou hook hoje não exige `company_id`, corrigir para exigir. RLS já está por `is_company_member`, mas o filtro no cliente precisa ser explícito para evitar mostrar dados de outra empresa quando o usuário é membro das duas.

Também: ao **trocar de empresa** no `CompanySwitcher`, invalidar todas as queries com chave que contenha `companyId` (ou simplesmente `queryClient.clear()` segmentado), para que nada renderize com cache da empresa anterior.

### 5. Funcionário

Nenhuma mudança extra além das guards já existentes. Funcionário só vê as empresas em que está em `company_members` e, dentro de cada uma, os dados daquela empresa.

## O que **não** muda

- Chaves de API continuam em `user_configs` (do dono) — funcionam para todas as empresas dele.
- Login, signup, fluxo de convite, criação de empresa, OAuth de redes sociais.
- Modelos de IA, geração de posts, editor.
- Empresa antiga continua com exatamente as contas que tinha (via backfill).

## Detalhes técnicos

- Sem nova tabela. `company_social_accounts` já existe com unique `(company_id, pfm_account_id)`, RLS por `is_company_member`/`can_manage_members` e GRANTs corretos.
- Nova edge function `backfill-company-social-accounts`:
  - Valida JWT em código (padrão Lovable Cloud).
  - Lê `companies` mais antiga do `auth.uid()` (created_by).
  - Lista contas no PFM com a chave do dono.
  - Faz `upsert` em `company_social_accounts` com `ON CONFLICT DO NOTHING`.
  - Retorna `{ linked: N, anchor_company_id }`.
- Novo hook `useCompanyPfmAccounts`: `useQuery(["company","pfm-accounts", activeCompanyId, platform], ...)`, depende de `useCompany().activeCompanyId`.
- Em todas as mutations de conectar/desconectar/backfill: `invalidateQueries(["pfm","accounts"])` + `invalidateQueries(["company","social-accounts"])` + `invalidateQueries(["company","pfm-accounts"])`.
- `CompanyContext.setActiveCompanyId`: após trocar, chamar `queryClient.invalidateQueries()` com um predicado que matche queries cujo key inclua `activeCompanyId` antigo, para limpar dados residuais.
