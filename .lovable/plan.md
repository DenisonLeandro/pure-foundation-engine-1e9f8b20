## Problema
O card "Contas Conectadas" do Dashboard mostra o número errado (geralmente 0) porque está lendo de `accounts.length` (estado legado do `AppContext`, vindo do localStorage), em vez de usar a lista real do Post for Me — que é a fonte de verdade usada pela página `/accounts` e por todo o resto do Dashboard.

## Correção (somente UI no Dashboard)

Em `src/pages/Dashboard.tsx`:

1. Trocar a origem do `connectedCount`:
   - De: `const connectedCount = accounts.length;`
   - Para: `const connectedCount = pfmAccountsQuery.data?.length ?? 0;`

2. Na grade "Redes Disponíveis" (linha ~897), trocar a checagem `isConnected`:
   - De: `accounts.some((a) => a.platform === platform)`
   - Para: usar `pfmAccountsQuery.data?.some((a) => a.platform === platform)` para refletir o mesmo estado real.

Nenhuma outra lógica, business rule, contexto ou tabela é alterada. Apenas a fonte de leitura do card e do grid passa a ser a mesma já usada na página `/accounts`.

## Resultado
Se você tem 5 contas conectadas via Post for Me, o card passa a exibir **5** e os badges "conectado" nas plataformas refletem corretamente o status real.