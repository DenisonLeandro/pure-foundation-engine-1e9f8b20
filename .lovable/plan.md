## Problema

No **Criar com IA** (`AutoStudio`), todos os slides estão saindo:
- **Parecidos entre si** — cada slide do mesmo carrossel reusa basicamente o mesmo prompt (`topic + objective`), mudando só o texto sobreposto. O modelo não tem variação visual entre slides 1, 2, 3…
- **Fora da identidade da marca** — a diretiva atual só passa "paleta de cores base" como string genérica. O modelo (gpt-image-2 / Gemini) entende mal e cai num visual padrão.
- **Estilo ignorado** — não existe um seletor de estilo no AutoStudio (só existe em `ArtStyles.tsx`, que atua no canvas, não no fluxo automático).

## O que vou mudar

### 1. Variação por slide (resolve "todos iguais")

Em `slideArt(...)` (linha 119 de `AutoStudio.tsx`) passar a IA gerar **um conceito visual único por slide** antes de pedir a imagem:

- Antes de criar o carrossel, chamar `aiAssist` uma única vez pedindo um JSON com N "scene briefs" (1 por slide), cada um descrevendo: cenário concreto, ângulo, paleta dominante (dentro das cores da marca), atmosfera. Ex.: slide 1 = "vitrine de loja ao amanhecer, low-angle"; slide 2 = "macro de produto sobre tecido cru"; slide 3 = "skyline urbano ao entardecer".
- Cada slide usa SEU scene brief no prompt do `gpt-image-2`, em vez do mesmo `topic+objective` repetido.
- Garante variedade visual mas mantém coesão (mesma paleta, mesma marca, mesmo tema).

### 2. Controles novos no AutoStudio

Adicionar dois campos opcionais acima do botão "Gerar":

- **Estilo visual** (Select): "Auto", "Editorial fotográfico", "3D render", "Minimalista", "Pôster tipográfico", "Aquarela", "Cinematográfico", "Flat ilustrado". Mesmas opções de `ArtStyles.tsx` para consistência.
- **Direção de arte** (Textarea curta, opcional): "Ex: tons quentes, vintage anos 70, com bastante grão" — texto livre injetado no prompt.

Ambos opcionais. "Auto" = deixa a IA escolher com base na marca/tema (comportamento atual, mas com variação por slide).

### 3. Diretiva de marca mais forte

Em `supabase/functions/_shared/brand.ts` → `brandImageDirective`:
- Traduzir cada cor hex para nome ("#f59e0b" → "âmbar/laranja queimado") para o modelo entender melhor.
- Mencionar logo/profile_photo como referência de "humor visual" quando existir.
- Adicionar exemplos do que NÃO fazer (gradientes roxos genéricos, fundos de stock).

### 4. Qualidade

Subir `quality: "medium"` → `"high"` no `slideArt` (a edge `openai-image` já rebaixa para medium se estourar 150s, então é seguro pedir high).

## Arquivos afetados

- `src/components/studio/workspace/AutoStudio.tsx` — adicionar controles de estilo + art direction, gerar scene briefs por slide, passar tudo para `slideArt`.
- `supabase/functions/_shared/brand.ts` — `brandImageDirective` mais rico (nomes de cores, antipattern explícito).
- `src/lib/brand.ts` — espelhar a mesma melhoria no client (usado em `ArtStyles.tsx`).

## Não vou mexer

- Composição do texto via canvas (`slide-compose.ts`) — está correta e é o que evita erro ortográfico.
- Edge `openai-image` — pipeline + fallback Gemini já estão bons.
- ArtStyles (estilos manuais no canvas) — já funciona; só vou reaproveitar a lista de estilos.

## Resultado esperado

- Carrossel de 6 slides → 6 cenas visualmente distintas, mesma paleta da marca.
- Com "Estilo: Editorial fotográfico" + "Direção: tons terrosos, luz de janela" → todos os slides nesse mood, variando o cenário.
- Sem mais "post genérico roxo".
