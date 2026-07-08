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

**Tela 2 — tabela EDITÁVEL.** A pessoa pode corrigir tema, editar/ajustar data, **apagar** linhas e **adicionar** dias ali mesmo, antes de seguir. Objetivo: eliminar o risco de "postar o mês inteiro errado" por uma má interpretação da IA.

### 2. Configuração inicial (o que o assistente coleta)

Filosofia: **coletar SEMPRE tudo que o Autopilot precisa pra rodar 100% sozinho.** Nada de "assumir padrão silencioso" — se precisa da marca, a pessoa escolhe a marca; se precisa de contas, a pessoa escolhe as contas. Assistente linear e explícito.

Pré-requisitos coletados no assistente (ordem a refinar):
- **Marca** (`brand_profiles`) — define tom/cores/estilo da arte e da legenda. **Obrigatório.**
- **Plataformas + contas conectadas** (Post for Me) — onde publicar. **Obrigatório.**
- **Plano de conteúdo** (telas 1–2 acima).
- **Horário de publicação** — vem do Apify (🔍 a definir na fila).

**Multi-plataforma:** o **mesmo post vai igual pra todas as plataformas** selecionadas (mesma arte, mesma legenda). Sem adaptação por rede na v2.

### 3. Horário de publicação ("melhor horário")

**Realidade técnica:** o Apify **não** devolve um "melhor horário" pronto. A função `social-analytics` traz, por perfil: seguidores, engagement rate e uma lista de **~6–12 posts recentes** com `date` + engajamento (likes/comments/views). O "melhor horário" precisa ser **inferido** por nós a partir desse histórico.

**Limitações conhecidas (por isso o fallback é obrigatório):**
- Amostra pequena (6–12 posts) → sinal fraco; 1 post viral distorce.
- Conta nova = zero histórico (justamente o público-alvo da promessa de simplicidade).
- Threads, LinkedIn pessoal e Pinterest voltam sem posts recentes → sem sinal.
- Facebook/LinkedIn/YouTube/TikTok exigem URL do perfil salva pra o scrape rodar.

**Decisão — lógica em CAMADAS (sempre tem resposta):**
```
1. Histórico suficiente (≥ N posts com engajamento)?
   → calcula melhor hora/dia a partir da performance real da conta
     (agrupa recentPosts por hora-do-dia × dia-da-semana × engajamento)
2. Não tem histórico?
   → horários-padrão inteligentes por plataforma (heurística de mercado)
3. Sempre respeitando timezone e o DIA vindo do plano de conteúdo
   (o plano define o DIA; a camada de horário só preenche a HORA)
```
Conforme o Autopilot publica, o histórico cresce e a camada 1 fica mais precisa.

**Controle — automático com override opcional:** o Autopilot escolhe o horário sozinho, mas a pessoa **pode fixar** horários se quiser (sem obrigar).

🔍 A refinar depois: valor de N (mínimo de posts), tabela de horários-padrão por plataforma, janela de dias considerada no histórico.

### 4. Arte (imagem de cada post)

**Decisões:**
- **100% gerada por IA** (`openai-image` / gpt-image-2). Sem template de canvas na v2.
- **Texto DENTRO da imagem** (A2) — a IA carimba a chamada do tema na arte.
- **Consistência forte** — todo post com a mesma "cara" de marca (identidade reconhecível no feed).
- **Direção de arte automática da marca** — puxada de `brand_profiles` (paleta/estilo/tom), montada pelo sistema. Sem a pessoa precisar configurar (evoluível depois).

**Consequências técnicas (registradas):**
- Pra minimizar erro de grafia no A2: (a) enviar o texto **exato** ao modelo com ênfase na ortografia; (b) manter o texto da arte **curto** (só headline/chamada, nunca parágrafos); (c) **futuro:** verificação por OCR comparando imagem gerada × texto pretendido.
- **A2 eleva a importância da revisão antes de publicar** → ver seção Aprovação.
- Direção de arte = um "brand art directive" fixo por marca, derivado de `brand_profiles`, injetado em toda geração pra garantir consistência.

🔍 A refinar depois: formato/proporção da imagem (1024x1280 hoje), quantas variações gerar por post (1 vs escolher entre N).

### 5. Legenda

**100% definida pela IA, guiada pela marca.** Tamanho, gancho, CTA, hashtags, emojis e tom — tudo derivado do `brand_profiles`. A pessoa configura a marca uma vez; a legenda sempre sai coerente. Sem campos manuais de CTA/hashtags fixas na v2 (a IA decide por tema + marca).

### 6. Aprovação humana

**Modelo 1 — aprovação em LOTE, uma vez ("configura e esquece"):**
```
Cola plano → confirma a grade → IA gera TODOS os posts do ciclo (arte + legenda)
→ pessoa revisa tudo numa tela única → aprova → o ciclo inteiro roda sozinho
```
- **Obrigatoriedade:** opcional, **ligada por padrão**. Começa exigindo aprovação (seguro, ainda mais com texto carimbado na arte — A2); quem confia pode desligar e deixar 100% automático.
- A geração acontece **adiantada** (logo após a config), criando a janela de revisão — não "na manhã do dia". A publicação no dia é do post já aprovado.

**Jornada completa (até aqui):**
```
1. Cola o plano (período livre)
2. Confirma/edita a grade interpretada pela IA
3. Config: marca + plataformas/contas
4. IA gera o ciclo todo em background (arte A2 + legenda) — fila de jobs
5. Revisa tudo numa tela → aprova (ou edita/regenera/remove por post)
6. Autopilot agenda cada post no melhor horário (camadas) na data do plano
7. Publica dia a dia, sozinho → confirma publicação
```

### 7. Tela de revisão

**Ações por post:**
- ✅ Aprovar (e "aprovar tudo" em lote)
- ✏️ Editar a legenda
- 🔄 Regenerar a arte
- 🔄 Regenerar a legenda
- 🗑️ Remover o post
- 🕐 Ajustar horário/data (override opcional)

**Limitação registrada (a revisitar):** editar diretamente o **texto dentro da arte** NÃO entra no conjunto v2. Se o A2 errar a grafia na imagem, o recurso é **regenerar a arte** (que pode errar de novo). Mitigações do lado do prompt (texto exato + curto) reduzem, mas não zeram. Candidato a evoluir depois (editar texto-da-arte ou verificação OCR).

**Aviso de lote pronto (geração é assíncrona):** **app + e-mail.** Badge/estado no app quando a pessoa volta **e** e-mail com link direto pra tela de revisão ("seus posts estão prontos"). Infra de e-mail já existe (função `company-invite`).

## Pontos a detalhar (fila) — 🔍 a definir

1. **Fim do ciclo/recorrência** — o que acontece quando o plano acaba (pede o próximo? reusa? avisa?).
3. **Timezone & agendamento** — quando gera vs quando publica.
4. **Motor/estado** — tabelas, máquina de estados, fila de jobs (detalhar após as regras de produto).

_(Itens serão movidos para seções detalhadas conforme decididos.)_
