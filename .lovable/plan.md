## Diagnóstico

Confirmei no banco: `analytics_snapshots`, `saved_sources` e `autopilot_configs` têm **zero linhas** vinculadas à empresa "teste". Tudo está só no Denison. Ou seja, o backend já está corretamente isolado — o vazamento é 100% no **localStorage do navegador**.

Duas causas:

1. **`companyStorage.get` faz uma "migração one-shot" do localStorage legado** (`app_u:<uid>:analytics`, `profile_urls`, etc.) para a empresa que estiver ativa no momento da primeira leitura. Se você abriu Analytics estando em "teste", os dados antigos do Denison foram copiados para dentro do balde da "teste". Daí ela mostra seguidores e analytics que nunca foram dela.
2. **`ConnectAccountDialog.tsx` ainda grava `profile_urls` via `userStorage` (escopo de usuário, sem empresa).** Então as URLs dos perfis sociais ficam globais ao dono e aparecem em qualquer empresa dele.

## Correções

### 1. `src/lib/companyStorage.ts`
- **Remover a migração one-shot do legado** (o bloco que copia `app_u:<uid>:<key>` para a empresa ativa). Cada empresa passa a começar vazia e só é populada por dados realmente dela.
- Adicionar helper `wipeKeysForUser(keys: string[])` que apaga, para o usuário atual, todas as entradas `app_uc:<uid>:*:<key>` e a versão legada `app_u:<uid>:<key>`.

### 2. Limpeza one-shot no boot
Em `src/contexts/AppContext.tsx` (no boot, gate por uma flag `app_uc_reset_v1` em localStorage), chamar `wipeKeysForUser(["analytics", "profile_urls", "structured_insights", "enrich_analytics"])`. Isso elimina a contaminação que já está no navegador dos usuários afetados. Os dados do Denison serão re-hidratados a partir de `analytics_snapshots` (7 linhas existem); a "teste" continuará vazia, como deve ser.

### 3. `src/components/ConnectAccountDialog.tsx`
Trocar a leitura/gravação de `profile_urls` de `userStorage` para `companyStorage` com `activeCompanyId` (vem de `useCompany()`). Assim a URL do perfil cadastrado pelo usuário pertence à empresa em que ele estava conectando a conta — não vaza para outra.

### 4. Verificação em `Analytics.tsx`
Quando `activeCompanyId` muda e a `companyStorage.get(...,"analytics")` está vazia, garantir que a tela carrega dos `analytics_snapshots` filtrados por `company_id` (já feito no Insights na rodada anterior) — replicar a mesma query no Analytics para hidratar o estado a partir do banco em vez de depender só do localStorage. Sem essa hidratação a tela do Denison ficaria vazia até o usuário clicar "Atualizar".

## O que NÃO muda
- Nenhum dado de banco é alterado, removido ou recriado.
- Nenhuma chave de API é tocada.
- Comportamento visual / fluxos / templates / publicação seguem iguais.
- O Denison continua com tudo o que tinha (vem do banco).
- A "teste" passa a ficar genuinamente vazia em followers, analytics, insights e profile URLs até que contas sejam vinculadas a ela.

## Verificação
Após aplicar:
1. Recarregar a página → boot roda a limpeza uma única vez.
2. Trocar para "teste" em `/analytics` e `/dashboard`: seguidores e analytics devem aparecer zerados.
3. Trocar para "Denison": dados reaparecem hidratados do banco.
4. Conectar/cadastrar uma URL de perfil em uma empresa e confirmar que ela não aparece na outra.
