## Plano revisado

Você quer que os novos posts venham no padrão da imagem anexada:

- imagem de fundo em tela cheia;
- leve escurecimento/gradiente na parte inferior para leitura;
- título grande, branco, pesado, alinhado à esquerda, no canto inferior;
- texto descritivo pequeno abaixo do título;
- contador pequeno no topo direito;
- sem faixa/card escuro atravessando o post;
- sem linha/barrinha laranja;
- sem padronização tipo “bloco roxo” da primeira imagem.

## O que vou alterar

### 1. Template principal de capa/post
Vou ajustar o template `bottom`, que hoje é usado como capa padrão dos carrosséis e em muitos posts únicos, para ficar nesse estilo editorial da referência.

### 2. Elementos editáveis do editor
No `design_doc`, o título e o texto continuarão sendo camadas editáveis, mas serão criados já com:

- título maior;
- posição inferior esquerda;
- corpo pequeno logo abaixo;
- gradiente inferior como camada de fundo;
- sem barra decorativa.

### 3. Renderização final salva na Galeria
Vou aplicar a mesma composição na renderização final, para manter o objetivo anterior: o que aparece na Galeria deve abrir igual no editor, sem duplicar texto.

### 4. Escopo
Não vou mudar a imagem de fundo, geração por IA, legenda, banco, publicação ou outros templates. A mudança afeta novas gerações daqui pra frente; posts antigos já salvos não são recriados automaticamente.

## Resultado esperado
Novos posts/carrosséis passam a sair com o padrão visual da referência anexada: editorial, limpo, título grande embaixo à esquerda, fundo escurecido só para leitura e tudo ainda editável no editor.
