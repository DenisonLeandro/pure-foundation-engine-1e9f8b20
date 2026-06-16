
ALTER TABLE public.creations
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.creations
SET created_by = user_id
WHERE created_by IS NULL AND user_id IS NOT NULL;

WITH single_company AS (
  SELECT cm.user_id, (array_agg(cm.company_id))[1] AS company_id
  FROM public.company_members cm
  WHERE cm.status = 'active'
  GROUP BY cm.user_id
  HAVING COUNT(*) = 1
)
UPDATE public.creations c
SET company_id = sc.company_id
FROM single_company sc
WHERE c.company_id IS NULL
  AND c.created_by = sc.user_id;

CREATE INDEX IF NOT EXISTS idx_creations_company_id ON public.creations(company_id);
CREATE INDEX IF NOT EXISTS idx_creations_created_by ON public.creations(created_by);

DROP POLICY IF EXISTS "Users can read own creations" ON public.creations;
DROP POLICY IF EXISTS "Users can insert own creations" ON public.creations;
DROP POLICY IF EXISTS "Users can update own creations" ON public.creations;
DROP POLICY IF EXISTS "Users can delete own creations" ON public.creations;

CREATE POLICY "Company members can read creations"
  ON public.creations FOR SELECT TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Company members can insert creations"
  ON public.creations FOR INSERT TO authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND public.is_company_member(company_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Owners/admins update any, editors update own"
  ON public.creations FOR UPDATE TO authenticated
  USING (
    company_id IS NOT NULL
    AND (
      public.can_manage_members(company_id, auth.uid())
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    company_id IS NOT NULL
    AND public.is_company_member(company_id, auth.uid())
  );

CREATE POLICY "Owners/admins can delete creations"
  ON public.creations FOR DELETE TO authenticated
  USING (
    company_id IS NOT NULL
    AND public.can_manage_members(company_id, auth.uid())
  );
