Plano para resolver o login no domínio publicado, sem alterar Studio, Galeria, integrações, permissões de empresa, marcas, chaves, agendamento, Autopilot ou aprovação.

1. Corrigir a configuração do cliente de autenticação
- Criar uma camada segura em `src/lib/supabase.ts` que use as variáveis do build quando existirem.
- Se o build publicado ainda vier sem variáveis, usar um fallback público e específico deste backend, evitando o domínio placeholder que causa falha de rede.
- Manter apenas chave pública/publicável no frontend; nenhum segredo privado será adicionado.

2. Aplicar a correção só nos fluxos de auth
- Manter `AuthContext` como ponto central de login, sessão, logout, reset e troca de senha.
- Trocar imports diretos do cliente gerado apenas em páginas de autenticação/configuração de login quando necessário, como `Login` e `Signup`, para usarem o cliente seguro.
- Não alterar regras de empresa, `company_configs`, integrações operacionais ou páginas fora do fluxo de autenticação.

3. Ajustar redirecionamento pós-login
- Após login, mandar o usuário para `/dashboard` e deixar as guards existentes decidirem se precisa ir para `/criar-empresa`.
- Confirmar que reload mantém sessão e logout retorna para `/login`.

4. Validar links de email
- Conferir reset e convite usando `window.location.origin`, para o domínio publicado ser usado automaticamente.
- Se necessário, ajustar somente URLs de auth para usar o domínio atual da aplicação.

5. Verificação final
- Testar no preview com sessão limpa.
- Testar no domínio publicado, verificando console e requisições de login.
- Confirmar que não há loop de rota, que sessão persiste no reload e que logout limpa a sessão.

Detalhes técnicos
- Não vou editar o cliente gerado automaticamente do backend.
- Não vou mexer em `company_configs`, Edge Functions de integrações, Studio, Galeria, marcas, agendamento ou Autopilot.
- A correção será limitada ao client de auth/configuração pública e aos imports necessários para login/signup funcionarem no build publicado.