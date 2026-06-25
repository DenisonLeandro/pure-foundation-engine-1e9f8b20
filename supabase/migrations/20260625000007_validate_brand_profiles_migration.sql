-- =====================================================
-- Validate and finalize brand_profiles migration to company_id
-- =====================================================
-- Ensure all brand_profiles have company_id set.
-- This is the final validation after the previous migration.

DO $$
DECLARE
  pending_count int;
  rec RECORD;
  assigned_count int := 0;
BEGIN
  -- Check for any brand_profiles still without company_id
  SELECT count(*) INTO pending_count FROM public.brand_profiles WHERE company_id IS NULL;

  IF pending_count > 0 THEN
    RAISE NOTICE '[brand_profiles migration] Found % pending brand_profiles', pending_count;

    -- Try to assign any remaining brand_profiles to the oldest company of their user
    FOR rec IN
      SELECT bp.id, bp.user_id, bp.name
      FROM public.brand_profiles bp
      WHERE bp.company_id IS NULL AND bp.user_id IS NOT NULL
    LOOP
      -- Get the oldest company owned by this user
      UPDATE public.brand_profiles bp
      SET company_id = (
        SELECT c.id
        FROM public.companies c
        WHERE c.created_by = rec.user_id
        ORDER BY c.created_at ASC
        LIMIT 1
      )
      WHERE bp.id = rec.id
        AND EXISTS (
          SELECT 1 FROM public.companies c
          WHERE c.created_by = rec.user_id
          LIMIT 1
        );

      IF FOUND THEN
        assigned_count := assigned_count + 1;
      END IF;
    END LOOP;

    IF assigned_count > 0 THEN
      RAISE NOTICE '[brand_profiles migration] Assigned % brand_profiles to companies', assigned_count;
    END IF;

    -- Check again
    SELECT count(*) INTO pending_count FROM public.brand_profiles WHERE company_id IS NULL;

    IF pending_count = 0 THEN
      -- All resolved — make company_id NOT NULL
      ALTER TABLE public.brand_profiles
        ALTER COLUMN company_id SET NOT NULL;
      RAISE NOTICE '[brand_profiles migration] All brand_profiles migrated to company_id - making column NOT NULL';
    ELSE
      RAISE EXCEPTION '[brand_profiles migration] Could not assign % brand_profiles to companies. Manual intervention required.', pending_count;
    END IF;
  ELSE
    -- Already all assigned
    BEGIN
      ALTER TABLE public.brand_profiles
        ALTER COLUMN company_id SET NOT NULL;
      RAISE NOTICE '[brand_profiles migration] brand_profiles already all migrated - company_id is now NOT NULL';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '[brand_profiles migration] company_id already NOT NULL';
    END;
  END IF;
END $$;

-- Create RLS policy for company-based access to brand profiles
-- (if not already created)
DROP POLICY IF EXISTS "company members can view and manage brand profiles" ON public.brand_profiles;
CREATE POLICY "company members can view and manage brand profiles"
  ON public.brand_profiles
  FOR ALL
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND public.is_company_member(company_id, auth.uid())
  )
  WITH CHECK (
    company_id IS NOT NULL
    AND public.can_manage_members(company_id, auth.uid())
  );
