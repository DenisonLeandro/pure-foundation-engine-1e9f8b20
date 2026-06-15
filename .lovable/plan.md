Diagnóstico encontrado:

- O domínio publicado em uso é `https://pure-foundation-engine.lovable.app`.
- O site publicado ainda está servindo um bundle antigo: `/assets/index-DS6PpvZD.js`.
- Esse bundle publicado não contém o fallback público que foi adicionado no código atual.
- Dentro do bundle publicado, o cliente de autenticação ainda está assim:
  - URL: `https://placeholder.supabase.co`
  - chave: `placeholder-key`
  - `supabaseConfigured = false` porque `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` não chegaram no build publicado.
- Resultado: no publicado, o app acha que o backend não está configurado e o login não autentica corretamente.
- O backend está saudável; não encontrei sinal de indisponibilidade no backend.
- Os logs recentes de auth mostram chamadas `/user` com status 200, mas não mostram tentativa válida de login por senha vinda do domínio publicado no período consultado, o que combina com o frontend usando placeholder/cliente inválido antes de autenticar.
- Há também indício de publicação desatualizada pelo HTML: o `<title>` publicado ainda aparece como `Lovable App`, ou seja, nem a correção anterior de metadata nem a correção do cliente chegaram ao site publicado.

Plano para corrigir somente o login publicado:

1. Garantir que o código atual de autenticação esteja consistente
   - Manter o cliente de auth usando URL/chave pública reais quando as variáveis do build não forem injetadas.
   - Não mexer em Studio, Galeria, `company_configs`, integrações, permissões de empresa, marcas, chaves, agendamento, Autopilot ou aprovação.

2. Corrigir a detecção de backend configurado
   - Remover a dependência de `import.meta.env` para decidir se auth está habilitado.
   - Como o cliente passa a ter fallback público válido, `supabaseConfigured` deve permanecer verdadeiro, exceto no bypass de testes.

3. Ajustar o redirecionamento pós-login
   - O login não deve forçar `/setup` sempre.
   - Após autenticar, enviar para `/dashboard`; as guards existentes redirecionam para `/criar-empresa` quando o usuário não tiver empresa.

4. Verificar links de reset/convite no domínio publicado
   - Confirmar que reset usa `window.location.origin`.
   - Confirmar convite não está fixando domínio de preview.

5. Publicar novamente a versão corrigida
   - A causa principal agora é que o publicado está desatualizado.
   - Depois da publicação, verificar se o novo bundle contém `pgimbjfdxwefahxmpdpc` e `sb_publishable_...`, e não contém `placeholder.supabase.co` como cliente ativo.

6. Validar no domínio publicado
   - Abrir `https://pure-foundation-engine.lovable.app/login` em sessão limpa.
   - Verificar console: sem erro de placeholder e sem erro de rede de auth.
   - Tentar login com credenciais reais fornecidas/testáveis.
   - Confirmar destino final: `/dashboard` ou `/criar-empresa` conforme o usuário.
   - Recarregar a página e confirmar que a sessão persiste.
   - Fazer logout e confirmar retorno para `/login`.

Arquivos previstos para alteração:

- `src/pages/Login.tsx`: ajustar o destino pós-login de `/setup` para `/dashboard`.
- Se necessário, revisar apenas `src/lib/supabase.ts` e `src/integrations/supabase/client.ts` para garantir que a versão atual realmente contém o fallback válido e a flag correta.

Nada será alterado nas áreas proibidas.