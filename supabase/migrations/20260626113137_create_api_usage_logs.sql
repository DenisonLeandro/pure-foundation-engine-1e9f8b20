-- Registro interno de custo/uso das integrações pagas (OpenAI, Higgsfield,
-- Firecrawl, Post for Me, Blotato). Usado apenas pelo painel oculto de
-- custos; nunca exposto via RLS a clientes autenticados.
create table if not exists public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid,
  service text not null,
  operation text not null,
  units numeric not null default 0,
  unit_type text not null default 'call',
  cost_usd numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists api_usage_logs_created_at_idx on public.api_usage_logs (created_at desc);
create index if not exists api_usage_logs_service_idx on public.api_usage_logs (service);
create index if not exists api_usage_logs_company_idx on public.api_usage_logs (company_id);

alter table public.api_usage_logs enable row level security;

-- Nenhuma policy para anon/authenticated: só SERVICE_ROLE (edge functions)
-- consegue ler/escrever. O painel de custos passa sempre pelo backend.
