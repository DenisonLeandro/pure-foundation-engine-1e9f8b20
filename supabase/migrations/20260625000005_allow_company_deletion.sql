-- =====================================================
-- Allow company deletion with proper authorization
-- =====================================================
-- Enable company deletion only for owners.
-- All related data cascades per FK constraints.

-- Create DELETE policy: only owner can delete their company
CREATE POLICY "owners can delete company"
  ON public.companies FOR DELETE
  TO authenticated
  USING (public.get_company_role(id, auth.uid()) = 'owner');

-- Log: All cascading deletes will be handled by FK constraints:
-- - company_members → CASCADE DELETE
-- - company_invites → CASCADE DELETE
-- - company_configs → CASCADE DELETE
-- - company_social_accounts → CASCADE DELETE
-- - creations → CASCADE DELETE
-- - brand_profiles → CASCADE DELETE
-- - articles → CASCADE DELETE
-- - post_history (company_id) → CASCADE DELETE
--
-- Tables NOT deleted (user-owned data):
-- - post_history (user_id based entries remain)
-- - analytics_snapshots
-- - saved_sources
