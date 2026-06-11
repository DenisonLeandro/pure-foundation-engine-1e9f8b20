# Fix: "Editar design" abrindo Studio vazio

## Diagnóstico

O `StudioDoc` representa fundo de imagem como `slide.bgImage` (string URL) em `src/components/studio/workspace/types.ts`. Hoje, ao gerar via IA, o documento que vai para `design_doc` muitas vezes não tem `bgImage` persistente — a imagem final só existe em `creation.urls[0]`. Como `sanitizeDesignDoc` remove `data:`/`blob:`, o doc reaberto pode vir sem fundo, e o Studio cai no `bg` (gradiente) padrão → canvas "vazio".

A correção é puramente de fallback no abrir: sempre mandar `creation.urls[0]` junto, e, se o primeiro slide não tiver fundo visual válido, aplicar essa URL como `bgImage`.

## Mudanças

### 1. `src/pages/Gallery.tsx` — `handleEditDesign`
Sempre enviar `fallbackImageUrl`, mesmo quando `designDoc` existe:

```ts
const fallback = creation.urls?.[0] ?? creation.thumbnailUrl ?? null;
navigate("/studio", {
  state: {
    designDoc: creation.designDoc ?? null,
    creationId: creation.id,
    fallbackImageUrl: fallback,
  },
});
```

Manter o `toast` informativo apenas no caso em que **não** há `designDoc` (legado). Nenhum botão removido.

### 2. `src/pages/Studio.tsx` — helper + `buildInitial`
Adicionar helper local:

```ts
function slideHasVisual(s?: Slide): boolean {
  if (!s) return false;
  if (typeof s.bgImage === "string" && /^https?:\/\//i.test(s.bgImage)) return true;
  return (s.els || []).some(
    (e) => e.type === "image" && typeof e.src === "string" && /^https?:\/\//i.test(e.src)
  );
}

function ensureDocHasVisualFallback(doc: StudioDoc, fallbackImageUrl?: string | null): StudioDoc {
  if (!fallbackImageUrl || !/^https?:\/\//i.test(fallbackImageUrl)) return doc;
  const slides = [...(doc.slides ?? [])];
  if (!slides.length) slides.push({ bg: "#0b0b0f", els: [] });
  if (!slideHasVisual(slides[0])) {
    slides[0] = { ...slides[0], bgImage: fallbackImageUrl };
  }
  return { ...doc, slides };
}
```

Em `buildInitial`:
- Se `nav.designDoc` válido → retornar `ensureDocHasVisualFallback(nav.designDoc, nav.fallbackImageUrl)`.
- Se apenas `nav.fallbackImageUrl` → manter o caminho já existente (cria doc vazio com `bgImage`).
- Caminho legado (sourceContent/prompt/mediaUrls) intocado.

### 3. `StudioWorkspace.handleSaveDesign` — preservar fallback antes de salvar
Antes do `exportSlides()` e `updateCreation`, se o `doc` atual ainda não tiver visual válido no primeiro slide e tivermos um `fallbackImageUrl` conhecido, aplicar via `ensureDocHasVisualFallback` para garantir que o `design_doc` salvo continue reabrindo com fundo.

Para isso:
- `Studio.tsx` passa `fallbackImageUrl` como prop a `StudioWorkspace`.
- `StudioWorkspace` aceita `fallbackImageUrl?: string` e usa na hora de salvar (chamando `set({ slides })` ou compondo o doc enviado em `sanitizeDesignDoc`).

## Campos do StudioDoc usados
- Fundo de imagem do slide: `Slide.bgImage` (URL `http(s)`).
- Imagem como elemento: `El { type: "image", src }` — considerado válido para não duplicar fundo.

## Não muda
- `sanitizeDesignDoc` (continua removendo `data:`/`blob:`).
- Publicação/agendamento, PublishDrawer/Panel, Post for Me, Blotato.
- Edge functions, AuthContext, AppContext, banco e migrações.
- Nenhum botão da Galeria é removido.

## Arquivos alterados
- `src/pages/Gallery.tsx`
- `src/pages/Studio.tsx`
- `src/components/studio/workspace/StudioWorkspace.tsx`

## Teste
1. Item com `designDoc` que veio sem `bgImage` → abre com a arte original como fundo + textos editáveis por cima.
2. Item legado sem `designDoc` → abre com imagem como fundo, permite adicionar textos.
3. Item com `designDoc` que já tem `bgImage` http(s) → abre igual a hoje (sem duplicar).
4. "Salvar alterações" → galeria atualiza thumbnail e o doc reabre com fundo na próxima vez.
