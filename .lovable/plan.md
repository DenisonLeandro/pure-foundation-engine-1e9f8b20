## Como funciona hoje (sem mudar)
- A empresa envia a logo em **Marcas** → o arquivo vai pro storage do app e a URL fica em `brand_profiles.logo_url`.
- O Studio lê `currentBrand.logo_url` e aplica no post via `applyPreparedBrandLogo` (`brandLogo.ts`).
- **Nada muda nesse fluxo.** Nenhum upload novo, nenhuma dependência externa.

## Por que a qualidade está ruim
Dois pontos em `src/components/studio/workspace/brandLogo.ts` degradam a logo original mesmo quando ela já é um PNG transparente e nítido:

1. **`stripDarkLogoBackground`** reamostra o PNG para no máximo 1024 px, redesenha em canvas 2D e re-encoda com `toDataURL("image/png")`. Isso perde nitidez e ainda pode marcar pixels laranja-escuros do "D" como "fundo" e apagá-los.
2. **`logoLayout`** limita o tamanho a **48 px** de largura. Como o canvas do post é ~1080 px, o export precisa fazer upscale desse selo de 48 px → aspecto pixelado.

## Correção (apenas visual, dentro do app)

1. **Não reprocessar a logo.**
   - Em `brandLogo.ts`: simplificar `applyPreparedBrandLogo` para apenas chamar `applyBrandLogo(doc, logoUrl)` usando a URL original do storage. Sem canvas, sem `toDataURL`, sem cache.
   - Deletar `stripDarkLogoBackground` e `prepareBrandLogoUrl` (ou deixar como no-op) para não voltarem a ser chamadas.

2. **Tirar o teto de tamanho.**
   - Em `logoLayout`: manter proporção ~11 % da largura do canvas (aparência aprovada) sem o `clamp(..., 36, 48)`. Manter só um piso mínimo (~48 px) e nenhum teto. Assim a logo é desenhada em resolução nativa e o export não faz upscale.

3. **Recalibrar posts já abertos.**
   - `docHasCurrentBrandLogo` já detecta layout antigo como desatualizado → ao reabrir/refinar um post, `applyBrandLogo` reaplica com o novo tamanho e com a URL original limpa (substituindo o data URL degradado que ficou salvo).

4. **Confirmar qualidade no draw.**
   - Em `DesignCanvas.tsx` e `renderDocOffscreen.ts`, garantir `imageSmoothingEnabled = true` e `imageSmoothingQuality = "high"` no `drawImage` da logo. Se já estiver, nada muda.

## Fora de escopo
- Não muda posição (segue topo-esquerda).
- Não muda o upload em Marcas nem o campo `brand_profiles.logo_url`.
- Não altera posts antigos que não forem reabertos.
- Não envia nada pra fora do app.

## Arquivos a alterar
- `src/components/studio/workspace/brandLogo.ts`
- `src/components/studio/workspace/DesignCanvas.tsx` (só confirmar smoothing)
- `src/components/studio/workspace/renderDocOffscreen.ts` (só confirmar smoothing)
