# Plano — Foto real do Pexels como padrão no Studio Automático

## Objetivo
No fluxo "Studio · Automático" (`AutoStudio.tsx`), os fundos dos posts/carrosséis hoje são SEMPRE gerados por IA (`generateOpenAiImage` dentro de `slideArt`). Vou trocar o padrão para **fotos reais do Pexels** (reusando `searchStockImages` → edge function `stock-search`, exatamente o mesmo caminho do botão "Pexels" no Copilot e da busca "Buscar no Pexels" no AssetsRail). A IA continua disponível como opção manual.

## Escopo (apenas isto)
- `src/components/studio/workspace/AutoStudio.tsx` — único arquivo modificado.
- Nada de auth, chaves, CORS, geração de legenda (`generateContent`/`aiAssist` para texto), composição de texto sobre a imagem (`composeSlideWithText`), Autopilot edge function, ou qualquer outro fluxo.

## Mudanças

### 1. Novo estado de UI: "Origem da imagem"
- Adicionar `const [imageSource, setImageSource] = useState<"pexels" | "ai">("pexels")`.
- Adicionar um `<Select>` no painel "Direção visual", ao lado de Estilo/Layout, com duas opções:
  - **Foto real (Pexels)** — padrão
  - **Arte gerada por IA** — comportamento atual
- Desabilitado durante `generating`, igual aos outros selects.

### 2. Helper para escolher a query do Pexels
Nova função `pickStockQuery(topic, heading, sceneBrief)`:
- Chama `aiAssist` (mesmo helper já usado em `generateSceneBriefs`/`parseBrief`) com instrução curta para devolver **2–4 palavras-chave em pt-BR** boas para busca no Pexels, baseadas em tema + título do slide + cena (ex.: "acidente de trabalho" → `"trabalhador construção segurança"`).
- `expectJson: true`, formato `{ "query": "..." }`; em caso de erro, fallback para `heading || topic`.

### 3. Novo caminho `slideStockPhoto(...)`
Mesma assinatura de `slideArt`, mas:
1. `pickStockQuery(...)` → `query`.
2. `searchStockImages({ query, count: 5, orientation: "portrait" })`.
3. Se `images.length === 0`, refaz a busca com termo genérico profissional (`"profissional negócios trabalho"`); se ainda vier vazio, retorna `undefined` e o slide cai no gradiente da marca (comportamento atual quando `bg` é nulo).
4. Pega `images[idx % images.length].url` (varia entre slides do carrossel pra não repetir a mesma foto).
5. Passa por `composeSlideWithText` exatamente como hoje (mesmo overlay de texto, template, marca).

### 4. Roteamento em `handleGenerate`
- No bloco do carrossel e no bloco do post único, substituir as chamadas atuais a `slideArt(...)` por:
  ```
  const fn = imageSource === "ai" ? slideArt : slideStockPhoto;
  const img = await fn(...mesmos args...);
  ```
- `slideArt` permanece intacto (rota manual "Arte gerada por IA"). Mensagens de progresso continuam iguais ("Gerando arte do slide X/Y…" — vale tanto para Pexels quanto IA).
- Vídeo (Higgsfield) não é afetado.

### 5. Estados vazios / erros
- Se Pexels retornar erro (ex.: sem chave configurada — HTTP 401 do `stock-search`), capturamos no `try` interno do `slideStockPhoto`, mostramos `toast.error` com a mensagem, e o slide volta a usar fundo gradiente (mesma degradação que já acontece quando `bg` é `undefined` em `slideArt`). Não tentamos cair em IA automaticamente — o usuário escolhe trocar pra "Arte gerada por IA" no select.

## O que NÃO muda
- `supabase/functions/openai-image/index.ts`, `supabase/functions/stock-search/index.ts`, `supabase/functions/generate-content/index.ts`, `supabase/functions/autopilot-run/index.ts` — nenhum edge function tocado.
- `generateContent`, `aiAssist` (texto/legenda/hashtags) — inalterados.
- `composeSlideWithText` e templates de slide — inalterados (texto continua sendo desenhado por cima da imagem).
- Autenticação, armazenamento de chaves, CORS — inalterados. A chave Pexels já é lida de `getSavedConfig().pexelsApiKey` dentro de `searchStockImages` (mesmo mecanismo do botão Pexels do Copilot).
- Botão "Gerar IA" do Copilot e busca manual no AssetsRail — inalterados.

## Arquivo alterado
- `src/components/studio/workspace/AutoStudio.tsx` (único).

Após implementar eu confirmo explicitamente: auth, key storage e geração de legenda não foram modificados.
