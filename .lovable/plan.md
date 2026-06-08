# Corrigir texto errado nas imagens geradas pela IA

## Causa

Modelos de imagem (Gemini, GPT-image) **desenham letras como pixels**, não como tipografia real. Resultado: "trabaio agoura" no lugar de "trabalho agora", palavras cortadas, acentos errados. Isso acontece em qualquer idioma, mas piora em pt-BR.

## Solução: separar arte e texto

A IA gera **apenas o fundo/cenário, sem nenhum texto**. O título e a frase de apoio são desenhados por cima via `<canvas>` com fonte real do navegador — zero erro ortográfico, 100% legível, e ainda fica editável depois no modo assistido.

```text
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│ IA gera fundo limpo  │  →   │ Canvas desenha texto │  →   │ Slide final salvo    │
│ (cenário, paleta,    │      │ (fonte real, sem     │      │ na galeria como      │
│ ícone — SEM letras)  │      │ erro ortográfico)    │      │ imagem composta      │
└──────────────────────┘      └──────────────────────┘      └──────────────────────┘
```

## Mudanças

### 1. `src/components/studio/workspace/AutoStudio.tsx`
- **`slideArt()`**: reescrever o prompt para **proibir** texto/letras/logos na imagem. Pedir só cenário visual (paleta, mood, ícones simbólicos, composição). Manter `brandImageDirective` que já reforça "não renderize texto".
- Após receber a imagem da IA, chamar um novo `composeSlideOverlay(bgUrl, heading, body, brand, idx, total)` e usar o **resultado composto** como `bgImage` do slide.
- Aplicar tanto no caminho de carrossel quanto no de post único.

### 2. Novo arquivo `src/lib/slide-compose.ts`
Helper puro de canvas (sem dependências externas):
- Carrega a imagem de fundo em um `<canvas>` 1024×1536.
- Desenha um gradiente sutil de leitura (overlay escuro embaixo) para garantir contraste.
- Desenha o **título** em fonte bold grande (ex: Inter/Plus Jakarta) com cor da marca como destaque na primeira palavra (estilo do mockup enviado pelo usuário).
- Desenha o **body/apoio** abaixo, em peso regular menor.
- Se `total > 1`, desenha o indicador "idx/total" no canto superior direito.
- Faz quebra de linha automática (`wrapText`) respeitando margens.
- Retorna um `data:image/png;base64,…` pronto para `saveVisualToGallery` (que já lida com data URLs).

### 3. Sem mudanças em edge functions
O `openai-image` continua igual. A correção é 100% client-side. Nenhuma alteração de schema, RLS ou secrets.

## Detalhes técnicos

- **Fonte**: usar a fonte do sistema de design já carregada (`Inter`, via Tailwind/index.css). Sem download extra de fonte → render imediato e determinístico.
- **Acessibilidade visual**: overlay com `rgba(0,0,0,0.55)` na metade inferior garante contraste WCAG mesmo se o fundo for claro.
- **Cor de destaque**: primeira ou última palavra do título recebe `brand.colors[0]` (laranja/âmbar no exemplo do usuário) — replica o padrão "Justiça **feita**" do mockup enviado.
- **Performance**: canvas roda em <100ms por slide; não muda o tempo total de geração.
- **Reuso**: o helper pode ser usado depois no modo assistido (Studio) para re-renderizar texto quando o usuário editar a legenda.

## Validação

1. Gerar um post com o mesmo prompt ("Justiça feita: o tempo de trabalho agora basta") e confirmar:
   - Fundo limpo sem nenhuma letra desenhada pela IA.
   - Texto sobreposto pelo canvas com ortografia perfeita.
   - Acentos corretos (ç, ã, é).
2. Gerar um carrossel de 3 slides e confirmar que o indicador "2/3" aparece e o texto de cada slide está correto.
3. Verificar que a imagem salva na galeria contém o texto sobreposto (não só o fundo).

## Fora de escopo

- Trocar o modelo de imagem (Gemini continua sendo o fallback).
- Editor de tipografia (cor/fonte/tamanho customizáveis). Pode vir depois se o usuário pedir.
- Re-renderizar imagens antigas da galeria.
