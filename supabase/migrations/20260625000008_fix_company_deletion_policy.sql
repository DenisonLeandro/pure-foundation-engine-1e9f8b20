-- =====================================================
-- Fix company deletion policy to allow deletion by creator
-- =====================================================
-- Allow deletion by:
-- 1. Owner (user with 'owner' role in company_members)
-- 2. Creator (user who created the company, even if not yet claimed)

DROP POLICY IF EXISTS "owners can delete company" ON public.companies;
CREATE POLICY "owners can delete company"
  ON public.companies FOR DELETE
  TO authenticated
  USING (
    public.get_company_role(id, auth.uid()) = 'owner'
    OR created_by = auth.uid()
  );
