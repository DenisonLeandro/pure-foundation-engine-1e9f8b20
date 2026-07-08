## Plano para corrigir Analytics das outras redes

### Problema atual
- Instagram funciona, mas outras redes ainda vêm incompletas.
- Posts e likes continuam zerados ou ausentes.
- A tela mostra erros como no print: `Twitter / X: Apify 403 actor-is-not-rented`.
- Esse erro significa que o actor usado para X/Twitter não está alugado/ativo na conta Apify configurada; portanto o app não deve tratar isso como “perfil sem dados”, e sim como “integração indisponível até ativar/trocar o scraper”.

### O que vou ajustar

1. **Melhorar a extração de posts e likes por plataforma**
   - YouTube: ampliar leitura de vídeos recentes, views, likes e comentários usando variações comuns dos campos retornados pelo scraper.
   - TikTok: ampliar leitura de vídeos recentes, likes, comentários, views e contagem total de posts.
   - Facebook: ampliar leitura de posts/reels, reações/likes, comentários, compartilhamentos e contagem de posts.
   - X/Twitter: manter suporte, mas tratar erro de actor indisponível corretamente.

2. **Normalizar respostas aninhadas dos scrapers**
   - Muitos actors retornam dados dentro de `items`, `data`, `results`, `posts`, `videos`, `collector`, `profile`, `channel`, etc.
   - Vou criar helpers para “achar” arrays de posts/vídeos e campos numéricos mesmo quando mudam de nome.
   - Isso reduz o caso em que a plataforma tem dados, mas o app salva `0` por não reconhecer o formato.

3. **Não sobrescrever dados bons com dados incompletos**
   - Se uma plataforma retornar seguidores mas não posts/likes, não vou zerar posts/likes antigos válidos.
   - A mesclagem no frontend deve preservar métricas anteriores por campo quando a coleta nova vier parcial.
   - Exemplo: se YouTube trouxer seguidores agora, mas posts/likes vierem vazios, mantém posts/likes anteriores em vez de apagar.

4. **Separar erro de scraper indisponível de erro de perfil**
   - Para `actor-is-not-rented`, vou exibir mensagem clara: scraper da Apify não está ativo/alugado para essa rede.
   - Isso evita confundir com “URL errada” quando o problema é a conta Apify/actor.
   - Se possível, vou adaptar o backend para classificar esse erro como configuracional.

5. **Melhorar mensagens na interface**
   - O toast deve mostrar resumo mais útil: carregados, parciais e erros.
   - Erros longos de JSON bruto serão transformados em mensagens legíveis em pt-BR.
   - Não vou mostrar blocos enormes como `{ "error": { ... } }` direto para o usuário.

6. **Validar a função de analytics**
   - Depois da alteração, vou testar a função com chamadas reais usando a sessão do preview quando disponível.
   - Vou verificar logs da função `social-analytics` e confirmar que erros são claros e dados parciais não apagam dados anteriores.

### Fora do escopo
- Não vou trocar sua chave Apify.
- Não vou mexer no Studio, Galeria, Autopilot ou geração de conteúdo.
- Não vou criar nova integração paga sem necessidade.

### Resultado esperado
- YouTube/TikTok/Facebook devem preencher melhor posts, likes, views e posts recentes quando o scraper retornar esses dados.
- Dados antigos válidos deixam de ser apagados por coletas parciais.
- X/Twitter passa a mostrar um erro claro quando o actor da Apify não estiver ativo na conta usada.