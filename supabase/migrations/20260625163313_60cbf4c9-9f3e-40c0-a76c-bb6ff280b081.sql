
-- 1) Add company_id to user-scoped tables
ALTER TABLE public.saved_sources ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.analytics_snapshots ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.autopilot_configs ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.autopilot_calendars ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.autopilot_posts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2) Backfill with the user's first company (oldest by created_at)
WITH first_co AS (
  SELECT DISTINCT ON (created_by) created_by AS user_id, id AS company_id
  FROM public.companies
  ORDER BY created_by, created_at ASC
)
UPDATE public.saved_sources s SET company_id = f.company_id
FROM first_co f WHERE s.company_id IS NULL AND s.user_id = f.user_id;

WITH first_co AS (
  SELECT DISTINCT ON (created_by) created_by AS user_id, id AS company_id
  FROM public.companies
  ORDER BY created_by, created_at ASC
)
UPDATE public.analytics_snapshots s SET company_id = f.company_id
FROM first_co f WHERE s.company_id IS NULL AND s.user_id = f.user_id;

WITH first_co AS (
  SELECT DISTINCT ON (created_by) created_by AS user_id, id AS company_id
  FROM public.companies
  ORDER BY created_by, created_at ASC
)
UPDATE public.autopilot_configs s SET company_id = f.company_id
FROM first_co f WHERE s.company_id IS NULL AND s.user_id = f.user_id;

WITH first_co AS (
  SELECT DISTINCT ON (created_by) created_by AS user_id, id AS company_id
  FROM public.companies
  ORDER BY created_by, created_at ASC
)
UPDATE public.autopilot_calendars s SET company_id = f.company_id
FROM first_co f WHERE s.company_id IS NULL AND s.user_id = f.user_id;

WITH first_co AS (
  SELECT DISTINCT ON (created_by) created_by AS user_id, id AS company_id
  FROM public.companies
  ORDER BY created_by, created_at ASC
)
UPDATE public.autopilot_posts s SET company_id = f.company_id
FROM first_co f WHERE s.company_id IS NULL AND s.user_id = f.user_id;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS saved_sources_company_id_idx ON public.saved_sources(company_id);
CREATE INDEX IF NOT EXISTS analytics_snapshots_company_id_idx ON public.analytics_snapshots(company_id);
CREATE INDEX IF NOT EXISTS autopilot_configs_company_id_idx ON public.autopilot_configs(company_id);
CREATE INDEX IF NOT EXISTS autopilot_calendars_company_id_idx ON public.autopilot_calendars(company_id);
CREATE INDEX IF NOT EXISTS autopilot_posts_company_id_idx ON public.autopilot_posts(company_id);

-- 4) Replace RLS policies to require company membership (with legacy fallback when company_id is NULL)
-- saved_sources
DROP POLICY IF EXISTS "Users can view their own saved sources" ON public.saved_sources;
DROP POLICY IF EXISTS "Users can insert their own saved sources" ON public.saved_sources;
DROP POLICY IF EXISTS "Users can update their own saved sources" ON public.saved_sources;
DROP POLICY IF EXISTS "Users can delete their own saved sources" ON public.saved_sources;
DROP POLICY IF EXISTS "saved_sources_select" ON public.saved_sources;
DROP POLICY IF EXISTS "saved_sources_insert" ON public.saved_sources;
DROP POLICY IF EXISTS "saved_sources_update" ON public.saved_sources;
DROP POLICY IF EXISTS "saved_sources_delete" ON public.saved_sources;

CREATE POLICY "saved_sources_select" ON public.saved_sources FOR SELECT TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "saved_sources_insert" ON public.saved_sources FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (company_id IS NULL OR public.is_company_member(company_id, auth.uid()))
);
CREATE POLICY "saved_sources_update" ON public.saved_sources FOR UPDATE TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  (company_id IS NULL OR public.is_company_member(company_id, auth.uid()))
);
CREATE POLICY "saved_sources_delete" ON public.saved_sources FOR DELETE TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
);

-- analytics_snapshots
DROP POLICY IF EXISTS "Users can view their own analytics snapshots" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "Users can insert their own analytics snapshots" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "Users can update their own analytics snapshots" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "Users can delete their own analytics snapshots" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "analytics_snapshots_select" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "analytics_snapshots_insert" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "analytics_snapshots_update" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "analytics_snapshots_delete" ON public.analytics_snapshots;

CREATE POLICY "analytics_snapshots_select" ON public.analytics_snapshots FOR SELECT TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "analytics_snapshots_insert" ON public.analytics_snapshots FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (company_id IS NULL OR public.is_company_member(company_id, auth.uid()))
);
CREATE POLICY "analytics_snapshots_update" ON public.analytics_snapshots FOR UPDATE TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  company_id IS NULL OR public.is_company_member(company_id, auth.uid())
);
CREATE POLICY "analytics_snapshots_delete" ON public.analytics_snapshots FOR DELETE TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
);

-- autopilot_configs
DROP POLICY IF EXISTS "Users can manage their autopilot configs" ON public.autopilot_configs;
DROP POLICY IF EXISTS "autopilot_configs_select" ON public.autopilot_configs;
DROP POLICY IF EXISTS "autopilot_configs_insert" ON public.autopilot_configs;
DROP POLICY IF EXISTS "autopilot_configs_update" ON public.autopilot_configs;
DROP POLICY IF EXISTS "autopilot_configs_delete" ON public.autopilot_configs;

CREATE POLICY "autopilot_configs_select" ON public.autopilot_configs FOR SELECT TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "autopilot_configs_insert" ON public.autopilot_configs FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (company_id IS NULL OR public.is_company_member(company_id, auth.uid()))
);
CREATE POLICY "autopilot_configs_update" ON public.autopilot_configs FOR UPDATE TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  company_id IS NULL OR public.is_company_member(company_id, auth.uid())
);
CREATE POLICY "autopilot_configs_delete" ON public.autopilot_configs FOR DELETE TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
);

-- autopilot_calendars
DROP POLICY IF EXISTS "Users can manage their autopilot calendars" ON public.autopilot_calendars;
DROP POLICY IF EXISTS "autopilot_calendars_select" ON public.autopilot_calendars;
DROP POLICY IF EXISTS "autopilot_calendars_insert" ON public.autopilot_calendars;
DROP POLICY IF EXISTS "autopilot_calendars_update" ON public.autopilot_calendars;
DROP POLICY IF EXISTS "autopilot_calendars_delete" ON public.autopilot_calendars;

CREATE POLICY "autopilot_calendars_select" ON public.autopilot_calendars FOR SELECT TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "autopilot_calendars_insert" ON public.autopilot_calendars FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (company_id IS NULL OR public.is_company_member(company_id, auth.uid()))
);
CREATE POLICY "autopilot_calendars_update" ON public.autopilot_calendars FOR UPDATE TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  company_id IS NULL OR public.is_company_member(company_id, auth.uid())
);
CREATE POLICY "autopilot_calendars_delete" ON public.autopilot_calendars FOR DELETE TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
);

-- autopilot_posts
DROP POLICY IF EXISTS "Users can manage their autopilot posts" ON public.autopilot_posts;
DROP POLICY IF EXISTS "autopilot_posts_select" ON public.autopilot_posts;
DROP POLICY IF EXISTS "autopilot_posts_insert" ON public.autopilot_posts;
DROP POLICY IF EXISTS "autopilot_posts_update" ON public.autopilot_posts;
DROP POLICY IF EXISTS "autopilot_posts_delete" ON public.autopilot_posts;

CREATE POLICY "autopilot_posts_select" ON public.autopilot_posts FOR SELECT TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
);
CREATE POLICY "autopilot_posts_insert" ON public.autopilot_posts FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (company_id IS NULL OR public.is_company_member(company_id, auth.uid()))
);
CREATE POLICY "autopilot_posts_update" ON public.autopilot_posts FOR UPDATE TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  company_id IS NULL OR public.is_company_member(company_id, auth.uid())
);
CREATE POLICY "autopilot_posts_delete" ON public.autopilot_posts FOR DELETE TO authenticated
USING (
  (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  OR (company_id IS NULL AND user_id = auth.uid())
);
