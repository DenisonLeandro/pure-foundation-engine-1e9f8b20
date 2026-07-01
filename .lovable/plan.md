## Remover o botão "Ocultar/Mostrar logo" do Studio

O botão do canto superior do Studio permite ocultar a logo manualmente, o que conflita com a regra de "sempre aplicar a logo da marca nos posts". Vou removê-lo mantendo a aplicação automática da logo intacta.

### Mudanças em `src/components/studio/workspace/StudioWorkspace.tsx`
1. Remover o bloco JSX do botão (linhas 395–406) que renderiza "Ocultar logo / Mostrar logo".
2. Remover o handler `toggleBrandLogo` e a variável `logoVisible` (linhas 181–195) — deixam de ser usados.
3. Remover `removeBrandLogo` do import de `./brandLogo` (fica só `applyBrandLogo` e `docHasBrandLogo`, este último ainda é usado no auto-apply).
4. Remover imports não usados após a limpeza (`Eye`, `EyeOff` do lucide-react, se não forem usados em outro lugar do arquivo).

### O que NÃO muda
- `applyBrandLogo` continua rodando automaticamente em criações novas quando a marca tem `logo_url` (o `useEffect` das linhas 170–179 permanece).
- Posts antigos (com `editingCreationId`) continuam sem ser tocados automaticamente — comportamento preservado.
- `brandLogo.ts` fica intocado (a função `removeBrandLogo` continua exportada caso seja usada em outro lugar futuro; não vamos apagar).
- Nenhuma mudança em edge functions, banco ou fluxo de salvamento.

Resultado: a logo passa a vir sempre nos novos posts sem o botão manual que causava conflito.