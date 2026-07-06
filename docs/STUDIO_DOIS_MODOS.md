# Studio — Dois modos de criação de posts

**Status:** Em execução — Fases 0 e 1 concluídas; Fases 2–3 pendentes
**Última atualização:** 06/07/2026

Documento de planejamento das alterações no Studio para oferecer **dois modos
distintos de criação da arte de posts para redes sociais**. Escrito para
alinhamento antes da implementação. Nada aqui foi codado ainda (exceto onde
indicado).

---

## 1. Objetivo

Hoje o Studio gera a arte do post em **duas etapas fixas**: a IA cria apenas o
**fundo** (com texto proibido no prompt) e o app desenha o **texto por cima**
via canvas. Isso garante texto editável e sem erro de grafia, mas o layout fica
mais simples do que uma arte feita inteiramente por IA (ex: ChatGPT).

A pedido do usuário, vamos oferecer **dois caminhos claros**, cada um com o
editor adequado ao seu formato:

| | **Modo 1 — IA cria a arte completa** | **Modo 2 — Foto real + texto editável** |
|---|---|---|
| Imagem | IA gera a arte inteira (fundo + texto embutido) | Foto real do Pexels de fundo |
| Texto | Pintado pela IA, dentro da imagem (pixels) | Objeto editável por cima (canvas) |
| Editor | **Caixa de texto**: pede mudanças, a IA reedita a imagem | **Canvas atual**: clicar, editar, arrastar |
| Estado hoje | Novo (a construir) | Já existe (só expor) |

> **Regra do formato (imutável):** imagem de IA é pixel, não camada. Texto
> pintado pela IA **não** é clicável/editável — só regenerável. Por isso os dois
> modos existem: um troca edição por riqueza visual, o outro troca riqueza por
> controle e edição precisa.

---

## 2. Decisões travadas

1. **Tela inicial:** apenas os **2 modos novos**. O cartão de "Criação assistida"
   (canvas em branco) sai da entrada. **O motor do canvas continua existindo**
   por baixo, pois ele é o editor do Modo 2 e também é usado ao editar posts
   pela Galeria.
2. **Modo 1 — entrada crua:** sem presets de objetivo, sem sugestões de direção,
   sem prompt longo de direção de arte. Apenas a **descrição livre do usuário**.
3. **Modo 1 — única injeção automática:** as **cores da marca da empresa ativa**
   (`BrandProfile.colors`). Cada empresa gera posts com a própria cara. É
   tematização por **empresa ativa** (um post por vez), não geração em lote.
4. **Modo 1 — logo:** a IA cria a arte com as cores; o app **sobrepõe a logo
   real** da marca por cima (nítida e correta), recolocada a cada reedição.
5. **Modo 1 — edição de texto:** feita por **reedição da imagem** (endpoint
   `/v1/images/edits`). O usuário descreve a mudança e a IA repinta.
6. **Modo 2:** reaproveita o fluxo de foto do Pexels + texto editável no canvas,
   como já funciona hoje.
7. **Legenda + publicação:** inalteradas nos dois modos (reaproveitam o que já
   existe).

---

## 3. O que já existe e será reaproveitado

- `StudioEntry.tsx` — tela "Como você quer criar hoje?" (os 2 cartões entram aqui).
- `Studio.tsx` — já roteia entre `entry` / `auto` / `assisted`.
- Canvas editável (`DesignCanvas.tsx` + tipos `El` em `types.ts`) — é o editor do Modo 2.
- Caminho do Pexels — `slideStockPhoto()` em `AutoStudio.tsx`.
- Salvar / Publicar / Galeria — `StudioWorkspace.tsx` + `lib/gallery.ts`.
- `StudioDoc.canvas.source: "finalImage" | "designDoc" | "fallback"` — o sistema
  já distingue imagem chapada (Modo 1) de documento editável (Modo 2).
- Lógica de posicionamento da logo — `brandLogo.ts` (`applyBrandLogo`).

---

## 4. Fases de construção

### Fase 0 — Correção do bug da logo duplicada ✅ CONCLUÍDA

**Problema confirmado:** a logo é renderizada por dois mecanismos que não
conversam:

- Como elemento `brand_logo` (`El`) adicionado por `applyBrandLogo`
  (auto-aplicado em criações novas — `StudioWorkspace.tsx:170-179`).
- Como "selo automático" desenhado direto pelo renderizador.

No renderizador de **exportação** (`renderDocOffscreen.ts`), os dois acontecem
ao mesmo tempo:
- Linha **61**: percorre os elementos e desenha o `brand_logo` El (logo #1).
- Linha **124**: desenha o selo automático **sem checar** se o El já existe (logo #2).

Resultado: a imagem exportada/publicada/thumbnail sai com **2 logos**. O editor
ao vivo mostra só 1 porque `DesignCanvas.tsx:242` já tem a trava
(`!s.els.some((e) => e.role === "brand_logo")`); o `renderDocOffscreen` não tem.
Isso explica o "às vezes duplica": buga só na imagem final, não no preview.

**Bug secundário:** como o selo automático é incondicional na exportação, o botão
"Ocultar logo" não esconde de verdade na imagem final.

**Conserto:** aplicar no `renderDocOffscreen.ts` a **mesma trava** do
`DesignCanvas` — só desenhar o selo automático quando **não** houver o
`brand_logo` El no slide.

**Efeitos:** acaba a duplicação; conserta o "Ocultar logo"; unifica a logo em um
mecanismo único e previsível — exatamente a base em que o Modo 1 vai se apoiar.

**Arquivo:** `src/components/studio/workspace/renderDocOffscreen.ts`

**Entregue:** guard aplicado (`!slide.els.some((e) => e.role === BRAND_LOGO_ROLE)`).
Validado por type-check, lint, testes e build de produção. Commit `8416953`.

**Nota (superseded):** a `main` corrigiu o mesmo bug em paralelo, de forma mais
abrangente — **removeu o selo automático por completo** (logo passa a ser
renderizada só pela camada `brand_logo`) e, no mesmo commit, consertou a
**imagem esticada** no export (`html2canvas` não respeita `object-fit` →
troca para `background-image`). Ao mergear a `main`, o `renderDocOffscreen.ts`
ficou com a versão dela (superior); nossa correção local foi descartada por
redundância. O bug da logo duplicada **está resolvido** de qualquer forma.

---

### Fase 1 — Modo 2 exposto na entrada ✅ CONCLUÍDA

- `StudioEntry.tsx`: reformulado para os 2 cartões — "Foto real + texto editável"
  (Modo 2, funcional) e "IA cria a arte completa" (Modo 1, cartão "Em breve").
- `Studio.tsx`: a escolha do cartão passa a origem da imagem via nova prop.
- `AutoStudio.tsx`: nova prop `initialImageSource` (default da origem da imagem).
- Cartão de criação manual removido da entrada.

**Descoberta:** o Modo 2 **já existia** dentro do fluxo "Criar com IA"
(`AutoStudio`) — havia um seletor "Origem da imagem" (Pexels/AI) com Pexels como
padrão, produzindo foto de fundo + texto editável no canvas. A Fase 1 apenas
**expôs** isso como um modo claro na entrada. O seletor interno permanece
disponível dentro do fluxo (flexibilidade); o Modo 1 dedicado (imagem chapada +
caixa de texto) vem nas Fases 2–3.

**Validado:** type-check, lint e build de produção limpos. Commit `b5e491e`.

---

### Fase 2 — Modo 1: geração *(médio esforço)*

- Novo caminho de prompt que **permite** texto e layout completos (sem tocar no
  caminho do Modo 2). Prompts atuais que **proíbem** texto:
  - `src/lib/brand.ts` → `brandImageDirective` ("Não renderize texto…").
  - `AutoStudio.tsx` / `Copilot.tsx` → "ABSOLUTAMENTE PROIBIDO texto".
- Entrada crua: caixa de texto livre + injeção só das **cores da marca ativa**
  (diretiva mínima, não a `brandImageDirective` completa).
- A IA escreve a copy (via `aiAssist`) e ela entra no prompt da imagem.
- Saída: imagem gerada (`source: "finalImage"`) + **logo real sobreposta**
  (reusar posicionamento de `brandLogo.ts`).
- Componente novo de tela de resultado (ex: `AiImageEditor.tsx`).

---

### Fase 3 — Modo 1: editor conversacional *(médio-alto esforço)*

- **Backend:** estender `supabase/functions/openai-image/index.ts` para suportar
  **edição** (`/v1/images/edits`, multipart com imagem de entrada), além da
  geração atual (`/v1/images/generations`).
- **Cliente:** adicionar `editOpenAiImage({ image, prompt })` em
  `src/lib/api/openai.ts`.
- **UI:** caixa de texto "O que deseja mudar?" + histórico (desfazer) + botões de
  atalho. A cada edição, a logo real é recolocada por cima.

---

## 5. Arquivos que serão tocados

| Arquivo | Mudança |
|---|---|
| `renderDocOffscreen.ts` | Fase 0 — trava do selo de logo |
| `StudioEntry.tsx` | 2 cartões novos; remover o manual |
| `Studio.tsx` | roteamento do modo novo |
| `AutoStudio.tsx` | caminho de geração Modo 1 (com texto) vs Modo 2 (Pexels) |
| `brand.ts` / prompts | caminho novo que permite texto (sem quebrar o Modo 2) |
| `openai-image/index.ts` (backend) | **novo** suporte a `/v1/images/edits` |
| `lib/api/openai.ts` | **novo** `editOpenAiImage()` |
| `AiImageEditor.tsx` | **novo** componente (imagem + caixa de texto) |

---

## 6. Riscos e limites honestos (Modo 1)

- **Grafia em pt-BR** pode falhar às vezes (a **logo** não, porque é overlay real).
- **Cada pedido na caixa = uma geração** (~10-20s, custa crédito).
- **Reedição imprevisível:** pedir "muda o título" pode alterar levemente outras
  partes, porque a IA refaz a imagem inteira (natureza de texto embutido — sem
  contorno mantendo o texto na imagem).
- **Timeout de 150s** da Edge Function: manter qualidade "medium" no editor para
  não estourar.

---

## 7. Contexto técnico útil

- **Modelo de imagem:** `gpt-image-2` (padrão em `openai-image/index.ts`),
  confirmado como o modelo atual da OpenAI. Fallback automático para Gemini
  (Lovable AI Gateway) quando não há chave OpenAI configurada no Supabase Vault.
- **Chave OpenAI:** resolvida no backend (header por-usuário → Supabase Vault
  `OPENAI_API_KEY` → env). Sem chave = fallback Gemini silencioso.
- **Canvas padrão:** 360×450 (preview), export 1080×1350 (4:5 Instagram).
  Imagem gerada em 1024×1536 (2:3, mais próximo aceito pelo gpt-image-2).
