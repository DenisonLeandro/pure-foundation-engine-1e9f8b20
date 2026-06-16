# Galeria não carrega — diagnóstico e correção

## Causa raiz

O `SELECT` da Galeria está estourando o **statement timeout** do Postgres:

```
Failed to load creations: canceling statement due to statement timeout (57014)
```

Apesar de só existirem **7 registros** em `creations`, a coluna `urls` (jsonb/array) de 6 deles contém **`data:` URLs em base64 inteiras**, totalizando entre 8 MB e 11 MB **por linha**. Listar a galeria transfere ~55 MB por requisição, passa do limite e o PostgREST aborta. Por isso:

- a tela fica em "Carregando..." para sempre;
- quando carrega parcial, vem sem foto (as `data:` URLs antigas nem renderizam de forma confiável);
- "as fotos estão sumindo" — na prática nunca chegam ao cliente.

A função `persistUrls` já evita gravar `data:` em criações novas, mas as linhas antigas ficaram contaminadas.

## Correção (escopo mínimo, só Galeria)

### 1. Backfill das linhas existentes (data migration, sem mexer em schema)

Para cada `creation` cujo `urls`/`thumbnail_url` contém `data:`:

- decodificar o base64;
- subir para o bucket `media` em `gallery/<created_by ou user_id>/<uuid>.<ext>`;
- substituir a entrada em `urls` pelo `publicUrl`;
- atualizar `thumbnail_url` (primeiro item) coerentemente;
- se a string `data:` estiver truncada/ilegível, descartar essa entrada do array.

Feito uma única vez via insert/update tool (sem alterar tabelas/RLS).

### 2. Reduzir payload da listagem

Em `src/lib/gallery.ts → getCreations`:

- remover `design_doc` do `select` (campo pesado, usado só na edição);
- continuar trazendo `caption`, `thumbnail_url`, `urls`, etc.
- `getCreation(id)` continua trazendo `*` (inclui `design_doc`) para o Studio em modo edição.

Isso mantém o fluxo Galeria → Editar → Studio funcionando (o `design_doc` é carregado sob demanda quando o usuário abre o post).

### 3. Não mexer em

- RLS / policies de `creations`;
- schema de `creations` (colunas, índices já existem em `company_id`, `created_by`);
- Studio, Post for Me, Blotato, Autopilot, company_configs, chaves de API, permissões, agendamento, aprovação;
- `persistUrls` no save (já correto — previne regressão).

## Resultado esperado

- `/gallery` carrega em < 1 s mesmo nos posts antigos;
- thumbnails aparecem (URLs públicas do bucket `media`);
- Editar continua abrindo Studio com `design_doc` completo;
- Novos posts continuam salvando com URLs http (sem `data:`).

## Verificação após implementar

1. `SELECT id, octet_length(urls::text) FROM creations` → todas < 5 KB.
2. Abrir `/gallery` no preview → cards aparecem com imagem.
3. Clicar "Editar" em um post → Studio abre com o design carregado.
