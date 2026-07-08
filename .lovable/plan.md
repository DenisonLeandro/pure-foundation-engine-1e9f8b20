## Diagnóstico

O problema principal do print está confirmado: o Facebook está entrando na tabela de Top Posts com **a página inteira como se fosse um post**.

Exemplo real salvo no banco:
- `platform: facebook`
- `followers: 1400`
- `avg_likes: 1433`
- `posts_count: 1`
- `recent_posts: [{ text: "", likes: 1433, date: "", url: "" }]`
- `engagement_rate: 102.36%`

Isso explica exatamente a linha “(sem texto) / 1.4K likes / 102.36%”: não é post, é a contagem de likes/seguidores da página sendo tratada como engajamento de publicação.

Também encontrei estes pontos:
- **Instagram** está funcionando melhor: tem 6 posts recentes, likes, comentários, datas e mídia.
- **YouTube** tem seguidores e contagem de vídeos, mas **não tem posts/vídeos recentes nem likes/views**.
- **TikTok** está salvo zerado no histórico atual.
- **X/Twitter** está conectado na tabela de contas, mas não aparece nos snapshots recentes; provavelmente está falhando no scraper atual ou sendo descartado como “sem dados úteis”.
- A função atual depende muito de formatos variáveis dos actors da Apify e ainda mistura objetos de perfil com objetos de post em alguns normalizadores.

## Plano de correção

### 1. Separar definitivamente “perfil” de “post”

Na função `social-analytics`, criar validadores por tipo:

- `isFacebookPost`
- `isYouTubeVideo`
- `isTikTokVideo`
- `isTwitterTweet`
- `isInstagramPost`

Cada validador só deixa entrar item que tenha sinais reais de publicação, como:
- URL de post/vídeo/status/reel
- texto/caption/title real
- data de publicação
- id de publicação
- métricas compatíveis com post, não métricas de perfil

E rejeita objetos de perfil/página/canal, como:
- Facebook `pageName`, `pageUrl`, `followers`, likes da página
- YouTube `channelName`, `subscriberCount`, dados do canal
- TikTok `userInfo`, `authorStats`, dados do perfil
- X/Twitter `user`, `followersCount`, dados do usuário

### 2. Corrigir Facebook

Ajustar `facebook.normalize` para:

- Nunca aceitar a página como post.
- Rejeitar item sem texto, sem data e sem URL de post.
- Só calcular `avgLikes`, `avgComments`, `engagementRate` se houver posts reais.
- Se o scraper trouxer apenas dados da página, salvar seguidores corretamente, mas `recentPosts: []` e `engagementRate: null`.
- Usar reels/enrichment como fallback apenas se os reels forem reais.

Resultado esperado:
- Some o fake post “1.4K likes / 102%”.
- Facebook continua mostrando followers.
- Posts aparecem só se o scraper trouxer publicações reais.

### 3. Corrigir YouTube

Ajustar `youtube.normalize` para procurar vídeos em estruturas mais amplas:

- `videos`
- `latestVideos`
- `items`
- `contents`
- `data`
- objetos com `videoId`, `watchUrl`, `url` de `/watch`, `/shorts`, título e views

Extrair:
- título
- views
- likes quando disponível
- comentários quando disponível
- data
- thumbnail
- URL do vídeo

E impedir que o canal entre como vídeo.

Resultado esperado:
- YouTube deixa de ficar só com seguidores/vídeos totais quando o actor retorna lista de vídeos.
- Top Posts pode receber vídeos reais com views/likes.

### 4. Corrigir TikTok

Ajustar `tiktok.normalize` para:

- Extrair handle corretamente quando a conta conectada vem como nome amigável e quando há URL salva.
- Aceitar formatos comuns (`awemeList`, `itemList`, `videos`, `posts`, `data`, `stats`).
- Rejeitar objeto de perfil como vídeo.
- Extrair `diggCount`, `playCount`, `commentCount`, `shareCount`, `createTime`, capa e URL.

Resultado esperado:
- TikTok não deve mais salvar zeros quando o perfil público e URL estão corretos.
- Se o scraper falhar por permissão/actor, o erro será claro.

### 5. Corrigir X/Twitter

Trocar/fortalecer a estratégia do X/Twitter:

- Manter suporte ao actor atual, mas normalizar mais formatos de retorno:
  - `tweets`
  - `items`
  - `data`
  - objetos com `tweet`, `full_text`, `text`, `createdAt`, `url`, `id`
- Extrair usuário de `user`, `author`, `profile`, `includes.users` quando existir.
- Extrair métricas de tweet:
  - likes
  - replies/comentários
  - retweets/shares
  - views/impressions
- Se o actor retornar erro `actor-is-not-rented`, transformar em mensagem objetiva: “o scraper de X/Twitter não está ativo na Apify”.
- Se o actor rodar mas não trouxer tweets, salvar perfil só se houver dados reais do usuário e deixar posts vazios.

Observação importante: para X/Twitter funcionar 100%, a conta Apify precisa ter acesso ao actor escolhido. Se o erro for `actor-is-not-rented`, código nenhum consegue burlar isso; o app só consegue mostrar o erro certo e evitar dados zerados/falsos.

### 6. Não sobrescrever dados bons por dados ruins

Reforçar a mesclagem no frontend e no backend:

- Resultado novo com posts vazios não deve apagar posts anteriores válidos.
- Resultado novo com followers/post count zerado não deve apagar valor anterior válido.
- Dados fake/sem validade não devem ser persistidos em `analytics_snapshots`.
- Para a tabela de Top Posts, filtrar também no frontend qualquer post sem texto, sem data, sem URL e com métrica suspeita.

### 7. Limpar a exibição de erros

Melhorar as mensagens do Analytics:

- Mostrar por rede qual falhou.
- Separar “sem URL pública”, “scraper sem permissão”, “perfil privado/inexistente”, “sem posts públicos encontrados”.
- Evitar JSON bruto ou erro técnico para o usuário final.

### 8. Validação final

Depois da implementação:

- Testar a função `social-analytics` com as contas conectadas atuais:
  - Instagram
  - Facebook
  - YouTube
  - TikTok
  - X/Twitter
- Conferir snapshots novos no banco.
- Conferir `/analytics`:
  - Facebook não aparece como post fake.
  - Instagram continua correto.
  - YouTube/TikTok/X mostram posts reais quando o scraper retorna esses dados.
  - Erros por actor/permissão aparecem claros.

## Arquivos que serão alterados

- `supabase/functions/social-analytics/index.ts`
- `src/pages/Analytics.tsx`
- possivelmente `src/lib/api/analytics.ts` para normalização de URLs/handles antes de chamar a função.

## Resultado esperado

O Analytics ficará alinhado assim:

- Sem posts falsos.
- Sem engajamento inflado por seguidores/likes de página.
- Dados antigos bons preservados.
- Todos os canais conectados tratados: Instagram, Facebook, YouTube, TikTok, LinkedIn, Pinterest, Threads e X/Twitter.
- Quando uma rede depender de actor Apify não ativo, o app mostrará isso claramente em vez de zerar ou inventar métrica.