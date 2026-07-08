# Autopilot v2 — Plano de Reescrita (documento vivo)

> Status: **em detalhamento colaborativo**. Nada implementado ainda.
> Este documento é a especificação que guiará a implementação. Atualizado a cada rodada da conversa.

## Decisões travadas

- **Reescrita do zero**, schema novo, **descartando dados legados** (usuários reconfiguram).
- **Motor = fila de jobs** (`autopilot_jobs`): worker com claim atômico, retry/backoff, 1 job por unidade de trabalho. Cron vira apenas um *tick* que aciona o worker.
- **RLS por empresa** (via `company_members`), alinhado ao resto do app (hoje o legado é por `user_id`).
- **Critério nº 1 de todo o design: SIMPLICIDADE.** Um usuário que nunca usou o app precisa conseguir usar. O Autopilot é o coração/diferencial do produto.

## Visão-base (o "uau")

A pessoa **cola um plano de conteúdo do mês** (uma tabela com data · categoria · tema) e o Autopilot faz **todo o resto sozinho**:

```
CONFIG (uma vez)
  Usuário cola o plano do mês → IA lê e salva 1 post por dia pro mês inteiro

TODO DIA (automático, de manhã)
  Pega o tema do dia → gera arte + legenda → agenda no melhor horário (Apify)
  → publica → repete dia após dia
```

### Exemplo de entrada (real, fornecido pelo usuário)
Tabela mensal tipo:
`Data | Dia da Semana | Categoria | Tema`
Ex.: `02/07/2026 | Quinta | Acidente de Trabalho | Hérnia de Disco Pode Ser Considerada Acidente de Trabalho?`
(1 post por dia, 31 dias, múltiplas categorias temáticas.)

## Mapeamento de viabilidade (peças que já existem)

| Etapa | Recurso existente | Novo? |
|---|---|---|
| Parser do plano colado | IA texto (Lovable Gateway / `generate-content`) | **novo** (parser) |
| Arte do tema | `openai-image` (gpt-image-2, marca-raiz) | já usado |
| Legenda | `generate-content` | já usado |
| Agendar/publicar | `postforme-proxy` (Post for Me) | já usado |
| Melhor horário | `social-analytics` (Apify) | **lógica nova** |
| Rodar todo dia | cron + fila de jobs | novo (motor) |

## Detalhado ✅

### 1. Entrada do plano (fluxo de onboarding do plano)

Fluxo em telas (assistente):

- **Tela 1 — Colar o plano.** Um campo único onde a pessoa cola o plano em **qualquer formato** (tabela, lista, texto corrido). Período **livre e arbitrário**: 1 semana, 20 dias, 1 mês, 2 meses… sem limite fixo. A IA se vira pra estruturar.
- **Tela 2 — Confirmar a grade.** O app mostra como **interpretou**, em forma de tabela, pra pessoa verificar se está certo antes de seguir. (Editabilidade da tabela: 🔍 a definir — ver abaixo.)
- **Tela 3+ —** segue pro restante da configuração.

**Campos por linha:**
- **Obrigatórios:** `data` + `tema`. Suficiente pra IA (a) saber o dia do post e (b) criar arte + legenda.
- **Opcionais:** `categoria` (e o que mais a IA detectar) — usado como contexto extra, não bloqueia.

**Parser:** IA lê texto livre e devolve linhas estruturadas `{ data, tema, categoria? }`. Robusto a formatos bagunçados (copiado de ChatGPT/Excel/Word).

## Pontos a detalhar (fila) — 🔍 a definir

1. **Melhor horário via Apify** — como determinar (dados disponíveis por conta? fallback de horários padrão?).
3. **Arte** — estilo/consistência de marca, single vs carrossel, quanto a IA decide.
4. **Legenda** — tom, CTA, hashtags, adaptação por plataforma.
5. **Aprovação** — 100% automático vs revisão/preview (especialmente no 1º mês).
6. **Fim do mês/recorrência** — o que acontece quando o plano acaba (pede o próximo? reusa? avisa?).
7. **Multi-plataforma** — mesma arte/legenda em todas ou adaptada por rede.
8. **Edição/preview** — calendário editável antes de publicar, mesmo no modo automático.
9. **Timezone & horário do "de manhã"** — quando gera vs quando publica.

_(Itens serão movidos para seções detalhadas conforme decididos.)_
