## Corrigir erro ao abrir o Studio: `<Select.Item /> must have a value prop that is not an empty string`

### Causa
Em `src/components/studio/PublishPanel.tsx` (linha 250), o `SelectItem` "Nenhum" do campo **"Subir artigo junto?"** usa `value=""`, o que o Radix UI proíbe (string vazia é reservada para limpar a seleção). Isso derruba a tela inteira do Studio com o ErrorBoundary "Algo deu errado".

### Correção (1 arquivo, mudança mínima)
`src/components/studio/PublishPanel.tsx`:
1. Trocar o sentinel `""` por `"none"` no `SelectItem` "Nenhum" (linha 250).
2. No `Select` (linha 245): `value={linkedArticleId || "none"}` e `onValueChange={(v) => setLinkedArticleId(v === "none" ? "" : v)}` — mantém o restante do código (que checa `if (linkedArticleId && when === "now")`) funcionando sem alteração.

Nenhuma outra tela é afetada; o resto do app (lógica de publicação, vínculo de artigo, agendamento) permanece igual.
