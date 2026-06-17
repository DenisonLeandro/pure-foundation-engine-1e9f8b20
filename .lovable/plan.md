## Diagnóstico

A galeria renderiza via `renderDocOffscreen` (1080×1350, baseado no StudioDoc). O que controla onde o texto cai:
- `src/components/studio/workspace/editableEls.ts` (posições/alturas dos elementos)
- `src/components/studio/workspace/designAesthetics.ts` (acentos decorativos)

Problemas visíveis nos slides anexados:

1. **Legenda cortada no rodapé** (slides 1, 3, 4, 6) — `body` tem `h: 24` (1 linha), mas o texto quebra em 2-3 linhas → só a primeira aparece.
2. **Título "Tarefas impossíveis" estoura à direita** no template `kicker` — fonte 32/800 não cabe nos 312px.
3. **Risquinho laranja em cima da legenda** — `buildAccents` posiciona em `y=CANVAS_H-28` (≈y=422 num canvas de 450), exatamente onde a legenda fica.
4. **Título do `bottom` colado no meio da foto** (slide 1) — `y=240` cedo demais pra título de 2 linhas + legenda embaixo.

## Mudanças

### `src/components/studio/workspace/editableEls.ts`

Realocar os 4 templates pra dar altura à legenda e baixar o título:

- **bottom**: título `y=276, h=120` (era 240/170); legenda `y=394, h=44` (3 linhas); handle/contador inalterados.
- **top**: título `y=56, h=130`; legenda `y=200, h=72` (4 linhas).
- **center-card**: título `y=146, h=140`; legenda `y=296, h=80`.
- **kicker**: kicker label `y=208, h=12`; título `y=228, h=130` com `fontSize: 28` (era 32) e `lineHeight: 1.05` (evita estouro lateral em palavras longas); legenda `y=384, h=56` (3 linhas).

### `src/components/studio/workspace/designAesthetics.ts`

Manter o risquinho laranja, só tirar ele de cima da legenda — subir pro canto inferior esquerdo, em uma zona livre. No `accentBar` dos presets `auto`/`editorial`/`modern`, mudar `y` de `CANVAS_H - 28` para `CANVAS_H - 14` (cola na borda inferior, abaixo da legenda — fica como uma "assinatura" visual sem competir com texto).

Alternativa equivalente caso a borda fique apertada: posicionar como traço vertical à esquerda (`x: 0, y: CANVAS_H - 80, w: 3, h: 60`) — uma "vírgula" da marca em vez de uma régua horizontal embaixo do texto.

Vou adotar a primeira opção (`y = CANVAS_H - 14`), mais discreta e fiel ao que já existe.

### `src/lib/slide-compose.ts`

Espelhar a redução de fonte do título no `renderKicker` (font inicial 96 → 88) pra evitar overflow no fallback rasterizado. Sem mudança de layout, só fit mais conservador.

## Fora de escopo

Sem mexer em IA, geração de imagem, backend, publicação, gradientes (já removidos) nem na sombra em camadas (já aplicada).
