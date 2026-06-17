O motivo de eu não conseguir fazer “exatamente igual e editável” com o ajuste anterior é este:

Hoje existem duas artes diferentes:

1. A imagem da Galeria é uma imagem final já rasterizada, criada por `composeSlideWithText` em canvas 1024×1536.
2. O editor reabre um `design_doc` com camadas recriadas por `buildEditableEls`, que o próprio código diz serem posições aproximadas, não pixel-perfect.

Então o Studio não está abrindo a mesma criação; ele está abrindo uma aproximação editável da imagem final. Quando tentei colocar a imagem final como fundo + camadas por cima, ficou visualmente igual por baixo, mas duplicou texto porque o texto já estava queimado na imagem final.

A solução correta é parar de ter dois renderizadores.

Plano de correção robusta:

1. Criar um renderizador único de slide do Studio.
   - Extrair o desenho atual do `DesignCanvas` para um componente compartilhado, por exemplo `StudioSlideRenderer`.
   - Esse renderer será usado tanto no editor quanto na exportação/salvamento.
   - Fundo, imagem, overlay, texto, fonte, cor, tamanho, quebra de linha, shapes e imagens passam a sair de uma única fonte.

2. Parar de salvar na Galeria a imagem composta por `composeSlideWithText` quando existir `design_doc`.
   - O fluxo automático pode continuar usando IA para criar fundo e conteúdo inicial.
   - Mas a imagem final salva na Galeria deve ser exportada a partir do próprio `design_doc` editável.
   - Assim, a Galeria mostra exatamente o que o editor renderiza.

3. Ajustar o AutoStudio.
   - Hoje ele cria `composedUrls` separados e salva esses URLs na Galeria.
   - Vou mudar para salvar/exportar a arte gerada pelo mesmo renderizador do Studio.
   - `composedUrls` deixam de ser a fonte visual principal quando houver camadas editáveis.

4. Corrigir o fluxo Galeria → Editar.
   - Se existir `design_doc`, abrir somente o documento por camadas.
   - Não aplicar a imagem final como fundo por cima.
   - Não reescalar se o documento já tiver canvas válido.
   - Não aplicar tema/refinamento/readability automaticamente na abertura.

5. Manter fallback para posts antigos.
   - Posts antigos sem `design_doc` continuam abrindo como imagem estática.
   - Posts antigos com `design_doc` aproximado podem ficar melhores, mas talvez não fiquem 100% iguais ao raster antigo porque o dado original pixel-perfect nunca foi salvo.
   - Para esses casos, posso manter uma opção técnica segura: “usar imagem final como referência bloqueada” apenas quando o usuário quiser comparar, mas não como camada padrão para não duplicar texto.

6. Garantias anti-IA/créditos.
   - O fluxo Editar não chamará `generateOpenAiImage`, `generateContent`, `aiAssist`, Higgsfield, Pexels ou qualquer geração.
   - Só lerá o registro salvo, montará o `design_doc` e salvará via `updateCreation`.

Resultado esperado:

- Novas criações salvas depois da correção abrem no editor visualmente iguais à Galeria e com textos/editáveis.
- O botão Editar não duplica texto.
- O botão Salvar atualiza o mesmo post.
- Posts antigos sem camadas continuam como imagem estática.
- Posts antigos feitos pelo pipeline antigo podem não ser 100% recuperáveis, porque a imagem final e o `design_doc` nasceram de renderizadores diferentes; a correção impede que isso continue acontecendo daqui para frente.