-- =====================================================
-- Autopilot v2 — schema novo (fila de jobs, escopo por empresa)
-- =====================================================
-- Reescrita do zero. Decisão de produto: descartar os dados legados do
-- Autopilot v1 (usuários reconfiguram). As tabelas legadas são removidas
-- também para liberar o nome `autopilot_posts` (reutilizado na v2).
--
-- Modelo:
--   autopilot_plans   — um plano = um período de conteúdo colado (ciclo finito)
--     └── autopilot_posts  — um post por dia do plano (máquina de estados)
--     └── autopilot_jobs   — fila de execução (motor em 2º plano)
--
-- Permissão: qualquer membro ativo da empresa (owner/admin/editor) opera dentro
-- do escopo dela. RLS via is_company_member(). Worker/tick usam service_role
-- (bypass de RLS).

-- ── 1. Remover schema legado (v1) — ordem de dependência ────────────
DROP TABLE IF EXISTS public.autopilot_posts CASCADE;
DROP TABLE IF EXISTS public.autopilot_calendars CASCADE;
DROP TABLE IF EXISTS public.autopilot_configs CASCADE;

-- ── 2. autopilot_plans ──────────────────────────────────────────────
CREATE TABLE public.autopilot_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brand_profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),

  name text NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  social_account_ids text[] NOT NULL DEFAULT '{}',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',   -- IANA
  requires_approval boolean NOT NULL DEFAULT true,

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','generating','review','approved','active','completed','failed','paused','canceled')),
  period_start date,
  period_end date,
  raw_plan_text text,                                   -- texto original colado (referência)
  ending_notice_sent_at timestamptz,                    -- aviso "7 dias antes" enviado (1x por plano)

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_autopilot_plans_company ON public.autopilot_plans(company_id);
CREATE INDEX idx_autopilot_plans_status ON public.autopilot_plans(status);

-- ── 3. autopilot_posts ──────────────────────────────────────────────
CREATE TABLE public.autopilot_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.autopilot_plans(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  post_date date NOT NULL,                              -- vem do plano
  theme text NOT NULL,                                  -- obrigatório
  category text,                                        -- opcional

  art_brief text,                                       -- briefing rico expandido (pra regenerar sem re-expandir)
  caption text,                                         -- legenda (IA)
  hashtags text[] NOT NULL DEFAULT '{}',
  image_url text,                                       -- arte final (A2, com logo carimbada)
  image_prompt text,                                    -- prompt final usado (buildArtPrompt)
  visual_provider text NOT NULL DEFAULT 'openai',       -- extensível (futuro: higgsfield)

  scheduled_at timestamptz,                             -- post_date + melhor hora, em UTC
  time_locked boolean NOT NULL DEFAULT false,           -- override manual de horário

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','generating','ready','approved','scheduled','published','failed','removed')),
  pfm_post_id text,
  published_url text,
  engagement jsonb,
  error text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_autopilot_posts_plan ON public.autopilot_posts(plan_id);
CREATE INDEX idx_autopilot_posts_company ON public.autopilot_posts(company_id);
CREATE INDEX idx_autopilot_posts_status ON public.autopilot_posts(status);
CREATE INDEX idx_autopilot_posts_scheduled ON public.autopilot_posts(scheduled_at);

-- ── 4. autopilot_jobs (fila / motor) ────────────────────────────────
CREATE TABLE public.autopilot_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.autopilot_plans(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.autopilot_posts(id) ON DELETE CASCADE,

  kind text NOT NULL
    CHECK (kind IN ('gen_image','gen_caption','schedule_post','confirm_post')),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','done','failed')),
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 4,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}',
  locked_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice do claim: pega jobs prontos (queued + na hora) rapidamente.
CREATE INDEX idx_autopilot_jobs_claim ON public.autopilot_jobs(status, next_attempt_at);
CREATE INDEX idx_autopilot_jobs_plan ON public.autopilot_jobs(plan_id);
CREATE INDEX idx_autopilot_jobs_post ON public.autopilot_jobs(post_id);

-- ── 5. updated_at triggers (reusa handle_updated_at existente) ──────
CREATE TRIGGER trg_autopilot_plans_updated_at
  BEFORE UPDATE ON public.autopilot_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_autopilot_posts_updated_at
  BEFORE UPDATE ON public.autopilot_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_autopilot_jobs_updated_at
  BEFORE UPDATE ON public.autopilot_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 6. RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.autopilot_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_jobs  ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.autopilot_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.autopilot_posts TO authenticated;
GRANT SELECT ON public.autopilot_jobs TO authenticated;  -- fila só é lida pelo client (progresso); escrita via service_role
GRANT ALL ON public.autopilot_plans TO service_role;
GRANT ALL ON public.autopilot_posts TO service_role;
GRANT ALL ON public.autopilot_jobs  TO service_role;

-- plans: qualquer membro ativo da empresa gerencia (owner/admin/editor).
CREATE POLICY "members manage company autopilot plans"
  ON public.autopilot_plans FOR ALL
  TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

-- posts: idem (editar legenda, remover, aprovar, ajustar horário na revisão).
CREATE POLICY "members manage company autopilot posts"
  ON public.autopilot_posts FOR ALL
  TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

-- jobs: membros só LEEM (para exibir progresso da geração). Escrita é do motor
-- (service_role, que ignora RLS).
CREATE POLICY "members view company autopilot jobs"
  ON public.autopilot_jobs FOR SELECT
  TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
