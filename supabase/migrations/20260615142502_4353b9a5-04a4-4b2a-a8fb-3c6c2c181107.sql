
ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.brand_profiles
  ALTER COLUMN user_id DROP NOT NULL;

DO $$
DECLARE
  rec RECORD;
  owner_count int;
  target_company uuid;
  new_company_id uuid;
  pending_count int;
BEGIN
  UPDATE public.brand_profiles AS b
    SET company_id = c.id
  FROM public.companies AS c
  WHERE c.legacy_brand_profile_id = b.id
    AND b.company_id IS NULL;

  FOR rec IN SELECT * FROM public.brand_profiles WHERE company_id IS NULL AND user_id IS NOT NULL LOOP
    SELECT count(*), max(company_id) INTO owner_count, target_company
    FROM public.company_members
    WHERE user_id = rec.user_id AND status = 'active' AND role = 'owner';

    IF owner_count = 1 THEN
      UPDATE public.brand_profiles SET company_id = target_company WHERE id = rec.id;
    ELSIF owner_count = 0 THEN
      SELECT id INTO new_company_id
      FROM public.companies
      WHERE created_by = rec.user_id
        AND name IN (rec.name, 'Minha Empresa')
      ORDER BY created_at ASC
      LIMIT 1;

      IF new_company_id IS NULL THEN
        INSERT INTO public.companies (name, segment, primary_color, created_by, legacy_brand_profile_id)
        VALUES (
          COALESCE(NULLIF(rec.name, ''), 'Minha Empresa'),
          NULL,
          CASE WHEN rec.colors IS NOT NULL AND array_length(rec.colors,1) > 0 THEN rec.colors[1] ELSE NULL END,
          rec.user_id,
          rec.id
        )
        RETURNING id INTO new_company_id;
      END IF;

      UPDATE public.brand_profiles SET company_id = new_company_id WHERE id = rec.id;
    ELSE
      RAISE NOTICE 'brand_profile % left pending (user % is owner of % companies)', rec.id, rec.user_id, owner_count;
    END IF;
  END LOOP;

  WITH ranked AS (
    SELECT id,
           row_number() OVER (PARTITION BY company_id ORDER BY updated_at DESC NULLS LAST, created_at DESC) AS rn
    FROM public.brand_profiles
    WHERE is_default = true AND company_id IS NOT NULL
  )
  UPDATE public.brand_profiles b SET is_default = false
  FROM ranked r WHERE b.id = r.id AND r.rn > 1;

  SELECT count(*) INTO pending_count FROM public.brand_profiles WHERE company_id IS NULL;
  IF pending_count = 0 THEN
    EXECUTE 'ALTER TABLE public.brand_profiles ALTER COLUMN company_id SET NOT NULL';
  ELSE
    RAISE NOTICE '% brand_profiles ainda sem company_id; mantendo nullable', pending_count;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_brand_profiles_company_id ON public.brand_profiles(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS one_default_brand_per_company
  ON public.brand_profiles(company_id)
  WHERE is_default = true AND company_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.can_manage_brand_profiles(_company uuid, _user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company AND user_id = _user
      AND status = 'active' AND role IN ('owner','admin')
  );
$$;

DROP POLICY IF EXISTS "Users can read own profiles" ON public.brand_profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.brand_profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.brand_profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON public.brand_profiles;

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members or legacy owner can read brand"
  ON public.brand_profiles FOR SELECT
  USING (
    (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
    OR (company_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "owner/admin can insert brand"
  ON public.brand_profiles FOR INSERT
  WITH CHECK (
    company_id IS NOT NULL
    AND public.can_manage_brand_profiles(company_id, auth.uid())
  );

CREATE POLICY "owner/admin can update brand"
  ON public.brand_profiles FOR UPDATE
  USING (
    company_id IS NOT NULL
    AND public.can_manage_brand_profiles(company_id, auth.uid())
  )
  WITH CHECK (
    company_id IS NOT NULL
    AND public.can_manage_brand_profiles(company_id, auth.uid())
  );

CREATE POLICY "owner/admin can delete brand"
  ON public.brand_profiles FOR DELETE
  USING (
    company_id IS NOT NULL
    AND public.can_manage_brand_profiles(company_id, auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_profiles TO authenticated;
GRANT ALL ON public.brand_profiles TO service_role;
