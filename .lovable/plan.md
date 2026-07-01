Plano para corrigir a logo definitivamente:

1. Trocar o padrão da camada de logo
- A logo continuará sempre no canto superior esquerdo.
- O tamanho será baseado no exemplo enviado: pequena, discreta e com margem segura.
- Vou limitar o tamanho máximo para ela não voltar a aparecer gigante em canvases maiores.

2. Remover o “fundo preto” artificial
- A camada `brand_logo` não terá pill, caixa, sombra escura, fundo preenchido ou moldura adicionada pelo app.
- Ela será renderizada apenas como imagem transparente/contida.
- Se o preto vier do próprio arquivo cadastrado como logo, o app não vai adicionar mais nada por cima; nesse caso a solução correta será usar a versão transparente do arquivo da marca.

3. Normalizar logos antigas no documento
- Ao aplicar a logo, remover qualquer camada antiga `brand_logo` antes de inserir a nova.
- Ao abrir/refinar um post que já tem logo, recalcular posição e tamanho para o padrão novo.
- Isso evita a versão grande, duplicada ou deslocada continuar vindo de rascunhos/design_docs antigos.

4. Aplicar nos dois fluxos
- Corrigir o fluxo “Criar com IA”, onde a logo entra automaticamente nos posts novos.
- Corrigir o Studio/canvas, para quando o usuário abrir ou refinar o post a logo continuar igual ao padrão.

5. Resultado esperado
- Logo pequena no topo esquerdo, como no exemplo.
- Sem fundo preto criado pelo app.
- Sem duplicar logo.
- Sem alterar texto, layout, imagem de fundo, salvamento, edição por camadas ou funcionamento atual do editor.