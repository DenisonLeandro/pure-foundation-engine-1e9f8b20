## O que mudar

Dois problemas diferentes no mesmo arquivo/fluxo de templates editoriais.

### 1) Legibilidade sem gradiente — sombra "escondida"

Hoje o texto usa um `text-shadow` único e relativamente duro (`0 2px 10px rgba(0,0,0,.55)`), que parece um halo escuro atrás do texto. Vou trocar por uma **sombra em camadas, suave e quase invisível**, que escurece só o suficiente embaixo das letras sem gerar mancha:

- Nova sombra padrão (editor + raster):
  `0 1px 1px rgba(0,0,0,.55), 0 2px 6px rgba(0,0,0,.35), 0 8px 24px rgba(0,0,0,.28)`
- Versão "strong" pro título: mesma fórmula com blurs um pouco maiores, sem aumentar opacidade total.
- Remover os pequenos traços brancos decorativos (`top` e `kicker`) que ficam parecendo "régua" no meio da foto — substituir por uma única linha de 1px, 30% branco, opcional.
- Garantir que **nenhum overlay/gradiente** seja injetado: confirmar que `ensureReadableTextLayers` continue pulando elementos com `shadow` (já pula), e que `refineDesignAesthetics` não estique nada quando não houver overlays de readability (já é o caso).

### 2) Texto sobrepondo texto

Causado por posições fixas em `editableEls.ts`: quando o título quebra em mais linhas que o `h` reservado, ele invade a área da legenda/handle.

Vou recalcular o layout dos 4 templates dando mais altura ao bloco do título e empurrando legenda/handle pra fora:

- **bottom**: título `y=240, h=170` (era 268/130). Legenda `y=414, h=24`. Handle vai pra `y=H-14` com fontSize 8 e opacidade menor.
- **top**: título `y=64, h=170`. Legenda `y=242, h=70` (era 208/50). Contador/handle ficam no rodapé sem colidir.
- **center-card**: título `y=150, h=150`, legenda `y=308, h=70`.
- **kicker**: kicker label `y=240`, título `y=262, h=150`, legenda `y=420, h=24`. Antes a legenda começava em 396 e o título reservava 110 a partir de 280 — qualquer quebra extra de linha já colidia.

Mesmas reduções de fonte e espaçamento espelhadas no `slide-compose.ts` (gallery rasterizada) pra editor e galeria continuarem visualmente idênticos. O renderizador raster já mede texto, então só preciso garantir margens consistentes e o mesmo `applyTextShadow` novo.

### Arquivos tocados

- `src/components/studio/workspace/editableEls.ts` — nova constante `SHADOW`, novas coordenadas dos 4 templates, remover linhas brancas duras.
- `src/lib/slide-compose.ts` — `applyTextShadow`/`applyTextShadow(strong)` reescritos pra mesma fórmula em camadas, remover o `fillRect` da linha branca em `renderTop` e `renderKicker`, espaçamento `y` ajustado pra bater com o editor.

### Fora de escopo

Sem mexer em geração de imagem, IA de copy, banco, publicação ou no fluxo `designAesthetics`/`designReadability` (eles já estão neutros pra texto com shadow).
