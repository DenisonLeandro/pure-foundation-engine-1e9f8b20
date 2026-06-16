-- Fix creations RLS: add missing GRANTs and make policies safe for null company_id

GRANT SELECT, INSERT, UPDATE, DELETE ON public.creations TO authenticated;
GRANT ALL ON public.creations TO service_role;

-- Drop all existing policies to start clean
DROP POLICY IF EXISTS "Company members can read creations"      ON public.creations;
DROP POLICY IF EXISTS "Company members can insert creations"    ON public.creations;
DROP POLICY IF EXISTS "Owners/admins update any, editors update own" ON public.creations;
DROP POLICY IF EXISTS "Owners/admins can delete creations"      ON public.creations;
DROP POLICY IF EXISTS "Users can read own creations"            ON public.creations;
DROP POLICY IF EXISTS "Users can insert own creations"          ON public.creations;
DROP POLICY IF EXISTS "Users can update own creations"          ON public.creations;
DROP POLICY IF EXISTS "Users can delete own creations"          ON public.creations;

-- SELECT: company member OR legacy record owned by user (company_id IS NULL)
CREATE POLICY "creations_select"
  ON public.creations FOR SELECT TO authenticated
  USING (
    (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
    OR (company_id IS NULL AND user_id = auth.uid())
  );

-- INSERT: user must own the record
CREATE POLICY "creations_insert"
  ON public.creations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id = auth.uid() OR created_by = auth.uid())
  );

-- UPDATE: creator, or company owner/admin
CREATE POLICY "creations_update"
  ON public.creations FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR created_by = auth.uid()
    OR (company_id IS NOT NULL AND public.can_manage_members(company_id, auth.uid()))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR created_by = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()))
  );

-- DELETE: creator, or company owner/admin
CREATE POLICY "creations_delete"
  ON public.creations FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR created_by = auth.uid()
    OR (company_id IS NOT NULL AND public.can_manage_members(company_id, auth.uid()))
  );
