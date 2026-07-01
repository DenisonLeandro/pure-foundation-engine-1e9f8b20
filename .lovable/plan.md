## Objetivo
Voltar a logo dos posts para o padrão da referência enviada: selo pequeno “DL” no canto superior esquerdo, sem distorção e sem aumentar a marca.

## Correção proposta
1. Reverter o ajuste que deixou a logo pequena demais/errada em `src/components/studio/workspace/brandLogo.ts`.
2. Definir a camada de logo com tamanho mais próximo da referência:
   - largura/altura proporcional ao canvas, em torno de `14%` a `16%` da largura;
   - margem superior/esquerda discreta, em torno de `4%` a `5%` da largura;
   - `objectFit: "contain"` para não cortar nem distorcer.
3. Manter a logo sempre no topo esquerdo e travada (`locked=true`).
4. Não recriar selo, fundo, borda, pill ou qualquer “D” artificial no código — o app deve renderizar somente o arquivo de logo cadastrado.

## Importante
Se o arquivo cadastrado atualmente for o “D” grande sem fundo, o código não consegue transformar ele automaticamente no selo “DL” antigo. Nesse caso, depois dessa correção de tamanho/posição, será necessário cadastrar novamente a logo correta na tela de marca. A correção garante que, quando a logo correta estiver cadastrada, ela apareça no padrão da referência.

## Escopo
- Afeta apenas novos posts e posts que reaplicarem a logo.
- Não altera posts antigos automaticamente.
- Não muda layout, geração, texto, edição, galeria ou publicação.