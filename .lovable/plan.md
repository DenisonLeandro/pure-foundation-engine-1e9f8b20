# Diagnóstico real do 504 no `openai-image`

## O que os logs mostram

Nos logs da edge function `openai-image`:

```
15:38:09  [openai-image] Lovable AI generate model=openai/gpt-image-2 size=1024x1280 n=1
15:40:45  Http: connection closed before message completed
```

**156 segundos** entre o início da chamada e a conexão morrer. Não é mais falta de créditos (o 402 anterior já sumiu) — agora é **timeout de plataforma**: o edge runtime derruba a conexão porque a chamada ao gateway (`gpt-image-2`, `quality: "high"`, `1024x1280`) demora mais do que o limite de request síncrono. O 504 no browser é a consequência.

O código atual em `supabase/functions/openai-image/index.ts` (linha 159) faz:

```ts
const gwResp = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
  ...
  body: JSON.stringify({ model: "openai/gpt-image-2", prompt, size, n, quality })
  // sem stream: true → resposta única no final
});
```

Sem `stream: true`, a função fica **156 s bloqueada num `await`** esperando o JSON final. Nada trafega enquanto isso, e o edge runtime encerra por inatividade → 504.

## Por que não é "trocar o modelo" ou "mudar funcionalidade"

Conforme sua exigência:
- **Modelo continua `openai/gpt-image-2`.**
- **Qualidade continua `high`, tamanho continua `1024x1280`.**
- **Prompt, composição de logo, UI, edição — nada muda.**

A correção é puramente de transporte: ligar SSE (`stream: true`) na chamada ao gateway e escoar os eventos para não deixar a conexão ociosa. É exatamente o padrão recomendado no knowledge do Lovable AI (`ai-image-generation`) — a imagem final entregue ao cliente é idêntica.

## Plano da correção (só transporte)

### 1) `supabase/functions/openai-image/index.ts` — ramo Lovable AI Gateway (linhas ~128–207)

- Adicionar `stream: true` e `partial_images: 1` ao `gwBody` do modo geração (Gemini já emite parciais nativamente; manter Gemini como está).
- Trocar `await gwResp.json()` por leitor SSE que consome cada evento `image_generation.partial_image` / `image_generation.completed` / `error`:
  - Descartar parciais (a UI atual não renderiza streaming — só precisa da final).
  - No `image_generation.completed`, guardar `b64_json` como `data:image/png;base64,…` na lista `images`.
  - Em `error` (por nome do evento **ou** `payload.type === "error"`), devolver 502 com `error.message`.
  - Se o stream terminar sem `completed`, devolver 502 "stream terminou sem imagem".
- Continuar retornando o **mesmo** JSON `{ images, model }` de sempre para o cliente — nada muda no lado do browser.
- Manter o tratamento existente de 402 / 429 (headers da resposta HTTP inicial continuam disponíveis antes do stream começar).

Efeito: enquanto o gateway processa, chegam bytes SSE periódicos → a conexão do edge não fica ociosa → nada de 504. A chamada inteira pode levar >2 min sem ser derrubada.

### 2) Nada mais

- `src/lib/api/openai.ts`, `src/lib/studio-art.ts`, `AiArtStudio.tsx`: **não tocar**.
- `IMG_QUALITY`, `IMG_SIZE`, prompts: **não tocar**.
- Modelo Gemini (edição): **não tocar** — já usa formato que não sofre desse timeout.

## Como validar

Depois do deploy da função:
1. Abrir Studio → "IA cria a arte completa" → colar o mesmo prompt do print.
2. Clicar "Gerar arte". Aguardar (pode levar 60–150 s — normal para `gpt-image-2 high`).
3. Nos logs da função deve aparecer `[openai-image] Lovable AI generate …` seguido de várias linhas SSE e um retorno 200 no fim, sem `Http: connection closed`.
4. O toast "Arte gerada!" aparece com a imagem no canvas.

Se preferir, posso já implementar essa mudança pontual — é só um bloco dentro do ramo `if (!apiKey)` da função, e não altera a interface pública nem o fluxo do app.
