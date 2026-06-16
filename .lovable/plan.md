## Diagnóstico

As fotos voltaram a sumir porque novas criações estão sendo salvas novamente com URLs `data:image/png;base64...` enormes dentro da tabela `creations`.

Hoje já existem **4 criações recentes** nessa situação. Isso faz a Galeria carregar payloads gigantes e voltar a travar/mostrar vazio. A causa provável está no caminho de salvar edição/criação do Studio: `updateCreation` salva `urls` diretamente, enquanto `saveVisualToGallery` converte `data:` para arquivo no storage.

## Plano de correção definitiva

1. **Blindar a camada da Galeria**
   - Ajustar `updateCreation` para nunca persistir `data:` ou `blob:` em `urls`/`thumbnailUrl`.
   - Antes de salvar, converter automaticamente qualquer `data:` para arquivo público no bucket `media`, igual já acontece no `saveVisualToGallery`.
   - Manter `design_doc` fora da listagem para não reintroduzir timeout.
   - Manter edição funcionando como hoje, buscando `design_doc` sob demanda.

2. **Corrigir os registros já afetados**
   - Fazer backfill das 4 criações recentes que estão com base64 no banco.
   - Enviar as imagens para `media/gallery/<user_id>/...` e substituir `urls` e `thumbnail_url` por URLs públicas permanentes.
   - Não apagar posts, legendas, design editável, status ou ordem.

3. **Preservar comportamento atual do app**
   - A tela da Galeria continua igual.
   - O botão de editar continua abrindo o Studio como hoje.
   - Salvar no Studio continua atualizando a mesma criação.
   - Apenas muda o armazenamento interno das imagens para um formato estável.

4. **Validação**
   - Conferir no banco que não sobrou nenhum `data:` em `creations.urls` ou `thumbnail_url`.
   - Verificar que a consulta da Galeria retorna payload leve.
   - Confirmar que as imagens têm URLs públicas e carregáveis.

## Arquivos previstos

- `src/lib/gallery.ts`
  - centralizar normalização/persistência de URLs em `saveCreation` e `updateCreation`.

Sem alteração de layout, navegação, permissões, RLS, Studio visual ou fluxo de edição.