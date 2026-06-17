# Corrigir slides: tirar as faixas escuras

## O que aconteceu

A rodada anterior, em vez de remover os blocos escuros, acabou colocando faixas/cartões escuros mais sólidos em **todos** os templates:

- `bottom` (slides 1, 2): faixa preta cobrindo a metade inferior atrás do título e legenda
- `center-card` (slides 3, 4): card translúcido cinza/preto grande no meio
- `top` (slide 3): mesma faixa preta

Isso é o oposto da referência: na referência o texto fica direto sobre a foto, sem nenhuma faixa, só com `text-shadow` para legibilidade.

## Correção

### 1. Remover **todos** os fundos escuros dos templates editoriais

Em `src/lib/slide-compose.ts` e `src/components/studio/workspace/editableEls.ts`:

- `renderBottom` / template `bottom`: **remover** o `fillRect` / `<div>` com `rgba(0,0,0,…)` que cria a faixa inferior. Manter apenas título + legenda com `text-shadow` forte (`0 2px 12px rgba(0,0,0,0.65), 0 1px 2px rgba(0,0,0,0.8)`).
- `renderTop` / template `top`: idem — sem faixa superior, só linha de 2px branca 60% acima do título + texto com shadow.
- `renderCenterCard` / template `center-card`: **remover** o retângulo translúcido. Manter título e legenda centralizados horizontalmente, alinhados na metade do canvas, apenas com text-shadow.
- `renderKicker` / template `kicker`: kicker (label uppercase + linha curta branca) + título logo abaixo, sem nenhum fundo.

### 2. Garantir contraste sem faixa

- Title weight 800, `text-shadow: 0 2px 14px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.9)`
- Legenda weight 500, `text-shadow: 0 1px 6px rgba(0,0,0,0.75)`
- Mesmos valores no editor (`editableEls.ts`) e no rasterizado (`slide-compose.ts`) para manter paridade Galeria ↔ Editor.

### 3. Variação entre slides (mantida)

`pickTemplate` em `AutoStudio.tsx` continua rotacionando entre `bottom`, `top`, `center-card`, `kicker` — mas agora todos sem faixa, só variando posição do texto.

### 4. Escopo

Apenas composição visual dos slides. Sem mexer em geração de imagem, IA, legenda, banco ou publicação.

## Resultado esperado

Cada slide com a foto totalmente visível, texto branco grande posicionado em cantos/centro diferentes, legibilidade vinda apenas do text-shadow — igual à referência que você enviou.
