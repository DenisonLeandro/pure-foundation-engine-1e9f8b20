## Diagnóstico

O carrossel que você anexou é exatamente o padrão que quer. Olhando os 5 slides:

- **Slide 1** — título grande embaixo à esquerda, corpo curto abaixo, contador `1/5` no topo direito, **sem gradiente** — só sombra sutil no texto.
- **Slide 2** — cartão escuro translúcido no centro com título + corpo dentro.
- **Slide 3** — título grande no topo à esquerda, corpo abaixo, contador `3/5` no rodapé direito, com pequeno traço acima do título.
- Variação entre slides, todos elegantes, leves, sem barra colorida agressiva e sem escurecer a foto inteira.

O que quebrou: (1) coloquei um gradiente escuro forte no `bottom`, (2) travei todos em `bottom`.

## Correções

### 1. Remover o gradiente visível
Tirar a camada de gradiente do template `bottom` (tanto no editor quanto na rasterização). Manter apenas **`text-shadow` sutil** no título e corpo para legibilidade. Foto fica limpa.

Fazer o mesmo nos demais templates: nenhum gradiente cobrindo a foto inteira. O único "escurecer" permitido é o cartão translúcido localizado do `center-card`.

### 2. Voltar a variar entre slides
Restaurar a rotação de templates entre slides do carrossel, usando só os quatro que combinam com a referência:

- `bottom` (slide 1 da referência)
- `top` (slide 3 da referência)
- `center-card` (slide 2 da referência)
- `kicker` (variação editorial com pequeno rótulo)

Remover `side-bar` (bloco lateral colorido) e `quote` (citação centralizada) da rotação automática — continuam disponíveis se o usuário escolher manualmente.

Capa (slide 0) sempre `bottom`. Demais slides alternam entre os outros três para garantir variação visual.

### 3. Refinar `center-card`
Cartão mais elegante: fundo `rgba(15,20,35,0.55)` (mais transparente), `backdrop-filter: blur(8px)`, cantos `radius: 14px`, padding interno generoso. Sem borda dura.

### 4. Refinar `top` e `kicker`
- `top`: pequeno traço fino (`2px`, branco 60%) acima do título, sem cor de marca; sombra leve no texto.
- `kicker`: rótulo em caixa alta pequeno (ex.: `MITO 02`), traço curto, título grande abaixo.

### 5. Aplicar nos dois renderers
Atualizar tanto `editableEls.ts` (camadas editáveis no editor) quanto `slide-compose.ts` (PNG salvo na galeria) com os mesmos valores, mantendo Galeria ↔ Editor idênticos.

### 6. Escopo
Sem mexer em IA, prompts, geração de imagem, legenda, banco ou publicação. Só composição visual dos slides novos. Posts antigos não mudam.

## Resultado esperado
Novos carrosséis saem alternando entre os quatro layouts editoriais, sem escurecimento visível na foto, com tipografia branca grande e leve, contador discreto — o padrão da referência.
