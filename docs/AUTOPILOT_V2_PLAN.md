# Autopilot v2 — Plano de Reescrita (documento vivo)

> Status: **spec revisada — aguardando aprovação final pra implementar.** Nada implementado ainda.
> Este documento é a especificação que guiará a implementação. Produto, arquitetura técnica e UI fechados e revisados.

## Decisões travadas

- **Reescrita do zero**, schema novo, **descartando dados legados** (usuários reconfiguram).
- **Motor = fila de jobs** (`autopilot_jobs`): worker com claim atômico, retry/backoff, 1 job por unidade de trabalho. Cron vira apenas um *tick* que aciona o worker.
- **RLS por empresa** (via `company_members`), alinhado ao resto do app (hoje o legado é por `user_id`).
- **Critério nº 1 de todo o design: SIMPLICIDADE.** Um usuário que nunca usou o app precisa conseguir usar. O Autopilot é o coração/diferencial do produto.

## Visão-base (o "uau")

A pessoa **cola um plano de conteúdo** (de qualquer período — data · tema, categoria opcional) e o Autopilot faz **todo o resto sozinho**:

```
CONFIGURA (uma vez)
  Cola o plano (período livre) → IA estrutura → confirma a grade editável
  → escolhe marca e contas

GERA E APROVA (uma vez, logo após configurar)
  IA gera TODOS os posts do ciclo em background (arte estilo Studio + legenda)
  → pessoa revisa em lote e aprova

RODA SOZINHO (o resto do ciclo)
  Agenda tudo no Post for Me (melhor horário) → PFM publica dia a dia
  → confirma publicação → 7 dias antes do fim, avisa pra colar o próximo
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
| Arte do tema | pipeline do Studio "A IA cria tudo" (`openai-image` + composição de logo) | **port p/ backend** (logo no servidor) |
| Legenda | `generate-content` | já usado |
| Agendar/publicar | `postforme-proxy` (Post for Me) | já usado |
| Melhor horário | `social-analytics` (Apify) | **lógica nova** |
| Executar o ciclo (gerar → agendar → confirmar) | cron + fila de jobs | novo (motor) |

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
- **Fuso horário** — auto-detectado do navegador e confirmado (ver seção 9).
- **Horário de publicação** — automático (melhor horário, ver seção 3), com override opcional.

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

**Parâmetros (definidos):**
- **N = 5** — mínimo de posts recentes com engajamento pra confiar no histórico; abaixo disso, usa o fallback.
- **Tabela de horários-padrão (fallback, Brasil, dias úteis):**

| Plataforma | Horários-padrão |
|---|---|
| Instagram | 12h, 19h |
| Facebook | 13h, 20h |
| LinkedIn | 8h, 12h |
| TikTok | 12h, 21h |
| Twitter/X | 9h, 18h |
| YouTube | 17h, 20h |

- Fim de semana pode deslocar pra mais tarde de manhã; ajustável conforme o histórico real que o próprio Autopilot coletar.
🔍 A refinar depois: janela de dias considerada no histórico; refinamento fim de semana × dia útil.

### 4. Arte (imagem de cada post) — REUSO FIEL do Studio "A IA cria tudo"

**Decisão-chave (confirmada pelo usuário):** o Autopilot deve gerar a arte **exatamente como o Studio → "A IA cria tudo"** (`AiArtStudio.tsx`). As artes de lá já saem no nível desejado (marca, logo, tudo). O Autopilot **precisa reusar esse mesmo pipeline**, não uma versão simplificada.

**Pipeline exato do "A IA cria tudo" (a replicar):**
```
1. buildArtPrompt(texto, brand): texto + PALETA de cores da marca
   + dica "canto superior esquerdo livre p/ a logo"
   + "arte final completa, texto embutido (A2), pt-BR, tipografia legível, profissional"
2. generateOpenAiImage: gpt-image-2, size 1024x1280 (4:5), quality HIGH, n=1  → arte "limpa"
3. generateContent (legenda): tom da marca via brandTextProfile, pt-BR
4. ⭐ composeImageWithLogo: carimba a LOGO REAL por cima via canvas
   (arte 1:1 + logo nítida no canto sup. esq., ~11% da largura, margem ~4%).
   A IA NUNCA desenha a logo — ela é sobreposta nítida.
5. Persistir com logoBaked:true, canvas.source:"finalImage"
```
O que faz a qualidade: **prompt certo + logo real carimbada** (passo 4). Pular o passo 4 (como o Autopilot atual faz, chamando `openai-image` direto) é o que deixa a arte pior.

**⚠️ Consequência técnica principal — composição da logo migra p/ o backend:**
- No Studio, o passo 4 (`composeImageWithLogo`) roda **no navegador** (canvas 2D: `document.createElement("canvas")`, `Image`, `drawImage`).
- No Autopilot a geração é **em lote no backend** (worker Deno) → **não há navegador/canvas**.
- **Solução:** replicar a composição no servidor com uma lib de imagem do Deno (ex.: ImageScript / deno-canvas / skia), espelhando a geometria exata do `composeImageWithLogo` (posição/tamanho da logo, arte 1:1 sem reescala). **É o principal pedaço novo de engenharia** pra igualar a qualidade do Studio.

**Insumos:** paleta e `logo_url` vêm de `brand_profiles` (já temos `brand_id` no plano).

**Consequências do A2 (texto na imagem):**
- Reduzir erro de grafia: texto **exato** + **curto** no prompt; **futuro:** verificação OCR.
- Eleva a importância da revisão → seção Aprovação.

**Expansão do tema em briefing (CONFIRMADO):** no Studio a pessoa escreve uma descrição rica; no Autopilot a entrada é um **tema curto**. Então um **passo de IA expande** `tema (+categoria) → briefing de arte + headline` antes do `buildArtPrompt`, recriando a riqueza que a pessoa daria no Studio (evita arte "rasa"). O briefing gerado é **guardado no post** (`art_brief`) pra permitir regenerar sem re-expandir.

🔍 A refinar depois:
- Reuso possível do `editOpenAiImage` (edição conversacional do Studio) pra o "regenerar arte" da tela de revisão aceitar instruções ("deixe o fundo mais escuro").
- Formato/proporção (1024x1280) e nº de variações por post.

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

### 8. Fim do ciclo

- Cada plano é um **período fechado** (as datas coladas). Roda do primeiro ao último dia e termina.
- **Recorrência semanal/quinzenal/mensal do v1 é ELIMINADA** (simplificação grande). Não há "ciclos automáticos"; há planos finitos que a pessoa alimenta.
- **7 dias antes** do fim, o Autopilot **avisa (app + e-mail)**: "seu plano está acabando, cole o próximo pra não parar de postar."
- Sem geração automática de próximo plano na v2 (a pessoa cola o próximo). "IA sugere o próximo" fica como possível evolução futura.

### 9. Timezone & agendamento

**Modelo de publicação — delegado ao Post for Me:**
```
Após a APROVAÇÃO do lote:
  → o Autopilot agenda TODOS os posts no Post for Me de uma vez,
    cada um com data (do plano) + hora (melhor horário calculado)
  → o PFM publica cada post no momento certo, sozinho
  → o Autopilot confere depois que publicou de verdade (confirm)
```
- **Vantagem:** não depende de o cron disparar na hora exata. O worker só precisa (a) gerar após config e (b) agendar tudo após aprovação. Muito mais robusto que "acordar de manhã".

**Timezone:** padrão **IANA** (ex.: `America/Sao_Paulo`), **auto-detectado do navegador** no setup e confirmado pela pessoa. Cálculo correto (sem o mapa fixo de offsets do v1). O plano dá o **dia**; o melhor horário dá a **hora**; o fuso converte pra o instante UTC enviado ao PFM.

## Regras de produto: COMPLETAS ✅
Todas as decisões de produto estão fechadas.

---

# Arquitetura técnica (revisada)

## Tabelas novas (escopo por empresa, RLS via `company_members`)

### `autopilot_plans`
Um plano = um período colado. Funde "config" + "calendar" do v1 (cada plano é um ciclo finito).
```
id uuid pk
company_id uuid            -- escopo/RLS
brand_id uuid             -- marca (direção de arte + tom da legenda)
created_by uuid           -- quem criou
name text                 -- ex.: "Julho 2026"
platforms text[]
social_account_ids text[]
timezone text             -- IANA (ex.: America/Sao_Paulo)
requires_approval bool default true
status text               -- draft|generating|review|approved|active|completed|failed|paused|canceled
period_start date
period_end date
raw_plan_text text        -- texto original colado (referência)
created_at, updated_at timestamptz
```

### `autopilot_posts`
Um post por dia do plano.
```
id uuid pk
plan_id uuid
company_id uuid
post_date date            -- do plano
theme text                -- obrigatório
category text             -- opcional
caption text              -- legenda (IA)
hashtags text[]
art_brief text            -- briefing rico expandido do tema (pra regenerar sem re-expandir)
image_url text            -- arte gerada (A2, com logo carimbada)
image_prompt text         -- prompt final usado (buildArtPrompt)
scheduled_at timestamptz  -- post_date + melhor hora, em UTC
time_locked bool          -- override manual de horário
status text               -- draft|generating|ready|approved|scheduled|published|failed|removed
pfm_post_id text
published_url text
engagement jsonb
error text
created_at, updated_at timestamptz
```

### `autopilot_jobs` (o motor — fila)
```
id uuid pk
company_id uuid
plan_id uuid
post_id uuid null
kind text                 -- gen_image|gen_caption|schedule_post|confirm_post
status text               -- queued|running|done|failed
attempts int default 0
max_attempts int default 4
next_attempt_at timestamptz
last_error text
payload jsonb
locked_at timestamptz
created_at, updated_at timestamptz
```

## Máquina de estados

**Post (fonte da verdade):**
```
draft → generating → ready → approved → scheduled → published
                       ↘ (falha) → failed
                       ↘ (removido na revisão) → removed
```
**Plano (derivado dos posts):** draft → generating → review → approved → active → completed. Ramos laterais: `paused` (retomável), `canceled` (encerrado), `failed`.

**Falha não bloqueia o ciclo:** um post `failed` não trava os demais (jobs são por post). Ele aparece na UI com o erro e um botão "tentar de novo"; o resto do plano segue publicando.

## Motor (fila de jobs)
- **Worker** `autopilot-worker`: claim atômico (`FOR UPDATE SKIP LOCKED`), processa 1 job por vez.
  - Sucesso → job=done + avança estado do post.
  - Falha → attempts++, se < max: requeue com backoff (`next_attempt_at = now + backoff`); senão job=failed + post=failed + erro visível na UI.
- **Tick** `autopilot-tick` (substitui `autopilot-cron`): a cada passagem —
  1. enfileira `confirm_post` de posts agendados cuja hora passou;
  2. marca `plan=completed` quando todos os posts terminaram (`published`/`failed`/`removed`) ou `period_end` passou;
  3. dispara o aviso **"plano acabando (7 dias)"** (uma vez por plano);
  4. invoca o worker.
  Sem regra de negócio pesada no cron — só detecção de transições + disparo.
- **Tipos de job:** `gen_image`, `gen_caption`, `schedule_post`, `confirm_post`. (Parse do plano é **síncrono** na UI. Regenerar arte/legenda na revisão reusa `gen_image`/`gen_caption` para um único post.)

## Orquestração
```
1. Config + grade confirmada → cria plan + posts(draft)
   → enfileira gen_image + gen_caption por post → plan=generating
2. Worker gera → posts=ready → todos prontos → plan=review → avisa (app + e-mail)
   (requires_approval=false → auto-aprova)
3. Humano aprova (lote) → posts=approved → enfileira schedule_post → plan=approved
4. Worker agenda no PFM (data + hora) → posts=scheduled → plan=active
5. Tick enfileira confirm_post após a hora → worker confirma → posts=published
6. Tudo publicado / passou period_end → plan=completed
   7 dias antes de period_end → avisa "cole o próximo"
```

## Reuso e funções novas
- **Reusa:** `openai-image` (gpt-image-2), `generate-content` (legenda), `postforme-proxy` (agendar/confirmar), `social-analytics` (melhor horário), padrão de e-mail do `company-invite` (avisos).
- **Novas:** `autopilot-parse` (cola→grade), `autopilot-worker` (motor), `autopilot-tick` (substitui `autopilot-cron`).

### Job `gen_image` — replica o Studio "A IA cria tudo" no backend
Passos dentro do worker (Deno), espelhando `AiArtStudio.tsx`:
1. `tema (+categoria) → briefing de arte + headline` via IA (CONFIRMADO) → guarda em `posts.art_brief`.
2. `buildArtPrompt(brief, brand)` — **portar `buildArtPrompt` p/ `_shared`** (hoje vive no componente React).
3. Chamar `openai-image` (1024x1280, quality high) → arte limpa.
4. **Compor logo no servidor** (lib de imagem Deno) — **portar a geometria de `composeImageWithLogo`**. Este é o item de engenharia central pra igualar a qualidade do Studio.
5. Upload ao storage `media` → `posts.image_url`; guardar `image_prompt` p/ regeneração.
- **Refatoração de suporte:** extrair `buildArtPrompt` e a geometria de composição da logo para um módulo compartilhável (hoje acoplados ao React), consumível tanto pelo Studio quanto pelo worker — fonte única, sem divergência.

## UI / Telas
Princípio: **simplicidade radical** (usável por quem nunca abriu o app).

**1. Entrada (vazio):** hero "Configure seu Autopilot" + 1 botão.

**2. Assistente de novo plano:**
```
① Colar o plano      — textarea grande
② Confirmar a grade  — tabela EDITÁVEL (corrige/remove/adiciona linhas)
③ Marca + contas     — escolhe marca e plataformas/contas
④ Revisar + gerar    — "isso vai gerar N posts" → confirma (transparência de custo)
⑤ Gerando…           — progresso X/N; pode sair e voltar (é assíncrono)
```

**3. Tela de revisão (lote):** **grade de cards** (com **toggle pra calendário**). Cada card = arte + legenda + data/hora + status + ações (aprovar / editar legenda / regenerar arte / regenerar legenda / remover / ajustar horário) + **"Aprovar tudo"**.

**4. Dashboard do plano (rodando):** estado do plano + barra de progresso (gerados → aprovados → agendados → publicados) + **calendário do mês** + lista/histórico de planos + botão "novo plano".

**Mockup visual (Artifact):** https://claude.ai/code/artifact/4147d89c-2cd2-4d50-99ba-05d2a8982c89 — telas: entrada, assistente (colar→grade→marca→gerar), gerando, revisão em cards, dashboard. Identidade herdada do app (violeta/fúcsia, dark mode). Aguardando validação/ajustes do usuário.

## Permissões (por empresa)
- **Criar/editar/gerar planos:** owner, admin e editor.
- **Aprovar (gatilho de publicação):** **os três papéis** (owner, admin, editor). Mais ágil; sem separação hierárquica de aprovação na v2.
- **Pausar/cancelar plano:** owner, admin, editor.
- RLS das 3 tabelas: escopo por `company_members` (qualquer membro ativo da empresa opera dentro do escopo dela).

## Pausar & cancelar plano
- **Pausar** (`active → paused`): interrompe futuras publicações. Os posts ainda `scheduled` no Post for Me são **desagendados** via **`pfm_delete_post`** (tool já existente no `postforme-proxy`) e voltam a `approved`. **Retomável** (`paused → active`): reenfileira `schedule_post` dos pendentes (reagenda no PFM). Posts já `published` ficam como estão.
- **Cancelar** (`* → canceled`): encerra o plano de vez, desagenda (`pfm_delete_post`) o que faltava, **não retomável**. Histórico do que já publicou é preservado.
- Dependência confirmada: `postforme-proxy` expõe `pfm_delete_post` e `pfm_update_post` — desagendar/editar agendamento é suportado.

## Custos
- Gerar um ciclo = ~N imagens (gpt-image-2 *high*) + N legendas + N expansões de briefing, na chave da própria empresa (custo real dela).
- **Confirmação com a quantidade** antes de disparar a geração em lote: "isso vai gerar N posts" → pessoa confirma. **Sem trava rígida**; só transparência.
- 🔍 Futuro: estimativa de custo (exige tabela de preços).

## Notificações por e-mail
- **Só 2 marcos, agrupados por plano** (nunca por post):
  1. **"Lote pronto pra revisar"** — quando todos os posts do plano ficam `ready`.
  2. **"Plano acabando (7 dias)"** — antes de `period_end`.
- Reusa o padrão de envio do `company-invite`. Sem e-mails no meio do ciclo.

## Motor — parâmetros definidos (decisão técnica)
- **Backoff:** `next_attempt_at = now + min(60s * 2^attempts, 15min)`; **max_attempts = 4**. Esgotou → `failed` visível na UI (post mostra o erro e botão de "tentar de novo").
- **Cadência do tick:** a cada **1 min** (pg_cron). Além disso, o worker é **invocado imediatamente** nos eventos de enfileiramento (plano criado, plano aprovado) — o tick é rede de segurança + `confirm_post`.
- **`compute_best_times`:** inline no `schedule_post` (calcula por conta/plataforma no momento de agendar). Não vira job próprio.
- **Limpeza:** jobs `done` com mais de **7 dias** são podados; `failed` são mantidos pra auditoria.
- **Idempotência:** `schedule_post` só agenda se `pfm_post_id` for nulo (evita duplicar no PFM em retries).
