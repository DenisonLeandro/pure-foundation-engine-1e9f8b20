# Plano: correções de segurança críticas

Tudo em **uma única migration**. Sem mudança de UI nem de lógica de aplicação — só endurecer o backend.

## O que será corrigido

### 1. `system_settings` — bloquear escrita para usuários comuns 🔴
Hoje qualquer usuário logado pode `INSERT`/`UPDATE` (inclusive desligar o cadastro de novos usuários).

- Criar enum `app_role` (`admin`, `user`) e tabela `public.user_roles` (padrão recomendado, evita escalonamento de privilégio).
- Criar função `public.has_role(_user_id, _role)` (SECURITY DEFINER, search_path fixo).
- Substituir policies de `system_settings`:
  - SELECT: continua liberado para todos (a flag de registration_enabled precisa ser lida no login).
  - INSERT/UPDATE/DELETE: apenas `has_role(auth.uid(), 'admin')`.

### 2. Bucket `media` — remover listagem pública 🟡
Existem **duas** policies SELECT públicas em `storage.objects` para o bucket (`Public read access to media` e `media_public_read`). Isso permite `list()` de todos os arquivos.

- Remover ambas as policies SELECT públicas.
- Manter `media_authenticated_rw` (dono mexe nos próprios arquivos por pasta).
- Arquivos continuam acessíveis por URL pública (`/object/public/media/...`) porque o bucket é público — só o `list()` deixa de funcionar para terceiros.

### 3. Função `get_vault_secret` — revogar EXECUTE 🟡
Hoje qualquer um (anon/authenticated) pode chamar e ler segredos do Vault.

- `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated`.
- Mantém EXECUTE só para `service_role` (edge functions continuam funcionando).
- Mesmo tratamento em `handle_updated_at` (é trigger, não precisa ser chamável).

### 4. Policies faltando 🟢
- `saved_sources`: adicionar UPDATE (`auth.uid() = user_id`) — hoje impede editar fontes salvas.
- `post_history`: adicionar DELETE (`auth.uid() = user_id`).
- `analytics_snapshots`: adicionar UPDATE (`auth.uid() = user_id`).

## O que NÃO será feito agora (justificativa)

- **Migrar chaves de terceiros em `user_configs` para Vault** — refator grande, envolve várias edge functions. Vale fazer numa próxima rodada dedicada. Hoje RLS já protege bem (cada usuário só vê as próprias chaves).
- **Mover extensão do schema `public`** — risco baixíssimo, raramente vale o esforço.
- **Validação com zod nos formulários** — boa prática, mas não é vulnerabilidade.

## Detalhes técnicos

```text
Migration única:
  - CREATE TYPE app_role
  - CREATE TABLE public.user_roles (+ GRANT + RLS + policies)
  - CREATE FUNCTION public.has_role (SECURITY DEFINER, stable, search_path=public)
  - DROP + CREATE policies de system_settings (admin-only para writes)
  - DROP policies SELECT públicas em storage.objects (bucket media)
  - REVOKE EXECUTE em get_vault_secret e handle_updated_at
  - CREATE POLICY UPDATE em saved_sources
  - CREATE POLICY DELETE em post_history
  - CREATE POLICY UPDATE em analytics_snapshots
```

Nenhum código TS precisa mudar. Você vai precisar **promover seu usuário a admin manualmente** depois (te passo o comando — basta um INSERT em `user_roles`).

Após aplicar: rodo o scanner de novo para confirmar que os itens críticos sumiram.
