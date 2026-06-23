# Consertar Insights IA vazio

## Causa
A página **Insights IA** lê da tabela `analytics_snapshots`, mas hoje **nada grava** nessa tabela. A página **Analytics IA** só guarda o resultado em memória/localStorage. Resultado: Insights sempre mostra "Nenhum dado coletado".

## O que vou fazer

### 1. Persistir cada coleta de Analytics no banco
Em `src/pages/Analytics.tsx`, dentro de `handleFetchAnalytics`, logo após `setAnalytics(result.results)`:

- Pegar o `user_id` do usuário logado (`supabase.auth.getUser()`).
- Para cada perfil em `result.results`, fazer um `insert` em `analytics_snapshots` mapeando:
  - `platform`, `username`, `display_name`, `profile_image_url`
  - `followers`, `following`, `posts_count`
  - `engagement_rate`, `avg_likes`, `avg_comments`, `avg_views`
  - `recent_posts` (jsonb), `raw_data` (enrichment, jsonb)
  - `fetched_at`
- Falha de gravação só loga `console.warn` (não quebra a UI).

A tabela já tem RLS por `auth.uid()` e os GRANTs necessários — não precisa migração.

### 2. Resultado esperado
- Próxima vez que o usuário clicar em **Atualizar** em Analytics IA, cada perfil vira uma linha em `analytics_snapshots`.
- Ao abrir **Insights IA**, a consulta `select ... order by fetched_at desc limit 50` traz os snapshots e a página passa a mostrar:
  - Cards de seguidores totais / engajamento médio / likes / comentários
  - Melhor dia, melhor horário, melhor plataforma, melhor tipo de conteúdo
  - Top posts e cards por plataforma
  - Caixa de pergunta para a IA estratégica

## Fora do escopo
- Não vou mexer na estrutura da tabela nem mudar o escopo de `user_id` para `company_id` (cada membro vê só os snapshots que ele próprio coletou). Se quiser compartilhar entre time, faço em separado.
- Não vou alterar a página Insights — ela já está pronta, só estava sem dados.
