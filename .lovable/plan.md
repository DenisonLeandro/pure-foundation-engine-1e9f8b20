# Carrosséis com layouts variados

## Diagnóstico

As 3 imagens que você mandou **têm cenas diferentes** (prédios, capacete, engrenagens) — a IA da imagem já está variando. O que está **idêntico** é a **composição do texto**: sempre o mesmo template em `src/lib/slide-compose.ts`:

- Fundo escuro com gradiente embaixo
- Contador "1 / 5" no canto superior direito
- Título em baixo à esquerda, primeira palavra colorida, resto branco
- Linhinha laranja no rodapé

Como esse template é fixo, **todo post sai com a mesma cara**, mesmo com fundos diferentes. Por isso parecem "iguais".

## O que vou mudar

### 1. Biblioteca de layouts (`src/lib/slide-compose.ts`)
Criar **6 templates de composição** distintos, todos respeitando a paleta da marca:

| Template      | Onde fica o texto              | Tratamento                                     |
|---------------|--------------------------------|------------------------------------------------|
| `bottom`      | rodapé (atual)                 | título grande, body abaixo, linha de marca     |
| `top`         | topo                           | título no topo, fundo limpo embaixo            |
| `center-card` | centro                         | card translúcido com blur por trás do texto    |
| `side-bar`    | barra lateral vertical da cor da marca | título dentro da barra colorida        |
| `kicker`      | rodapé com etiqueta            | "kicker" pequeno em caps acima do título       |
| `quote`       | centro                         | aspas grandes, sem body, citação centralizada  |

Cada template recebe os mesmos inputs (`heading`, `body`, `brandColor`, `index/total`, `brandHandle`) e devolve o data URL.

### 2. Variação automática por carrossel (`AutoStudio.tsx`)
- Para carrosséis: **escolher um layout diferente por slide** seguindo uma rotação determinística (ex: `[bottom, side-bar, kicker, center-card, top, quote]`), começando em um offset aleatório para não cair sempre na mesma ordem.
- Slide de capa (`index === 0`) sempre usa um template forte (`bottom` ou `side-bar`).
- Para posts soltos: continua um único layout (escolhido aleatoriamente entre os fortes).

### 3. Novo controle de UI (opcional, na seção "Direção visual")
Adicionar um seletor **"Layout do texto"**:
- **Variado** (padrão — rotaciona templates como descrito acima)
- **Sempre rodapé** / **Sempre topo** / **Sempre cartão central** / **Sempre lateral** / **Sempre citação**

Assim você controla quando quiser uniformizar (ex: campanha) e por padrão recebe variedade.

### 4. Posicionamento do fundo
Hoje todo slide tem a "metade inferior mais escura" reservada pro texto. Vou ajustar o **prompt da cena** dependendo do template escolhido (parte limpa em cima quando o texto for embaixo, e vice-versa) — assim o assunto da imagem também aparece em posições diferentes.

## Arquivos afetados
- `src/lib/slide-compose.ts` — múltiplos renderers + dispatcher por `template`
- `src/components/studio/workspace/AutoStudio.tsx` — rotação de templates, novo seletor, prompt da cena por template

Quer que eu inclua o seletor de layout na UI, ou prefere só a variação automática (sem novo controle) pra manter a tela simples?
