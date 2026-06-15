# Plano — Empresas, Membros e Convites (v1)

Escopo: criar a base multiempresa sem mexer em Studio, Galeria, Agenda, Publicação, cobrança ou refatorar dados existentes por empresa. Apenas deixar `activeCompanyId` disponível para uso futuro.

## ETAPA 1 — Banco de dados (migração)

Tabelas novas no schema `public`:

- **companies**: `id`, `name`, `segment`, `logo_url`, `primary_color`, `created_by` (→ auth.users), timestamps.
- **company_members**: `id`, `company_id` (→ companies, cascade), `user_id` (→ auth.users, cascade), `role` ∈ {owner, admin, editor}, `status` ∈ {active, removed}, `invited_by`, timestamps. `UNIQUE(company_id, user_id)`.
- **company_invites**: `id`, `company_id` (cascade), `email`, `role` ∈ {admin, editor}, `token` (unique), `status` ∈ {pending, accepted, expired, revoked}, `invited_by`, `expires_at`, `accepted_at`, `accepted_by`, `created_at`.

Cada `CREATE TABLE` virá com `GRANT` para `authenticated` e `service_role`, `ENABLE ROW LEVEL SECURITY`, trigger `handle_updated_at` (já existe) nos campos `updated_at`, e índices em `company_id`, `user_id`, `token`, `email`.

Funções `SECURITY DEFINER` auxiliares (para evitar recursão em RLS):

- `public.is_company_member(_company uuid, _user uuid) returns boolean`
- `public.get_company_role(_company uuid, _user uuid) returns text`
- `public.can_manage_members(_company uuid, _user uuid) returns boolean` — true se owner/admin ativo.

## ETAPA 2 — RLS

**companies**
- SELECT: `is_company_member(id, auth.uid())`.
- INSERT: `auth.uid() = created_by` (qualquer autenticado).
- UPDATE: `get_company_role(id, auth.uid()) in ('owner','admin')`.
- DELETE: não criar policy (sem delete nesta v1).

**company_members**
- SELECT: `is_company_member(company_id, auth.uid())`.
- INSERT: bloqueado via policy (só backend ou trigger no `create company`); aceitação de convite faz INSERT via Edge Function com service_role.
- UPDATE/DELETE: `can_manage_members(company_id, auth.uid())` E `user_id <> auth.uid()` (não pode mexer no próprio papel). Admin só pode mexer em linhas onde `role = 'editor'`.

**company_invites**
- SELECT: owner/admin da empresa.
- INSERT: owner/admin via Edge Function (regra de papel validada lá).
- UPDATE (revoke): owner/admin da empresa.
- Aceitação por token roda no backend com service_role — sem policy de leitura por token no cliente.

Trigger ao criar `companies`: inserir automaticamente `company_members(owner)` para `created_by` (executado como SECURITY DEFINER, evita problema com policy de insert).

## ETAPA 3 — Empresa ativa (frontend)

Novo `src/contexts/CompanyContext.tsx` + `useCompany()`:
- Carrega `company_members` do usuário (join com `companies`).
- Resolve `activeCompanyId` a partir de `userStorage.get('activeCompanyId')` validando se ainda é membro; senão, primeira empresa; senão, `null`.
- Expõe: `companies`, `activeCompany`, `activeCompanyId`, `setActiveCompanyId`, `role`, `isOwner`, `isAdmin`, `isEditor`, `loading`, `refreshCompanies()`.
- Provider montado em `App.tsx` entre `AuthProvider` e `AppProvider`.

Novo guard `RequireCompany`: se `!loading && companies.length === 0` → `<Navigate to="/criar-empresa" />`. Aplicado nas rotas autenticadas do app (envolve `RequireAppAccess`).

## ETAPA 4 — Tela Criar Empresa

Nova rota `/criar-empresa` → `src/pages/CreateCompany.tsx`. Form com Nome, Segmento, Cor principal (opcional, color input). Submit:
1. `insert into companies` retornando `id`.
2. Trigger cria `company_members(owner)` automaticamente.
3. `refreshCompanies()`, `setActiveCompanyId(id)`.
4. `navigate('/dashboard')`.

Acessível apenas por usuário logado. Mostra também botão "Voltar" se já tiver empresas.

## ETAPA 5 — Seletor de empresa no topo

Editar `src/components/layout/AppSidebar.tsx` (ou header do `AppLayout`): substituir o bloco da marca atual por um `DropdownMenu`:
- Exibe `activeCompany.name`.
- Lista as outras empresas do usuário.
- Item "Criar nova empresa" → `/criar-empresa`.
- Trocar empresa: `setActiveCompanyId(id)` (persiste em localStorage via `userStorage`).

## ETAPA 6 — Tela Equipe

Nova rota `/admin/equipe` → `src/pages/Team.tsx` (link no `AppSidebar` dentro de Admin, visível apenas se `canManageTeam(role)`).

Conteúdo:
- Cabeçalho com nome da empresa ativa e botão **Convidar membro** (owner/admin).
- Tabela de membros: nome/email, papel (badge), status, entrou em. Ações por linha:
  - Owner: pode alterar role (entre admin/editor) e remover qualquer um exceto a si mesmo e o último owner.
  - Admin: pode remover apenas editors.
  - Editor: acesso negado (redireciona ou mostra "Sem permissão").
- Aba/Seção **Convites pendentes**: email, papel, expira em, ações (Copiar link, Reenviar email se disponível, Revogar).

Editor não vê o item no menu.

## ETAPA 7 — Convites

Edge Function `supabase/functions/company-invite/index.ts` (verify_jwt validado em código, usa service_role para gravar):

Ações via body `{action}`:
- `create`: valida que o caller é owner/admin da empresa; valida regra `canInviteRole(callerRole, targetRole)`; impede convidar `owner`; gera `token = crypto.randomUUID().replace(/-/g,'')` (32+ chars); insere em `company_invites` com `expires_at = now() + 7 days`; tenta enviar email se a infra de email transacional estiver disponível (via `send-transactional-email` se existir), senão retorna `emailSent: false`; sempre retorna `inviteUrl = ${origin}/aceitar-convite?token=...`.
- `revoke`: marca `status='revoked'`.
- `resend`: re-envia email do convite existente.
- `accept`: requer usuário autenticado; busca convite por token; valida `status='pending'` e não expirado; se `email` do convite difere do email logado, aceita mesmo assim (v1 — apenas log de aviso); faz upsert em `company_members` (status active, role do convite); marca convite `accepted` + `accepted_by`/`accepted_at`; retorna `company_id`.

Frontend:
- Diálogo de convite na tela Equipe: campos email + select role (admin/editor conforme permissão). Submit → função `create`. Mostra o link gerado com botão **Copiar**, e mensagem clara se email não foi enviado.
- Nova rota pública `/aceitar-convite` → `src/pages/AcceptInvite.tsx`:
  - Lê `?token=`.
  - Se não logado: salva token em `sessionStorage` e redireciona para `/login?next=/aceitar-convite?token=...`.
  - Se logado: chama `company-invite { action: 'accept', token }`.
  - Sucesso → `refreshCompanies()`, `setActiveCompanyId(companyId)`, `/dashboard`.
  - Erro → mensagem clara (expirado/inválido/revogado).

Sem chave service_role no frontend. Todo INSERT em `company_members` e gravação de convites passa pela Edge Function.

## ETAPA 8 — Helpers de papel

Novo `src/lib/permissions.ts`:
```ts
canManageTeam(role)        // owner|admin
canInviteRole(role, target) // owner→admin/editor; admin→editor
canEditCompany(role)       // owner|admin
```
Aplicados em: tela Equipe, item de menu, diálogo de convite, futura tela de Configurações da empresa. Studio/Galeria/Agenda permanecem acessíveis a todos os papéis nesta v1.

## ETAPA 9 — Não mexer

Studio, editor visual, Galeria, Post for Me, Blotato, publicação/agendamento, legendas, aprovação, cobrança, planos, gateway, refatoração de dados por empresa. Apenas deixo `useCompany().activeCompanyId` disponível para uso futuro.

## Arquivos alterados/criados

**Migração** (uma única via supabase--migration): 3 tabelas + grants + RLS + policies + 3 funções + trigger de owner.

**Edge Function**: `supabase/functions/company-invite/index.ts` + entrada em `supabase/config.toml` se necessário.

**Novos arquivos frontend**:
- `src/contexts/CompanyContext.tsx`
- `src/lib/permissions.ts`
- `src/pages/CreateCompany.tsx`
- `src/pages/Team.tsx`
- `src/pages/AcceptInvite.tsx`
- `src/components/team/InviteMemberDialog.tsx`
- `src/components/layout/CompanySwitcher.tsx`

**Editados**:
- `src/App.tsx` (CompanyProvider, novas rotas, guard `RequireCompany`).
- `src/components/layout/AppSidebar.tsx` (CompanySwitcher + item Equipe).
- `src/lib/storage.ts` (já tem userStorage — usar como está para `activeCompanyId`).

## Como testar

1. Login com usuário sem empresa → redireciona `/criar-empresa`.
2. Cria empresa "Acme" → vira owner, cai no `/dashboard`, switcher mostra Acme.
3. Em `/admin/equipe`, convida `admin@x.com` como Admin → copia link → abre em janela anônima → cria/loga 2ª conta → aceita → vira admin de Acme.
4. Admin convida `editor@x.com` como Editor → editor aceita.
5. Editor não vê menu Equipe; se forçar URL, vê "Sem permissão".
6. Admin tenta convidar outro Admin → bloqueado.
7. Owner cria 2ª empresa → switcher lista as duas; trocar persiste após reload.
8. Revogar convite pendente → link deixa de funcionar.

## Pronto para próxima etapa

`activeCompanyId` disponível globalmente via `useCompany()` para futuras queries filtrarem dados por empresa (brand_profiles, creations, autopilot, etc.) quando você decidir migrar.