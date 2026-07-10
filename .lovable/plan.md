# Autopilot não está agendando posts aprovados

## Diagnóstico

Consulta em `autopilot_jobs` mostra os 7 posts do plano `530559ef…` (incluindo o de 09/07) com job `schedule_post` em `status=queued`, `attempts=1`, todos com o mesmo `last_error`:

```
postforme pfm_create_post 401: {"message":"Conflicting API keys",
"hint":"The `apikey` and `Authorization` headers provide conflicting API keys.
Send the intended sb_ key only in the `apikey` header."}
```

Ou seja: ao aprovar, o motor enfileira `schedule_post` corretamente, mas a chamada interna do worker para a `postforme-proxy` é rejeitada pelo gateway do Supabase antes de chegar ao Post for Me. Nenhum post foi realmente agendado — o de ontem não saiu por causa disso.

## Causa raiz

Em `supabase/functions/_shared/autopilot-schedule.ts`, `internalHeaders()` envia dois formatos de chave ao mesmo tempo:

```ts
{ "Content-Type": "application/json",
  apikey: ANON,                        // JWT legado
  Authorization: `Bearer ${SERVICE_KEY}` }  // sb_secret_… novo
```

Após a migração para signing keys, o gateway bloqueia essa mistura. A memória do projeto já registra a regra: usar a publishable key nova em vez da anon para evitar exatamente esse erro.

## O que fazer

### 1. Corrigir os headers da chamada interna (arquivo único)

`supabase/functions/_shared/autopilot-schedule.ts` — em `internalHeaders()`, enviar apenas um header. Para chamada interna service-to-service basta o `Authorization` com a service role; o `apikey` conflitante sai.

```ts
function internalHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SERVICE_KEY}`,
  };
}
```

(Se o gateway ainda exigir `apikey`, usar `SUPABASE_PUBLISHABLE_KEY` — nunca o ANON JWT junto com a service key.)

### 2. Destravar os 7 jobs já falhados

Após o deploy, resetar `next_attempt_at = now()` e zerar `last_error` dos 7 `schedule_post` do plano `530559ef-1297-4062-9fb4-52bcdf69e91a` para o próximo tick reprocessar imediatamente, em vez de esperar o backoff de 2min. Isso vai fazer o worker reagendar tudo no Post for Me.

O post de 09/07 (`17b97f77…`, `scheduled_at=2026-07-10 13:00 UTC`) já está com hora passada — depois de agendado no PFM, o `confirmDuePosts` do tick vai empurrar como published/failed conforme o retorno do PFM.

### 3. Verificar

- Rodar `autopilot-tick` manualmente ou aguardar 1min.
- Conferir em `autopilot_jobs` que os 7 jobs saíram de `queued` → `done` e em `autopilot_posts` que ganharam `pfm_post_id` e `status=scheduled`/`published`.

## Fora de escopo

- Não mexer em `postforme-proxy` (recebe corretamente).
- Não alterar backoff nem UI de retry (assunto separado).
- Sem mudanças no frontend.
