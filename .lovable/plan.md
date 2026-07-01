## Objetivo
Deixar a camada da logo do mesmo tamanho da referência menor (imagem 2), fixa no canto superior esquerdo, sem mexer no resto do app.

## Mudança
Arquivo único: `src/components/studio/workspace/brandLogo.ts` → `makeLogoEl`.

- Tamanho: `~0.11 * canvasW` (mín. 40px). Bate com a proporção da imagem 2 (selo pequeno, discreto).
- Margem: `~0.04 * canvasW` (mín. 14px), igual em `x` e `y` → sempre canto superior esquerdo.
- Continua `locked=true`, `objectFit: "contain"`, `zIndex: 50`, aplicado a todos os slides via `applyBrandLogo`.

## Escopo
- Novos posts (fluxo "Criar com IA") e edições que reaplicarem a logo passam a usar o novo tamanho.
- Posts antigos salvos continuam como estão — a camada só troca quando `applyBrandLogo` roda de novo.
- Fundo escuro do arquivo permanece intacto (é parte do PNG enviado).

## Fora do escopo
`AutoStudio`, `StudioWorkspace`, `DesignCanvas`, `renderDocOffscreen`, upload/gestão de logo — nada disso é tocado.
