## Objetivo
Eliminar a tela branca no preview sem ampliar escopo: manter as novas Configurações, mas impedir que erros 401/404 da integração social derrubem a renderização.

## O que vou corrigir
1. Blindar a camada de API da integração social
- Ajustar o cliente de `postforme` para normalizar respostas de erro do edge function.
- Diferenciar erros esperados de configuração/autorização (401/404) de falhas inesperadas.
- Retornar mensagens seguras para a UI, sem lançar estados que quebrem o carregamento.

2. Blindar as views novas de Configurações
- Revisar `ManageAccountsView` e `ConnectAccountDialog` para tratar ausência de credenciais/provider sem propagar exceções para a árvore React.
- Garantir estado vazio/falha amigável em vez de renderização interrompida.
- Revisar `ManagePreferencesView` e `SettingsShell` para evitar regressões de renderização no modo `/setup?manage=1`.

3. Conter melhor os erros no edge function
- Ajustar `postforme-proxy` para encapsular erros conhecidos do serviço externo em JSON previsível.
- Para erros de integração não fatais ao app, devolver payload consistente que a UI consiga interpretar sem cair em tela branca.
- Preservar status e mensagem quando a ação exigir correção do usuário, mas sem deixar o frontend sem contexto.

4. Validar no preview
- Verificar que `/setup` e `/setup?manage=1` continuam abrindo.
- Confirmar que a aba de contas mostra erro amigável ou estado vazio quando o provider externo não está configurado.
- Confirmar que o preview deixa de cair para tela branca.

## Arquivos-alvo
- `src/lib/api/postforme.ts`
- `src/components/ConnectAccountDialog.tsx`
- `src/components/setup/ManageAccountsView.tsx`
- `src/components/setup/SettingsShell.tsx` (se necessário, só para proteção de render)
- `supabase/functions/postforme-proxy/index.ts`

## Detalhes técnicos
- Manterei a UX atual das abas e mensagens em pt-BR.
- Não vou alterar schema, auth, buckets nem outras features.
- A correção será focada em contenção de erro + fallback visual seguro.

## Resultado esperado
- O preview não fica mais branco.
- Erros como “Unauthorized” e “Social provider app credentials not found” aparecem apenas como aviso tratável na interface.