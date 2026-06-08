# Resolver erro de geração de imagem no "Gerar tudo com IA"

## O que está acontecendo

Ao clicar em **Gerar tudo com IA**, o fluxo gera texto (OK) e em seguida tenta gerar a imagem chamando a edge function `openai-image`, que responde:

```
401 — OPENAI_API_KEY não disponível (Vault/secret) e nenhum x-openai-api-key informado.
```

A função procura a chave em 3 lugares, nessa ordem:
1. Header `x-openai-api-key` (a chave que você salva em **Configurações → Chaves**)
2. Supabase Vault (`get_vault_secret`)
3. Variável de ambiente `OPENAI_API_KEY` da edge function

Nenhum dos três tem chave hoje — por isso o erro. Não é bug de código, é configuração ausente.

## Plano (duas frentes, complementares)

### 1) Fallback automático para Lovable AI (sem precisar de chave OpenAI)

Hoje a app já usa Lovable AI Gateway para texto. Para imagem, existe `google/gemini-2.5-flash-image` ("Nano Banana") e `google/gemini-3.1-flash-image-preview` no mesmo gateway, sem chave do usuário.

Mudanças:
- Editar `supabase/functions/openai-image/index.ts`: se nenhuma chave OpenAI for resolvida, em vez de retornar 401, cair em um caminho alternativo que chama `https://ai.gateway.lovable.dev/v1/images/generations` (ou o endpoint de chat com modelo de imagem) usando `LOVABLE_API_KEY`, e devolver no mesmo formato `{ images: [...] }`. Assim o cliente não precisa mudar.
- Mensagens de erro do gateway (429 / 402) repassadas com texto claro em pt-BR.

Efeito: **Gerar tudo com IA** volta a funcionar imediatamente, sem você precisar configurar nada.

### 2) UX melhor quando o usuário quer usar a própria chave OpenAI

- Em **Configurações → Chaves → OpenAI**, deixar explícito: "opcional — sem ela usamos o modelo de imagem do Lovable AI".
- No erro de geração de imagem, trocar a mensagem técnica atual por um aviso amigável com botão "Abrir configurações de chaves" (só aparece se o fallback Lovable também falhar, ex.: créditos esgotados).

## Arquivos afetados

- `supabase/functions/openai-image/index.ts` — adicionar fallback Lovable AI Gateway.
- `src/lib/api/openai.ts` (ou onde a chamada é feita) — tratar erros 402/429 com mensagem traduzida.
- `src/components/setup/ManageKeysView.tsx` — texto auxiliar no campo OpenAI.
- `src/components/studio/workspace/AutoStudio.tsx` (ou caller do "Gerar tudo com IA") — toast amigável em caso de falha.

## O que NÃO vou fazer

- Não vou pedir sua chave da OpenAI nem expor nada no cliente.
- Não vou alterar o fluxo de texto (que já funciona).
- Não vou mexer no schema do banco.

## Validação

- Clicar em **Gerar tudo com IA** com uma das sugestões → texto + imagem geram sem erro 401.
- Console e network mostram chamada única a `openai-image` com 200.
- Se Lovable AI retornar 402 (créditos), aparece toast pedindo para adicionar créditos no workspace.

Posso seguir com isso?
