## Objetivo
Separar contas em dois tipos no cadastro: **Dono** (configura chaves de API uma vez no perfil dele e elas valem para todas as empresas dele, cria empresas e convida pessoas) e **Funcionário** (só entra em empresas via convite, nunca vê tela de chaves nem cria empresa). Preparar o terreno para escalar para mais clientes sem refazer nada do que já funciona.

Importante: papéis dentro de cada empresa (`owner`/`admin`/`editor` em `company_members`) continuam existindo e não mudam. O `account_type` é uma camada nova, no perfil do usuário, que decide o que ele pode fazer fora do contexto de uma empresa específica.

Já funciona hoje e **não vai mudar**:
- Chaves de API ficam por dono em `user_configs` (uma chave do dono já serve para todas as empresas dele).
- Contas de rede social ficam por empresa em `company_social_accounts` (Empresa A conecta as redes dela, Empresa B as dela).
- Convite por email em `/team`, fluxo de criação de empresa, autopilot, publicações agendadas.

## Mudanças

### 1. Banco — novo campo `account_type` no perfil
- Criar tabela `public.profiles` (`user_id` PK → `auth.users`, `account_type` text check `'owner' | 'employee'`, `display_name`, timestamps) com RLS (usuário lê/atualiza só o próprio perfil; `account_type` imutável após insert via trigger).
- Trigger `on_auth_user_created` → insere `profiles` lendo `raw_user_meta_data.account_type` (default `'owner'` para não quebrar contas antigas/sem metadata).
- Migração de dados: todos os usuários atuais ganham `account_type = 'owner'` (preserva 100% do comportamento de quem já usa).

### 2. Signup (`src/pages/Signup.tsx` + `AuthContext`)
- Adicionar seleção no formulário com dois cards: "Sou dono / vou gerenciar empresas" vs "Sou funcionário / fui convidado".
- `signUp()` passa `account_type` em `options.data`; trigger grava no `profiles`.
- Funcionário vê aviso: "Após criar a conta, peça ao dono para te convidar pelo email cadastrado."

### 3. Contexto + helpers
- `AuthContext` carrega `account_type` junto com a sessão.
- Helpers `isOwnerAccount()` / `isEmployeeAccount()`.

### 4. Gating de UI por `account_type`
- **Setup / Gerenciar Chaves**: rota e itens de menu escondidos para funcionário; acesso direto redireciona.
- **Criar empresa** (`CreateCompany`): bloqueado para funcionário (botão some + rota redireciona com aviso).
- **Time → convidar membro**: continua igual (dono/admin de empresa convida normal).
- **Sidebar / Header**: esconde "Criar empresa" e "Chaves" para funcionário.

### 5. Tela inicial do funcionário
- Sem convites pendentes nem empresas: tela "Aguardando convite" mostrando o email e botão "Atualizar".
- Com convite pendente: lista para aceitar (fluxo já existe em `company_invites`).

### 6. Backend — proteção real (não só UI)
- Policy em `companies`: `INSERT` só se o `profiles.account_type` do `auth.uid()` for `'owner'`.
- Policy em `user_configs`: `INSERT/UPDATE` só se `account_type = 'owner'`. Funcionário nem consegue gravar chave por engano.

## Detalhes técnicos
```
profiles
  user_id uuid PK → auth.users
  account_type text check in ('owner','employee') default 'owner'
  display_name text
  created_at / updated_at
RLS: select/update own row; trigger BEFORE UPDATE bloqueia mudança de account_type.
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
```
- `signUp(email, password, name, accountType)` → `supabase.auth.signUp({ email, password, options: { data: { name, account_type: accountType } } })`.
- Função `handle_new_user()` SECURITY DEFINER cria a linha em `profiles` a partir de `NEW.raw_user_meta_data->>'account_type'`.

## Suposições (default se não responder)
- Funcionário pode aceitar convites de várias empresas. Default: sim.
- Dono não pode rebaixar a própria conta para funcionário. Default: imutável (se precisar trocar, cria nova conta).