-- Autopilot v2 schema
DROP TABLE IF EXISTS public.autopilot_posts CASCADE;
DROP TABLE IF EXISTS public.autopilot_calendars CASCADE;
DROP TABLE IF EXISTS public.autopilot_configs CASCADE;

CREATE TABLE public.autopilot_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brand_profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  social_account_ids text[] NOT NULL DEFAULT '{}',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  requires_approval boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','generating','review','approved','active','completed','failed','paused','canceled')),
  period_start date,
  period_end date,
  raw_plan_text text,
  ending_notice_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_autopilot_plans_company ON public.autopilot_plans(company_id);
CREATE INDEX idx_autopilot_plans_status ON public.autopilot_plans(status);

CREATE TABLE public.autopilot_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.autopilot_plans(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  post_date date NOT NULL,
  theme text NOT NULL,
  category text,
  art_brief text,
  caption text,
  hashtags text[] NOT NULL DEFAULT '{}',
  image_url text,
  image_prompt text,
  visual_provider text NOT NULL DEFAULT 'openai',
  scheduled_at timestamptz,
  time_locked boolean NOT NULL DEFAULT false,
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

CREATE TABLE public.autopilot_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.autopilot_plans(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.autopilot_posts(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('gen_image','gen_caption','schedule_post','confirm_post')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 4,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}',
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_autopilot_jobs_claim ON public.autopilot_jobs(status, next_attempt_at);
CREATE INDEX idx_autopilot_jobs_plan ON public.autopilot_jobs(plan_id);
CREATE INDEX idx_autopilot_jobs_post ON public.autopilot_jobs(post_id);

CREATE TRIGGER trg_autopilot_plans_updated_at BEFORE UPDATE ON public.autopilot_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_autopilot_posts_updated_at BEFORE UPDATE ON public.autopilot_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_autopilot_jobs_updated_at BEFORE UPDATE ON public.autopilot_jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.autopilot_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.autopilot_posts TO authenticated;
GRANT SELECT ON public.autopilot_jobs TO authenticated;
GRANT ALL ON public.autopilot_plans TO service_role;
GRANT ALL ON public.autopilot_posts TO service_role;
GRANT ALL ON public.autopilot_jobs  TO service_role;

ALTER TABLE public.autopilot_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_jobs  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage company autopilot plans"
  ON public.autopilot_plans FOR ALL TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "members manage company autopilot posts"
  ON public.autopilot_posts FOR ALL TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "members view company autopilot jobs"
  ON public.autopilot_jobs FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

-- Engine RPCs
CREATE OR REPLACE FUNCTION public.autopilot_claim_jobs(_limit int DEFAULT 3)
RETURNS SETOF public.autopilot_jobs
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.autopilot_jobs j
  SET status = 'running', locked_at = now(), attempts = attempts + 1, updated_at = now()
  WHERE j.id IN (
    SELECT id FROM public.autopilot_jobs
    WHERE status = 'queued' AND next_attempt_at <= now()
    ORDER BY next_attempt_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT _limit
  )
  RETURNING j.*;
$$;

CREATE OR REPLACE FUNCTION public.autopilot_requeue_stuck_jobs(_stuck_seconds int DEFAULT 300)
RETURNS int
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _n int;
BEGIN
  WITH stuck AS (
    SELECT id, post_id, attempts, max_attempts
    FROM public.autopilot_jobs
    WHERE status = 'running'
      AND locked_at IS NOT NULL
      AND locked_at < now() - make_interval(secs => _stuck_seconds)
    FOR UPDATE SKIP LOCKED
  ),
  upd AS (
    UPDATE public.autopilot_jobs j SET
      status = CASE WHEN s.attempts >= s.max_attempts THEN 'failed' ELSE 'queued' END,
      next_attempt_at = CASE
        WHEN s.attempts >= s.max_attempts THEN j.next_attempt_at
        ELSE now() + make_interval(secs => least(60 * power(2, s.attempts), 900)::double precision)
      END,
      last_error = 'reaped: stuck em running (worker interrompido)',
      updated_at = now()
    FROM stuck s
    WHERE j.id = s.id
    RETURNING s.post_id, j.status AS new_status
  ),
  postfail AS (
    UPDATE public.autopilot_posts p SET
      status = 'failed',
      error = 'geração interrompida (job esgotou tentativas)',
      updated_at = now()
    FROM upd
    WHERE upd.post_id = p.id AND upd.new_status = 'failed'
    RETURNING 1
  )
  SELECT count(*) INTO _n FROM upd;
  RETURN COALESCE(_n, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.autopilot_claim_jobs(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.autopilot_requeue_stuck_jobs(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.autopilot_claim_jobs(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.autopilot_requeue_stuck_jobs(int) TO service_role;

-- Cron
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'autopilot-hourly-check') THEN
    PERFORM cron.unschedule('autopilot-hourly-check');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'autopilot-tick') THEN
    PERFORM cron.unschedule('autopilot-tick');
  END IF;
END $$;

select cron.schedule(
  'autopilot-tick',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://pgimbjfdxwefahxmpdpc.supabase.co/functions/v1/autopilot-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);