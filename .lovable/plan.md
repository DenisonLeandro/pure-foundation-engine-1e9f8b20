# Por que só o Instagram traz dados

O painel usa o edge function `social-analytics` (Apify) para cada rede. Para chamar o scraper certo, ele precisa de:

- **Instagram / Twitter / Threads / Pinterest**: só o `username` (handle).
- **Facebook / LinkedIn / YouTube / TikTok**: precisam da **URL pública do perfil** (o Apify recebe `startUrls`/`profileUrls`/`companies`). Sem essa URL, o actor não encontra a página e retorna vazio → **0 seguidores**.

Essas URLs são preenchidas em **Setup → Conectar rede → "URL do perfil (para analytics)"** e hoje ficam salvas **apenas no `localStorage` do navegador** (`companyStorage("profile_urls")`).

Consequência prática:
- No Instagram o `username` vindo do Post for Me já basta → funciona.
- Nas outras redes, se você:
  - nunca preencheu essas URLs,
  - preencheu em outro navegador/dispositivo,
  - ou limpou o cache do navegador,
  → o front envia a conta **sem URL válida**, o Apify não resolve o perfil e você recebe zeros em tudo.

Isso é agravado porque o `username` que o PFM devolve para Facebook/LinkedIn geralmente é um ID interno, não um slug de página — então mesmo "chutando" `facebook.com/{username}` o actor falha.

# Plano de correção

Sem mudar visual do editor, galeria ou pipeline de posts.

## 1. Persistir `profile_urls` por empresa no banco

- Adicionar coluna `profile_urls jsonb not null default '{}'::jsonb` em `public.company_configs` (via migration).
- Nova RPC `set_company_profile_urls(_company_id uuid, _patch jsonb)` (SECURITY DEFINER, valida `is_company_member` + role owner/admin), que faz merge no jsonb.
- Nova RPC `get_company_profile_urls(_company_id uuid)` (SECURITY DEFINER, valida membership), retorna o jsonb.

## 2. Ler/escrever via backend, com fallback ao localStorage legado

- `src/components/ConnectAccountDialog.tsx`: ao abrir, carregar via RPC `get_company_profile_urls`; se banco vier vazio e localStorage tiver dados, migrar para o banco e limpar o localStorage.
- `updateProfileUrl` passa a chamar `set_company_profile_urls` (debounced no blur) e mantém o cache local só para responsividade da UI.
- `src/pages/Analytics.tsx` e `src/pages/Dashboard.tsx`: buscar as URLs por RPC (via TanStack Query) em vez de `companyStorage.get(..., "profile_urls")`. Mantém-se um fallback para o localStorage antigo enquanto os dados não migram.

## 3. Sinalizar contas que não vão trazer dados

Em `buildAnalyticsAccounts` (`src/lib/api/analytics.ts`) e no botão "Atualizar analytics":

- Marcar como **inválidas** contas de `facebook | linkedin | youtube | tiktok` sem URL pública salva (independente do que o PFM devolveu como `username`).
- No Analytics, mostrar um alerta claro por plataforma faltante: *"Facebook sem URL de perfil pública — abra Setup → Conectar rede e informe `https://facebook.com/suapagina`"*, com link direto para o dialog daquela rede.
- Não bloquear o fetch das que estão OK — apenas listar as pendentes.

## 4. Facebook: aceitar tanto slug quanto URL completa

Pequeno reforço no `PLATFORMS.facebook.buildInput` em `supabase/functions/social-analytics/index.ts`:

- Se `u` já começar com `http`, usar como está.
- Se contiver `facebook.com`, normalizar (adicionar `https://`).
- Caso contrário, montar `https://www.facebook.com/${u}/`.

Isso reduz erros silenciosos quando o usuário cola só o slug ou uma URL parcial.

## Arquivos afetados

- Migration nova em `supabase/migrations/` (coluna + 2 RPCs + GRANTs).
- `src/components/ConnectAccountDialog.tsx` — leitura/gravação via RPC, migração do legado.
- `src/pages/Analytics.tsx`, `src/pages/Dashboard.tsx` — carregar URLs via RPC + alertas de conta incompleta.
- `src/lib/api/analytics.ts` — expor lista de "pendentes" além de `accounts`.
- `supabase/functions/social-analytics/index.ts` — normalização Facebook (edit mínimo).

## Fora de escopo

- Não altero as chaves Apify, nem tocarei em `blotato-proxy`, `postforme-proxy`, editor visual, galeria ou fluxo de publicação.
- Não altero os actors atuais nem os parsers de outras plataformas (o motivo de retornarem zero é falta de input válido, não parser).

## Detalhes técnicos (RPC)

```sql
alter table public.company_configs
  add column if not exists profile_urls jsonb not null default '{}'::jsonb;

create or replace function public.set_company_profile_urls(_company_id uuid, _patch jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _role text;
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  if not public.is_company_member(_company_id, _uid) then raise exception 'not a member'; end if;
  select public.get_company_role(_company_id, _uid) into _role;
  if _role not in ('owner','admin') then raise exception 'insufficient role'; end if;
  if _patch is null or jsonb_typeof(_patch) <> 'object' then raise exception 'invalid patch'; end if;
  update public.company_configs
     set profile_urls = coalesce(profile_urls,'{}'::jsonb) || _patch,
         updated_at = now()
   where company_id = _company_id;
  return (select profile_urls from public.company_configs where company_id = _company_id);
end $$;

create or replace function public.get_company_profile_urls(_company_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(profile_urls,'{}'::jsonb)
    from public.company_configs
   where company_id = _company_id
     and public.is_company_member(_company_id, auth.uid());
$$;

grant execute on function public.set_company_profile_urls(uuid, jsonb) to authenticated;
grant execute on function public.get_company_profile_urls(uuid) to authenticated;
```
