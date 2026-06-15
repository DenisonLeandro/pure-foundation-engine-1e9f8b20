
# Corrigir permissões em `company_members`

Escopo único: RLS de `company_members`. Nada de Studio, Galeria, marcas, configs, edges, autopilot.

## Diagnóstico do bug atual
Policy `managers can update members` hoje:
- USING: `can_manage_members AND target.user_id <> auth.uid() AND (actor é owner OR target.role = 'editor')`
- WITH CHECK: `... AND new.role IN ('admin','editor')`

Brecha: admin atualiza linha cujo `role atual = 'editor'` (USING passa) e seta `new.role = 'admin'` (WITH CHECK passa). → admin promove editor a admin.

## Migração — uma única migration

### 1. Função auxiliar — contagem de owners ativos
```sql
CREATE OR REPLACE FUNCTION public.count_active_owners(_company uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.company_members
  WHERE company_id = _company AND status='active' AND role='owner';
$$;
```

### 2. Reescrever policies de `company_members`

Drop das atuais `managers can update members` e `managers can remove members`. Recriar:

**UPDATE**
- USING:
  - `can_manage_members(company_id, auth.uid())`
  - AND `user_id <> auth.uid()` (ninguém mexe em si mesmo)
  - AND `role <> 'owner'` (ninguém edita owner; protege último owner também)
  - AND (`get_company_role(company_id, auth.uid()) = 'owner'` OR `role = 'editor'`)  ← admin só vê linhas de editor
- WITH CHECK:
  - `company_id` inalterado e `user_id` inalterado (garantido por mesma linha; reforço lógico)
  - AND `role IN ('admin','editor')` (nunca cria owner)
  - AND (`get_company_role(company_id, auth.uid()) = 'owner'` OR `role = 'editor'`)  ← admin só pode salvar role=editor

Resultado por cenário:
- Owner edita admin/editor, pode trocar entre admin↔editor. ✓
- Admin edita só editor, só pode manter editor. Promover editor→admin falha no WITH CHECK. ✓
- Editor: `can_manage_members` é falso → bloqueado. ✓
- Promover qualquer um a owner: bloqueado pelo WITH CHECK. ✓
- Auto-edição: bloqueado pelo USING. ✓

**DELETE**
- USING:
  - `can_manage_members(company_id, auth.uid())`
  - AND `user_id <> auth.uid()`
  - AND `role <> 'owner'` OR (`role='owner' AND get_company_role(...)='owner' AND count_active_owners(company_id) > 1`)
    - simplificação prática: bloquear DELETE de owner via RLS — owner sai por fluxo dedicado depois; mantém a regra "nunca remover último owner" sem complicação extra.
  - AND (`get_company_role(...) = 'owner'` OR `role = 'editor'`)

Cenários:
- Owner remove admin/editor. ✓
- Owner tenta remover outro owner: bloqueado (regra simplificada acima). Aceitamos por agora — não há UI para isso e protege o último owner.
- Admin remove editor. ✓ Admin tentando remover admin/owner: USING falha. ✓
- Editor: bloqueado. ✓
- Auto-remoção: bloqueado pelo USING (decisão de "leave company" fica para outra etapa).

**INSERT**: continua sem policy. Inserções vêm de `handle_new_company` (trigger SECURITY DEFINER) e `company-invite` (service_role). Mantém intocado.

**SELECT**: já está correto (`is_company_member`). Não mexer.

### 3. GRANTs
Já existentes; não precisam mudar. (Tabela já tem grants para `authenticated` e `service_role`.)

## Frontend
Sem mudança de UX. `src/components/team/InviteMemberDialog.tsx` e `src/pages/Team.tsx` já usam `invitableRoles(role)` que limita admin a convidar `editor`. Sem código para alterar.

## Testes (manuais, via Supabase JS no console autenticado e via UI de Equipe)

| # | Cenário | Esperado |
|---|---|---|
| A | Owner: `update company_members set role='admin' where id=<editor>` | OK |
| B | Admin: mesmo update | erro RLS |
| C | Admin: `delete from company_members where id=<editor>` | OK |
| D | Admin: deletar outro admin | erro RLS |
| E | Editor: qualquer update/delete | erro RLS |
| F | Qualquer um: update no próprio registro | erro RLS |
| G | Owner: tentar `role='owner'` num editor | erro RLS (WITH CHECK) |
| H | Owner único tentando deletar outro owner / a si próprio | erro RLS |
| I | Admin convida editor pela UI | continua funcionando (`company-invite` usa service_role) |

Vou rodar os testes via `supabase--read_query`/`insert` simulando policies onde possível e validar no log do navegador. Para escalada via console (cenário B), instruirei verificação manual; minha responsabilidade é garantir a RLS correta.

## Relatório final (após aplicar)
- Policies alteradas: `company_members` UPDATE e DELETE (drop + recreate).
- Função criada: `count_active_owners(uuid)` (reservada para futuros usos; principal proteção do último owner vem de bloquear DELETE de qualquer owner).
- Convite de Editor por Admin: inalterado, segue funcionando via edge `company-invite`.
- UI: sem mudanças.
