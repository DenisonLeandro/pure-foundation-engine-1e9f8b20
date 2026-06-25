## Plano

Corrigir o modal **Conectar Redes Sociais** para que ele mostre como conectadas apenas as contas vinculadas à empresa ativa.

### O que vou ajustar

1. **Separar “contas existentes no Post for Me” de “contas vinculadas à empresa”**
   - Hoje o modal chama a lista geral de contas e por isso a empresa Teste enxerga contas do Denison.
   - Vou carregar também `company_social_accounts` da empresa ativa e usar isso para decidir o estado visual do botão.

2. **Na empresa Teste, mostrar “Conectar” para redes ainda não vinculadas**
   - Se uma conta existe no Post for Me, mas não está ligada à empresa Teste, ela não deve aparecer como conectada/reconectar.
   - Ela só deve aparecer como conectada depois de ser vinculada à empresa Teste.

3. **Ao conectar/reconectar, vincular a conta detectada à empresa atual**
   - Depois do OAuth, o sistema continuará detectando a nova conta.
   - Se a conta já existir no Post for Me, mas ainda não estiver vinculada à empresa atual, ela será registrada em `company_social_accounts` para essa empresa.

4. **Não apagar nem migrar nada automaticamente**
   - As contas já vinculadas ao Denison continuam lá.
   - A empresa Teste fica limpa até você conectar contas nela.
   - Nenhum post agendado/publicado será alterado.

### Arquivos previstos

- `src/components/ConnectAccountDialog.tsx`
- Possivelmente `src/lib/api/company-accounts.ts` para tornar o vínculo idempotente, evitando erro se tentar vincular a mesma conta duas vezes.

### Resultado esperado

- Abrindo o modal na empresa **Denison**, aparecem as contas do Denison conectadas.
- Abrindo na empresa **Teste**, essas contas não aparecem como conectadas; os botões ficam em **Conectar**.
- Ao conectar uma rede na empresa Teste, ela passa a pertencer somente à empresa Teste dentro do app.