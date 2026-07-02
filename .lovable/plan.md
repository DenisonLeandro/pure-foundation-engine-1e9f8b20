## Diagnóstico

No print, o slide mostra literalmente:

> TÍTULO EXATO (obrigatório, use literalmente, palavra por palavra, sem reescrever nem parafrasear): "Hérnia de disco pode ser acidente de trabalho? Entenda quando"

Isso é o **texto da instrução técnica** que o app envia à IA, aparecendo dentro do post. Origem exata:

- `src/components/studio/workspace/AutoStudio.tsx:364-370` monta `literalTitleDirective` e concatena no `prompt` do `generateContent(...)`.
- `supabase/functions/generate-content/index.ts:113-176` só menciona essa regra no **system prompt**; o modelo, em vez de aplicar a regra, copiou a linha inteira (rótulo incluído) como `carousel.slides[0].heading`.
- `buildEditableEls({ heading, ... })` então estampou esse heading no slide.

Ou seja: a instrução foi passada no lugar errado (dentro do texto de entrada) e não há sanitizador de saída.

## Correção (causa raiz + defesa)

### 1. Enviar `literalTitle` como campo estruturado, não texto colado no prompt
- Em `src/lib/api/content.ts`: adicionar campo opcional `literalTitle?: string` em `GenerateContentParams`.
- Em `src/components/studio/workspace/AutoStudio.tsx`:
  - Remover o `literalTitleDirective` concatenado ao `prompt`.
  - Passar `literalTitle: brief.literalTitle` como parâmetro dedicado.
- Em `supabase/functions/generate-content/index.ts`:
  - Aceitar `literalTitle` no body.
  - Se presente, injetar como bloco separado e claramente marcado no **system prompt** (não na `userMessage`), reforçando que é metadado — não texto para copiar como conteúdo.
  - Reescrever a "REGRA MÁXIMA" para deixar claro que o rótulo/diretiva **nunca** deve aparecer no output; apenas a frase entre aspas é usada em `carousel.title` e `slides[0].heading`.

### 2. Sanitizador defensivo (garantia)
Em `supabase/functions/generate-content/index.ts`, após o parse do JSON da IA, rodar uma função `stripDirectiveLeak(text)` em:
- `parsed.carousel.title`
- `parsed.carousel.slides[i].heading` e `.body`
- `parsed.posts[platform]`

Regra simples e segura: se o texto contém `TÍTULO EXATO` (case-insensitive) seguido de `:` e depois um trecho entre aspas, substitui pelo trecho entre aspas. Fallback: se casar `TÍTULO EXATO (...):` sem aspas, remove só o prefixo. Também remove `(obrigatório, use literalmente...)` isolado se sobrar.

### 3. Sem mudanças de comportamento
- Não altera fluxo de imagem, template, layout, marca ou logo.
- Não toca no editor nem na galeria.
- Posts antigos ficam como estão (arte já divulgada, conforme regra existente).

## Arquivos a alterar
- `src/lib/api/content.ts` — adicionar `literalTitle` na interface.
- `src/components/studio/workspace/AutoStudio.tsx` — parar de concatenar `literalTitleDirective` no `prompt`; enviar campo separado.
- `supabase/functions/generate-content/index.ts` — aceitar `literalTitle`, ajustar system prompt, adicionar sanitizador na resposta.

## Fora de escopo
- Não muda `generate-content` para outra IA.
- Não muda a forma como o AutoStudio extrai o `literalTitle` da fala do usuário (isso já funciona).
- Não altera o pipeline de renderização/logo/galeria.
