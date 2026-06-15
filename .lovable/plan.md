# Migrar brand_profiles para a empresa

Marca passa a ser da **empresa** (compartilhada entre membros). Apenas Dono/Admin gerenciam; Editor só usa. Nenhuma outra tabela muda nesta etapa.

## Schema atual confirmado
- `companies` (com `legacy_brand_profile_id`, `created_by`, `primary_color`, `name`)
- `company_members` (status, role: owner/admin/editor)
- `brand_profiles` (hoje filtrada por `user_id`)
- `CompanyContext` expõe `activeCompanyId` e role helpers; já existe `is_company_member`, `get_company_role`, `can_manage_members`
- Hoje no banco: 1 brand_profile, 1 company, 1 já com `legacy_brand_profile_id` apontando — backfill será trivial

## Migration 1 — schema, backfill e índices

1. **Coluna**: `ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE CASCADE` (nullable).
2. **Backfill em DO block**, em ordem:
   a. Para cada `companies` com `legacy_brand_profile_id` não nulo → `UPDATE brand_profiles SET company_id = c.id WHERE bp.id = c.legacy_brand_profile_id AND bp.company_id IS NULL`.
   b. Para `brand_profiles` ainda sem `company_id` mas com `user_id`: buscar empresas onde o usuário é `owner` ativo.
      - Exatamente 1 → vincular.
      - Mais de 1 → deixar pendente, logar via `RAISE NOTICE`.
      - 0 → criar empresa idempotente: procurar `companies WHERE created_by = user_id AND name IN (brand.name, 'Minha Empresa')`. Se não achar, criar (`name = brand.name OR 'Minha Empresa'`, `primary_color = brand.primary_color`, `created_by = user_id`). O trigger `handle_new_company` já cria o `company_members` owner. Vincular.
3. **Garantir 1 default por empresa**: antes do índice, para cada `company_id` com >1 `is_default=true`, manter só o mais recente, marcar resto `false`.
4. **Índices**:
   - `CREATE INDEX IF NOT EXISTS idx_brand_profiles_company_id ON brand_profiles(company_id)`
   - `CREATE UNIQUE INDEX IF NOT EXISTS one_default_brand_per_company ON brand_profiles(company_id) WHERE is_default = true AND company_id IS NOT NULL`
5. **NOT NULL condicional**: só rodar `SET NOT NULL` se `SELECT count(*) FROM brand_profiles WHERE company_id IS NULL = 0`. Caso contrário, manter nullable e `RAISE NOTICE` listando ids pendentes.
6. **`user_id`**: tornar nullable (auditoria — quem criou). Sem dropar.

## Migration 2 — função de permissão de marca e RLS

1. **Nova função** (gerenciar marca ≠ gerenciar equipe):
   ```sql
   CREATE OR REPLACE FUNCTION public.can_manage_brand_profiles(_company uuid, _user uuid)
   RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
     SELECT EXISTS (
       SELECT 1 FROM public.company_members
       WHERE company_id = _company AND user_id = _user
         AND status = 'active' AND role IN ('owner','admin')
     );
   $$;
   ```
2. **DROP** policies antigas de `brand_profiles` baseadas em `user_id`.
3. **Novas policies**:
   - `SELECT` → `is_company_member(company_id, auth.uid())`
   - `INSERT WITH CHECK` → `can_manage_brand_profiles(company_id, auth.uid())`
   - `UPDATE USING/WITH CHECK` → `can_manage_brand_profiles(company_id, auth.uid())`
   - `DELETE USING` → `can_manage_brand_profiles(company_id, auth.uid())`
4. `GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_profiles TO authenticated`.

Resultado: Editor nunca escreve (mesmo via console). Outras empresas nunca leem. Nada de listagem global.

## Frontend

### `src/hooks/use-brands.ts`
- Substituir `user_id` por `activeCompanyId` do `CompanyContext`.
- Se `activeCompanyId` ausente → `brands=[]`, `loading=false`.
- Recarregar quando `activeCompanyId` mudar.

### `src/pages/Brands.tsx`
- Insert/Update: `company_id: activeCompanyId`, `user_id: user.id` só auditoria.
- "Definir default": `update is_default=false WHERE company_id = activeCompanyId` então `update is_default=true WHERE id`.
- Permissões via `useCompany()` (`role`): se role !== 'owner'/'admin', esconder/desabilitar **Criar/Editar/Apagar/Definir default**, com tooltip *"Apenas Dono ou Admin podem gerenciar marcas."*
- Auto-fill por IA continua igual (já edita a marca em memória).

### Tipos
- `src/lib/brand.ts` e `src/types/index.ts`: `BrandProfile.company_id: string`, `user_id?: string | null`.

### `src/pages/CreateCompany.tsx`
- Texto do botão de marca antiga: *"Converter minha marca existente"* (no lugar de "usar empresa existente").
- Lista só `brand_profiles WHERE user_id = auth.uid() AND company_id IS NULL` (RLS antiga ainda permitia user_id; após migração de policies, criaremos uma policy adicional restrita: `SELECT` permitido também quando `company_id IS NULL AND user_id = auth.uid()` — só para o fluxo de conversão).
- Ao converter: chamar fluxo já existente que cria company com `legacy_brand_profile_id` (trigger valida `_brand_owner = created_by`). Em seguida, novo passo: `UPDATE brand_profiles SET company_id = <new> WHERE id = <brand.id> AND user_id = auth.uid()`.

## Edge Functions

### `supabase/functions/_shared/brand.ts`
- Nova assinatura: `getBrand({ supabase, userId, companyId? })`.
- Se `companyId` vier:
  1. Validar membership: `SELECT 1 FROM company_members WHERE company_id=? AND user_id=? AND status='active'` → 403 se falhar.
  2. Buscar `brand_profiles WHERE company_id=? ORDER BY is_default DESC LIMIT 1`.
- Se `companyId` ausente: fallback legado por `user_id` com `// TODO remover fallback`.

### `supabase/functions/autopilot-run/index.ts`
- Já recebe contexto do usuário; descobrir empresa via `get_company_keys_for_user` ou consulta direta a `company_members`. Usar essa company para `getBrand`. Manter fallback.

### Frontend chamando edges
- Onde o front invoca funções que precisam de marca (Studio/Autopilot/Copilot/Caption), incluir `companyId: activeCompanyId` no body.

## Validação manual
1. **Dono atual**: `/marcas` mostra a marca; coluna tem `company_id`; não cai em `/criar-empresa`.
2. **Editor convidado**: vê a marca, todos botões de gestão desabilitados; tentativa `update` via DevTools console → erro RLS.
3. **Admin**: cria/edita/apaga/define default normalmente.
4. **Multiempresa**: trocar no `CompanySwitcher` troca a lista.
5. **Duplo default**: 2ª chamada de "definir default" funciona (reset+set); insert direto com `is_default=true` em empresa que já tem default → erro do índice único.
6. **Edge 403**: invocar `autopilot-run` com `companyId` alheio → 403.

## Entregáveis
Ao final informarei: migrações criadas, status de `NOT NULL`/pendentes, resumo do backfill, policies novas, função `can_manage_brand_profiles`, arquivos front alterados, edges alteradas, roteiro de teste por papel, e a lista de tabelas que ficam para a próxima etapa (creations, saved_sources, autopilot_*, post_history, analytics_snapshots).
