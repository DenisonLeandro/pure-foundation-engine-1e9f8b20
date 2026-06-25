## Problema

Os agendamentos do Denison sumiram da `/agenda` (e do card do Dashboard) depois que o `useCompanyPfmPosts` passou a cruzar os posts do Post for Me com as contas vinculadas à empresa em `company_social_accounts`.

As 5 contas do Denison estão corretamente vinculadas na tabela (TikTok/YouTube/Twitter/Facebook/Instagram → empresa `504437ac…`), então o vínculo está OK. O filtro é que está cego para o formato real do post devolvido pela API do Post for Me.

Hoje o filtro só procura o id da conta nestes campos:
- `social_account_id`, `account_id`, `account.id`, `target.account_id`, `social_account_ids[0]`

Mas o endpoint `pfm_create_post` recebe `social_accounts: string[]` (plural), então a resposta do `pfm_list_posts` traz o id em campos como `social_accounts[]` (array de strings ou de objetos `{id}`), `socialAccounts`, `socialAccountIds`, `account_configurations[].social_account_id` etc. Nenhum desses bate com o filtro atual → todo post cai fora e a agenda fica vazia.

## Correção (apenas leitura/UI, sem mexer em nada que já funciona)

Arquivo: `src/hooks/use-blotato.ts`, função `useCompanyPfmPosts`.

1. Extrair **todos** os ids possíveis de conta de cada post, cobrindo as variações:
   - `social_account_id`, `socialAccountId`, `account_id`, `accountId`
   - `account.id`, `target.account_id`, `target.social_account_id`
   - `social_accounts` (array de string OU array de `{id|social_account_id}`)
   - `socialAccounts`, `social_account_ids`, `socialAccountIds`, `account_ids`
   - `account_configurations[].social_account_id` / `accountConfigurations[].socialAccountId`
2. Manter um post se **qualquer** id extraído estiver em `linkedIds`.
3. Se a extração não achar **nenhum** id (post sem metadata reconhecível), manter o post visível — é o mesmo comportamento de antes da quebra e é seguro porque a chave do Post for Me já é por dono. Posts com ids reconhecidos mas de contas de outra empresa continuam filtrados normalmente.
4. Adicionar um `console.debug("[pfm-posts] sample", items[0])` temporário (1 linha) só para confirmar o shape real na primeira carga; removo depois que você confirmar que voltou.

Nada muda em:
- agendamento, criação, publicação, edição de posts
- isolamento das outras entidades por empresa (fontes, analytics, autopilot, dashboard)
- empresa Teste continua zerada (as contas dela não existem em `company_social_accounts`)

## Resultado esperado

Ao trocar para o Denison, `/agenda` e o card "Próximos posts" do Dashboard voltam a listar exatamente os mesmos agendados de antes — nada foi apagado, só estavam sendo escondidos pelo filtro.
