## Problema

Posts criados pelo fluxo **Criar com IA** (`AutoStudio`) estão vindo sem a logo da marca. Motivo: `applyBrandLogo` só é chamado dentro do `StudioWorkspace` (canvas manual). O `AutoStudio` monta o `StudioDoc` e chama `renderDocOffscreen` direto, sem inserir a camada `brand_logo`. Como a camada nunca é criada, nada é desenhado (o selo decorativo antigo já foi removido).

## Correção

Editar `src/components/studio/workspace/AutoStudio.tsx`:

1. Importar `applyBrandLogo` de `./brandLogo`.
2. Após montar `finalDoc` (linha 514), se `brand?.logo_url` existir, aplicar:
   ```ts
   const withLogo = brand?.logo_url ? applyBrandLogo(finalDoc, brand.logo_url) : finalDoc;
   setDoc(withLogo);
   autoSave(withLogo).then(...);
   ```

Assim a logo entra como camada editável (`role="brand_logo"`, `locked=true`) em todos os slides, é desenhada pelo `renderDocOffscreen` no export final e continua editável ao abrir na Galeria → Editar.

## Fora do escopo

- Não mexer no `StudioWorkspace` (já aplica corretamente).
- Não recriar o selo decorativo removido anteriormente.
- Não alterar posts antigos: só afeta criações novas do AutoStudio.