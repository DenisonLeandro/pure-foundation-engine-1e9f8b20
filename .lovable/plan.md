# Por que o Studio "IA cria a arte" fica carregando infinito

## Diagnóstico (com base em logs)

Analisei os logs do AI Gateway e da edge function `openai-image`:

- Modelo em uso: `openai/gpt-image-2` em `1024x1280` qualidade `medium`.
- Duração real das últimas 10 gerações: **131s, 139s, 143s, 149s, 157s, 158s, 163s…**
- Edge function log: `Http: connection closed before message completed` — a conexão HTTP entre o navegador → edge function → gateway está sendo cortada antes do modelo terminar.
- Gateway também registra chamadas com `status: cancelled (http 499)` (cliente desistiu).

**Causa raiz:** o `gpt-image-2` está batendo/estourando o tempo limite de resposta da edge function (~150s) e/ou do `fetch` do navegador. Quando dá certo, dá certo por pouco; quando ultrapassa, o cliente vê "carregando infinito" e nunca recebe a imagem, mesmo que o modelo eventualmente conclua no backend.

Não é bug de lógica — é orçamento de tempo do modelo escolhido para esse tamanho/qualidade.

## Correção proposta (mínima, só o que o usuário pediu)

Trocar o motor de imagem do Modo 1 para um modelo rápido, mantendo qualidade adequada para posts de rede social. O caminho de menor risco:

1. **`supabase/functions/openai-image/index.ts`** — no bloco de fallback via Lovable AI Gateway (o caminho que o Studio usa hoje, já que não há OpenAI key por-usuário), trocar o modelo de geração de `openai/gpt-image-2` para `google/gemini-2.5-flash-image`.
   - Gemini flash image roda em ~10–25s no mesmo gateway.
   - O shape de resposta já é tratado por `parseImages` (aceita `b64_json` e `url`).
   - Para geração pura (sem `image` de entrada), enviaremos payload no formato chat com `modalities: ["image","text"]` (mesmo shape que já usamos hoje para edição), evitando o endpoint `/images/generations` que só serve `gpt-image-2`.
   - Manter o caminho de edição inalterado (já usa Gemini).
   - Manter o header `x-openai-api-key` funcionando: se o usuário trouxer chave OpenAI própria, continua indo direto para OpenAI com `gpt-image-2`.

2. **Nada mais muda.** Nem o frontend (`AiArtStudio.tsx`), nem `studio-art.ts`, nem o autopilot. O prompt e a composição da logo continuam iguais.

### Detalhe técnico

No `openai-image/index.ts`, no ramo `if (!apiKey)`:

- Hoje: `useGemini = isEdit` → geração usa `openai/gpt-image-2` em `/v1/images/generations`.
- Depois: `useGemini = true` sempre. Para geração, `messages: [{ role:"user", content:[{type:"text", text: prompt}] }]` + `modalities:["image","text"]`. Para edição, mantém como está (com `image_url`).
- Log de uso passa a marcar `service: "gemini"` (já é o comportamento no ramo de edição).

## Fora de escopo

- Não vou mexer em outros arquivos, no autopilot, no Studio Modo 2, ou no fluxo de publicação.
- Não vou trocar tamanho/qualidade da imagem — Gemini já é rápido o suficiente no tamanho atual.
- Se preferir manter `gpt-image-2` mesmo com o risco de timeout, me avise antes que eu implemente.
