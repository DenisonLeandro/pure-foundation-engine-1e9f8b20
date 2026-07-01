## Problema

A logo aparece duplicada e "empacotada" numa pill escura porque hoje existem duas fontes desenhando a logo ao mesmo tempo:

- `applyBrandLogo` (em `src/components/studio/workspace/brandLogo.ts`) insere uma camada editável `role="brand_logo"` em cada slide de posts novos.
- `DesignCanvas.tsx` e `renderDocOffscreen.ts` também desenham, por conta própria, um "selo" decorativo (pill 42×42 com borda branca, fundo `rgba(10,12,20,0.45)` e blur) contendo a logo — sempre, em todo slide.

O `DesignCanvas` tenta evitar o selo quando já existe a camada brand_logo, mas o `renderDocOffscreen` (usado no export offscreen que gera a imagem final da galeria) não checa nada. Resultado: no editor às vezes você vê só a camada; na imagem final salva sai a camada + o selo em cima = dois "D" sobrepostos.

## Objetivo

Fazer com que apenas a logo da marca apareça em cada post — nada além dela: nenhuma pill, nenhuma borda, nenhum fundo escuro, nenhuma duplicação. Sem mexer no fluxo (posts continuam recebendo a logo automaticamente, continua editável).

## Mudanças

1. `src/components/studio/workspace/DesignCanvas.tsx`
   - Remover o bloco que renderiza o "selo" decorativo (`{brand?.logo_url && !s.els.some(...)} ... <div className="absolute left-[12px] top-[12px] ...">`). A logo passa a vir exclusivamente da camada editável `brand_logo` inserida por `applyBrandLogo`.

2. `src/components/studio/workspace/renderDocOffscreen.ts`
   - Remover o bloco equivalente (linhas ~129–163) que cria o `badge` + `logo` div. A logo renderizada no export passa a vir só do El `brand_logo` já presente no doc (que o loop de elementos existente já desenha como imagem normal).

3. `src/components/studio/workspace/brandLogo.ts` (ajuste fino, opcional mas recomendado)
   - Como agora a logo é a única marca visível, garantir que o El gerado por `makeLogoEl` use `objectFit: "contain"` (já usa) e nenhum fundo/borda extra (já é uma imagem pura). Sem mudança de tamanho/posição — mantém o comportamento atual do canto superior esquerdo com margem proporcional.

4. Nada mais muda:
   - `StudioWorkspace.tsx` continua chamando `applyBrandLogo` automaticamente em posts novos.
   - Posts antigos que não têm a camada `brand_logo` simplesmente deixam de mostrar o selo decorativo (comportamento coerente com "só logo, nada além"). Se o usuário quiser adicioná-la depois, o botão/fluxo existente já resolve.
   - Nenhuma alteração em banco, em edge functions, em `slide-compose.ts`, no `AutoStudio`, no `Copilot` ou no export final.

## Resultado esperado

- Um único "D" por slide, no canto superior esquerdo, sem pill escura, sem borda branca, sem blur — exatamente a logo da marca cadastrada no perfil, nada mais.
- A camada continua editável (mover, redimensionar, ocultar apagando a camada) porque é o El `brand_logo` normal.
- Export/galeria e editor passam a mostrar exatamente a mesma coisa.
