## Diagnóstico

O erro atual não é falta de créditos. Os logs mostram que o `openai/gpt-image-2` termina com sucesso no Lovable AI Gateway, mas demora cerca de 153 segundos:

- `log_id: 019f5c2d-eba8-75db-8b56-6429ceb5e00e`
- `timestamp: 2026-07-13T15:54:54Z`
- `status: success (http 200, upstream 200)`
- `streaming: true`
- `duration_ms: 152920`

Ao mesmo tempo, a função `openai-image` registra:

- `Http: connection closed before message completed`

Isso significa: a imagem é gerada, mas a função segura a resposta até a imagem final ficar pronta; o navegador/proxy recebe 504 antes da função devolver o JSON final.

## Objetivo

Corrigir o 504 mantendo a funcionalidade do app:

- Não trocar `openai/gpt-image-2`.
- Não mudar prompt, qualidade, tamanho, fluxo de Studio, legenda, logo ou UX principal.
- Não alterar a lógica de criação do post.
- Só ajustar o transporte da resposta para não estourar timeout.

## Plano de implementação

1. Alterar apenas o fluxo Lovable AI Gateway dentro de `supabase/functions/openai-image/index.ts`.
2. Manter a chamada atual para `openai/gpt-image-2` com `stream: true` e `partial_images: 1`.
3. Em vez de consumir todo o stream internamente e responder só no fim, fazer a própria Edge Function devolver uma resposta streaming para o navegador.
4. A função continuará lendo os eventos SSE do Gateway, mas também enviará pequenas mensagens de progresso ao cliente enquanto espera a imagem final, evitando que a conexão fique ociosa e vire 504.
5. No final, enviar exatamente o mesmo payload lógico que o cliente espera hoje: `{ images, model }`.
6. Ajustar `src/lib/api/openai.ts` para aceitar essa resposta streaming sem alterar a interface pública `generateOpenAiImage(...)`; os componentes continuarão chamando a mesma função e recebendo o mesmo resultado.
7. Preservar tratamento de erros atual para 402, 429 e falhas do Gateway, exibindo erro ao usuário quando necessário.
8. Deployar a função `openai-image` e validar nos logs que a chamada deixa de cair com `connection closed before message completed`.

## Detalhes técnicos

- A resposta entre Edge Function e navegador passará a ser SSE ou NDJSON somente internamente ao helper `generateOpenAiImage`.
- O restante do app não precisará saber disso.
- A imagem final continuará vindo do `image_generation.completed` do Gateway.
- Os frames parciais continuarão descartados visualmente; a UI atual só renderiza a imagem final.
- O modelo, qualidade e tamanho permanecem os mesmos.