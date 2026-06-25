## Problema

Na empresa **Teste**, ao clicar em **Conectar** no Instagram (ou outra rede), o popup do OAuth nem chega a ser realmente usado: o app vincula automaticamente a conta `@denisonleandro.adv` que já existia no Post for Me (vinda da empresa Denison). O usuário quer que o **popup de login do Instagram apareça normalmente** para autenticar uma conta **diferente**.

## Causa

Em `src/components/ConnectAccountDialog.tsx`, dentro de `startPolling`, há um fallback que vincula qualquer conta PFM existente assim que o popup fecha:

```ts
if (!target && popupRef.current && popupRef.current.closed && candidates.length > 0) {
  target = candidates[0]; // ← link silencioso
}
```

Como o PFM não cria registro novo numa reautorização, isso casa também o caso "popup fechou sem autorização" e link a conta antiga sem o usuário fazer login.

## Correção

### `src/components/ConnectAccountDialog.tsx`

1. **Remover o fallback automático** dentro de `startPolling`. O polling só vincula quando aparece um `pfm_account_id` **novo** (que não estava em `knownIdsRef` no momento do clique). Assim, o popup do Instagram abre normalmente, o usuário faz login com a conta que quiser, e só essa nova conta é vinculada à empresa Teste.

2. **Quando timeout/cancel acontecer**, apenas limpar estado (`connecting`, `authUrl`) sem linkar nada. Mensagem de timeout permanece informativa.

3. Para o caso legítimo "quero reaproveitar uma conta que já existe no PFM em outra empresa do mesmo dono", adicionar um botão explícito **"Vincular a esta empresa"** ao lado de cada `PfmAccount` listado que ainda não está em `linkedIds`. Esse botão chama `api.linkSocialAccountToCompany(...)` diretamente, sem OAuth, e invalida os caches `company/social-accounts`, `company/pfm-accounts`, `company/pfm-posts`. É o único caminho que reaproveita conta sem novo login — e é explícito.

### O que NÃO muda

- Popup OAuth, polling pelo novo `pfm_account_id`, e link automático quando a conta é realmente nova continuam iguais.
- Bluesky (sem OAuth) segue igual.
- "Desvincular" continua removendo só o vínculo com a empresa ativa (sem desconectar do PFM).
- Nenhuma vinculação existente de outras empresas é tocada — Denison mantém tudo.

## Resultado esperado

- Empresa **Teste** → clicar em "Conectar" no Instagram → popup do Instagram abre e pede login. Após autorizar com outra conta, **essa nova conta** é vinculada à Teste.
- Fechar o popup sem autorizar → **nada acontece**.
- Para reaproveitar `@denisonleandro.adv` na Teste sem novo login, usar o botão explícito "Vincular a esta empresa" que aparece junto da conta listada.
