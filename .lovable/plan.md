## Diagnóstico

A chave Pexels está, sim, salva e válida no banco (56 caracteres, user_configs do dono Denison, atualizada em 25/06). O RPC `get_company_configs_status` da empresa ativa "teste" também responde `has_pexels: true`. Ou seja, do ponto de vista da configuração, está tudo certo.

Por isso o erro que você viu ("Pexels não configurado para esta empresa") é estranho — ele só vem da edge `stock-search` quando ela lê `user_configs.pexels_api_key` e encontra `null`. As possibilidades reais são:

1. O toast veio de uma chamada **antiga** (antes do último redeploy / antes de salvar a chave) e ficou na tela; agora deve funcionar.
2. A edge está lendo `user_configs` do **usuário logado da requisição** (não do dono da empresa). Se você estivesse logado como funcionário/convidado da empresa "teste", funcionário não tem chave própria → cai no "não configurado". Como hoje você é o dono, isso não te afeta, mas qualquer membro não-dono receberia esse erro mesmo com a empresa "configurada".
3. Algum cold start raro pegou versão antiga; pouco provável depois do redeploy de agora há pouco.

Os logs da edge nas últimas horas só mostram boot/shutdown — sem nenhuma chamada chegando ao trecho de erro. Isso reforça que o toast é remanescente.

## Plano

1. **Sem mudanças destrutivas.** Pedir pra você reproduzir uma vez: abrir o Studio na empresa "teste", clicar em **Gerar IA** ou no botão **Pexels** do AssetsRail. Se aparecer o toast de novo, eu pego o log fresco e fecho a causa.

2. **Corrigir a causa estrutural** (mesmo que o seu caso de dono já funcione): em `supabase/functions/stock-search/index.ts` (e nas irmãs `firecrawl-search`, `source-extract`, `social-analytics`, `higgsfield-proxy`, `blotato-proxy`, `postforme-proxy`) trocar `getUserConfig(auth.user.id)` por uma busca que use a **chave do dono da empresa ativa**, não a do usuário da requisição. Isso garante que funcionários da empresa também consigam usar Pexels/IA com a chave que o dono cadastrou.
   - Criar helper `getCompanyOwnerConfig(companyId)` em `supabase/functions/_shared/company-secrets.ts`:
     - valida membership ativo via `validateCompanyMembership`
     - busca `company_members` com `role='owner' AND status='active'` para achar o `user_id` do dono
     - lê `user_configs` daquele dono e devolve `pexels_api_key`, `firecrawl_api_key`, etc.
   - Substituir nas 6 edges acima. Comportamento atual para donos permanece idêntico (o "owner" é ele mesmo).

3. **Adicionar um log mínimo** no caminho "não configurado" do `stock-search` (`console.warn` com `companyId` e `userId`, sem vazar chave), pra qualquer ocorrência futura aparecer no log e a causa ficar óbvia.

4. **Redeploy** das 6 edges e te avisar pra testar.

Nada do fluxo de salvar chaves no Setup nem o front muda. Você não precisa cadastrar a chave de novo.
