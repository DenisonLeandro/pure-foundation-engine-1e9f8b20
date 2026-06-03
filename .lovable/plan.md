## Diagnóstico

O dev server e a build estão saudáveis (Vite OK, 200 em `/`, sem runtime errors, repo na HEAD `2fe86ce`). O preview renderiza normalmente — abri `/schedule` no browser e a tela carrega completa: sidebar, calendário de Maio/2026, painel "Próximos Posts".

A única falha visível é o banner vermelho na Agenda:

> Erro ao carregar agenda: **Invalid or expired token**

Esse erro vem de duas chamadas `POST /functions/v1/postforme-proxy` retornando **401**. Ou seja, o problema não é frontend nem build — é a **API key do Post for Me** salva nas suas configurações que foi revogada/expirou. O mesmo erro vai aparecer em qualquer aba que dependa de PFM (publicar no Studio, listar contas, etc.).

## O que fazer

Duas frentes, escolha o escopo:

### A) Resolver a causa raiz (sem código) — recomendado primeiro
1. Pegar uma chave nova em `app.postforme.dev/settings`.
2. Em `/setup?reset=1` (ou no card de chaves em Administração / "Gerenciar chaves") substituir a chave antiga.
3. Recarregar `/schedule` — banner some, as próximas chamadas voltam 200.

Isso já desbloqueia tudo. Não precisa mexer em código.

### B) Hardening de UX no frontend (mudança de código, opcional)
Se quiser que esse tipo de falha pare de "parecer preview quebrado":

1. **`src/pages/Schedule.tsx`** — quando o erro do PFM for 401/`Invalid or expired token`, trocar o banner cru por um estado vazio acionável: ícone + texto "Sua chave do Post for Me expirou" + botão "Reconectar" que leva pra tela de gestão de chaves. Não vazar string da API.
2. **`src/hooks/use-blotato.ts`** (hook que consome PFM) — centralizar detecção de 401 do PFM num helper `isPfmAuthError(e)` e expor flag `authExpired` no retorno dos hooks `usePfmAccounts` / agenda. Evita duplicar parsing de string em cada tela.
3. **`src/components/studio/PublishPanel.tsx`** — quando `authExpired` for true em `usePfmAccounts`, no lugar do "Nenhuma conta conectada" mostrar CTA "Reconectar Post for Me" apontando pra gestão de chaves (hoje aponta pra `/accounts`, que também vai falhar).
4. **`src/pages/Accounts.tsx`** (se existir o mesmo padrão) — mesmo tratamento.

Sem migrations, sem mudança de edge function — só camada de apresentação reagindo ao 401 já existente.

## Sugestão

Faz mais sentido começar por **A** (trocar a chave) pra confirmar que o sistema volta ao normal. Se quiser, na sequência eu aplico **B** num próximo turno pra evitar que isso volte a parecer "preview quebrado" da próxima vez que a chave expirar.

Me confirma qual caminho seguir.