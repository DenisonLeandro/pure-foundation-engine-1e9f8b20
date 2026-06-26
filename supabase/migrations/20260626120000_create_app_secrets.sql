-- Tabela genérica de segredos internos do app (ex: senha do painel de
-- custos). RLS travado: nenhuma policy para anon/authenticated, só
-- SERVICE_ROLE (edge functions) ou o SQL Editor do dashboard (que roda
-- como superuser e ignora RLS) conseguem ler/escrever.
create table if not exists public.app_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_secrets enable row level security;
