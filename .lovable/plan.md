# Expandir tela de Configurações

Hoje `/setup?manage=1` renderiza `ManageKeysView`, que só lista chaves de API. As demais configurações ficaram presas no fluxo de onboarding (`Setup.tsx`). Vou trazer o restante para essa tela, organizado em abas.

## O que entra

1. **Chaves de API** (já existe — mantém igual).
2. **Identidade da marca**
   - Editar `brandName` (input texto).
   - Upload/troca de `brandLogo` (bucket `media`, mesma lógica já usada em onboarding/brand profile).
   - Salva via `saveConfigToDb` em `user_configs.brand_name` / `brand_logo_url`.
3. **Contas sociais conectadas**
   - Lista as contas Post for Me já conectadas (reaproveita `useAccounts` / `pages/Accounts.tsx`).
   - Botão "Conectar nova conta" abre o `ConnectAccountDialog` existente.
   - Botão para desconectar cada conta.
4. **Preferências gerais**
   - Tema (claro/escuro/sistema) usando o `use-theme` hook existente.
   - Idioma da interface — só pt-BR ativo hoje; deixar o seletor pronto e desabilitado com tooltip "em breve" (mantém core rule pt-BR).
   - Botão "Refazer onboarding" → confirma, navega para `/setup?reset=1` (já suportado).
   - Botão "Sair da conta" (logout).

## Estrutura técnica

```text
src/components/setup/
  ManageKeysView.tsx        (existente, vira aba "Chaves")
  ManageBrandView.tsx       (novo — aba "Marca")
  ManageAccountsView.tsx    (novo — aba "Contas")
  ManagePreferencesView.tsx (novo — aba "Preferências")
  SettingsShell.tsx         (novo — header + Tabs do shadcn)
```

- `Setup.tsx` em modo `isManageMode` renderiza `SettingsShell` com as 4 abas em vez de `ManageKeysView` diretamente.
- Cada aba recebe `currentConfig` e `onSave` (mesma assinatura já usada).
- Upload de logo: reaproveita helper de upload do bucket `media` usado em `Brands.tsx`.
- Contas: importar e reutilizar componentes/lógica de `pages/Accounts.tsx` em vez de duplicar.
- Mantém o botão "Voltar" para `/dashboard` no header do shell.

## Fora de escopo
- Não muda schema do banco (todas as colunas já existem em `user_configs`).
- Não mexe em edge functions nem nas chaves de API.
- Não adiciona tradução real — só prepara o seletor.
