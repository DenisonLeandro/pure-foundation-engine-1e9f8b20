## Aplicar migration da tabela `articles`

**Diagnóstico:** O arquivo `supabase/migrations/20260618155946_create_articles.sql` existe no repositório, mas a tabela `public.articles` **não existe** no banco (`SELECT to_regclass('public.articles')` retorna vazio). No Lovable Cloud as migrations só são aplicadas via a ferramenta de migração — não há `supabase db push` nem acesso a dashboard.

Além disso, a migration original tem um problema crítico: **faltam os `GRANT`s** na tabela `public.articles`. Sem eles, a Data API (PostgREST) retorna erro de permissão mesmo com RLS configurado — a página `/artigos` continuaria quebrada.

### Ação

Rodar uma nova migration (aprovada pelo usuário) que:

1. Cria `public.articles` com todas as colunas previstas (id, company_id, created_by, title, slug, content, excerpt, cover_image_url, category, linked_creation_id, status, published_at, created_at, updated_at).
2. Adiciona os `GRANT`s obrigatórios:
   - `GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;`
   - `GRANT SELECT ON public.articles TO anon;` (necessário para leitura pública de artigos `published`)
   - `GRANT ALL ON public.articles TO service_role;`
3. Habilita RLS e cria as mesmas policies do arquivo original:
   - Membros da empresa leem artigos da própria empresa.
   - `anon` e `authenticated` leem artigos com `status = 'published'`.
   - Membros inserem (com `created_by = auth.uid()`).
   - Owners/admins atualizam qualquer um; criador atualiza o próprio.
   - Owners/admins deletam.
4. Cria os índices: `company_id`, `created_by`, `status`, `published_at DESC`, `slug`, `linked_creation_id`.
5. Cria trigger `BEFORE UPDATE` usando `public.handle_updated_at()` (já existe no banco) para manter `updated_at`.

Tudo idempotente (`IF NOT EXISTS` / `DROP POLICY IF EXISTS`) para conviver com o arquivo antigo no histórico.

### Verificação pós-migration

- `SELECT to_regclass('public.articles')` deve retornar `articles`.
- Abrir `/artigos` no preview e confirmar que carrega sem erro (lista vazia inicialmente).
- Criar um artigo de teste pela UI para validar INSERT + RLS.

### Observação

O arquivo `20260618155946_create_articles.sql` permanece no repositório. A nova migration é aditiva e idempotente, então não conflita.
