## Objetivo

Mais legibilidade nos textos sem voltar a usar tarja/gradiente visível. Se houver algum escurecimento atrás do texto, precisa ser MUITO discreto — invisível como bloco, perceptível só como "respiro".

## Mudanças

### 1) Sombra do texto mais densa (sem virar mancha)

Em `src/components/studio/workspace/editableEls.ts`, reforçar as duas constantes `SHADOW` e `SHADOW_STRONG` com mais camadas curtas (que aumentam contraste rente à letra) sem subir o blur amplo (que viraria mancha):

```
SHADOW =
  "0 1px 0 rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.7),
   0 2px 6px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.35)"

SHADOW_STRONG =
  "0 1px 0 rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.8),
   0 2px 8px rgba(0,0,0,0.55), 0 10px 28px rgba(0,0,0,0.4)"
```

A primeira camada (offset 1px, blur 0) funciona quase como contorno preto fino — dá leitura sobre qualquer foto. As demais distribuem o peso sem criar borrão.

Espelhar no `src/lib/slide-compose.ts` (função `paintTextWithShadow`) com as mesmas três passadas: contorno, sombra média, halo amplo.

### 2) Halo radial MUITO discreto atrás do título (opcional, só nos templates onde o título manda)

Adicionar uma "respiração" suave atrás do bloco do título em `bottom`, `center-card` e `kicker`. Não é tarja: é um ÚNICO shape com:
- Cor `rgba(0,0,0,0.18)` (18% — quase invisível sobre foto média/clara, perceptível só onde a foto é clara demais)
- `radius: 999` (forma de pílula totalmente arredondada)
- Padding generoso ao redor do texto (px 24 horizontal, 16 vertical)
- `zIndex` abaixo do título

Esse shape entra como elemento `rb-bg-*` em `buildEditableEls` (mesmo padrão dos overlays de leitura), mas com opacidade tão baixa que `designAesthetics.restyleOverlay` não vai esticá-lo (já que `isLargeOverlay`/`isFullWidth` exigem cobertura >45% — o halo é menor que isso).

Como o `ensureReadableTextLayers` hoje pula textos com `shadow` e NÃO injeta overlay por cima, esse halo entra ANTES da etapa de readability e sobrevive intacto.

### 3) Confirmar que designAesthetics não vai engordar o halo

Em `src/components/studio/workspace/designAesthetics.ts`, adicionar uma regra em `restyleOverlay`: se o overlay já está com opacidade ≤ 0.22 (ou seja, foi pré-definido como halo discreto), apenas mantém — não troca a cor nem aplica os estilos do preset.

## Arquivos tocados

- `src/components/studio/workspace/editableEls.ts` — novas sombras + halo opcional atrás do título em 3 templates.
- `src/lib/slide-compose.ts` — `paintTextWithShadow` espelhando o contorno tight + halo distribuído.
- `src/components/studio/workspace/designAesthetics.ts` — preserva halos já discretos.

## Fora de escopo

Sem mexer em IA, backend, publicação, posições dos textos (já corrigidas), risquinho laranja (já reposicionado) ou layout.

## Decisão a confirmar

Posso aplicar o halo de 18% atrás do título (item 2)? Se preferir só sombra mais densa (item 1) sem QUALQUER mancha atrás do texto, eu pulo o item 2. Confirma qual?
