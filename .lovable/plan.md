## Problema identificado

Os snapshots mostram que o Instagram retorna dados reais, mas YouTube, TikTok e Facebook estão sendo salvos com seguidores/posts zerados. Isso indica que a busca chega até o backend e persiste resultado, porém a normalização/entrada dos scrapers das outras redes está frágil.

Principais causas prováveis:
- YouTube, Facebook e TikTok dependem de URL pública correta; quando a URL/handle vem em formato diferente, o scraper retorna vazio ou campos com nomes diferentes.
- O backend aceita resultado vazio como sucesso e salva 0, em vez de tratar como falha visível.
- Os normalizadores atuais só cobrem algumas estruturas de resposta dos scrapers; se o actor retorna `data`, `items`, estatísticas aninhadas ou campos alternativos, tudo vira 0.
- A tela mostra “Iniciar” quando o resultado vem zerado, mas não mostra claramente qual rede falhou e por quê.

## Plano de correção

1. **Fortalecer entrada por plataforma**
   - Normalizar URL/handle antes de chamar cada scraper.
   - Para YouTube: aceitar `@handle`, `/channel/`, `/c/`, `/user/` e URLs completas.
   - Para TikTok: extrair corretamente o handle de URLs com `@usuario`.
   - Para Facebook: remover parâmetros como `?locale=pt_BR` e montar URL limpa da página.
   - Para LinkedIn: manter detecção de perfil pessoal vs empresa.

2. **Fortalecer normalização dos resultados**
   - Ajustar o backend de `social-analytics` para reconhecer mais formatos de retorno dos actors.
   - Procurar dados em arrays aninhados comuns (`items`, `data`, `results`, `videos`, `posts`).
   - Mapear campos alternativos de seguidores, inscritos, posts, likes, comentários e views.
   - Evitar retornar perfil “válido” quando tudo veio vazio.

3. **Não salvar sucesso falso com dados zerados**
   - Se uma rede retorna sem username/displayName e com seguidores/posts/posts recentes zerados, marcar como erro daquela plataforma.
   - Continuar salvando as redes que funcionarem normalmente.
   - Exibir no toast quantas redes carregaram e quais falharam.

4. **Melhorar diagnóstico no front-end**
   - Na página Analytics, mostrar detalhes dos erros retornados por plataforma após “Atualizar Dados”.
   - Manter o cache antigo apenas para redes com dados reais; evitar substituir uma rede válida anterior por um resultado zerado/falho.

5. **Validar no backend**
   - Implantar a função `social-analytics` corrigida.
   - Testar a função com as URLs já salvas da empresa:
     - Instagram: `denisonleandro.adv`
     - YouTube: `https://www.youtube.com/@denisonleandroeadvogadosas487`
     - TikTok: `https://www.tiktok.com/@denisonleandro.adv`
     - Facebook: `https://www.facebook.com/denisonleandro.adv/`
   - Confirmar que redes sem dados reais retornem erro claro, não card zerado silencioso.

## Resultado esperado

Após a correção, ao clicar em **Atualizar Dados**:
- Instagram continua funcionando.
- YouTube/TikTok/Facebook passam a usar URLs limpas e normalizadores mais robustos.
- Se algum scraper externo não conseguir coletar uma rede, a interface mostra o motivo em vez de parecer que a conta tem 0 seguidores/postagens.
- Dados bons anteriores não serão apagados por uma coleta ruim.