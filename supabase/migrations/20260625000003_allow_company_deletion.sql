-- =====================================================
-- Allow company deletion with proper authorization
-- =====================================================
-- Only owners can delete their company
-- All related data cascades via FK constraints

DROP POLICY IF EXISTS "owners can delete company" ON public.companies;

CREATE POLICY "owners can delete company"
  ON public.companies FOR DELETE
  TO authenticated
  USING (
    public.get_company_role(id, auth.uid()) = 'owner'
    OR created_by = auth.uid()
  );
