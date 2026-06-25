-- =====================================================
-- Validate brand_profiles migration to company_id
-- =====================================================
-- Ensure all brand_profiles have company_id set
-- Try to assign to oldest company of their user if needed

DO $$
DECLARE
  pending_count int;
  rec RECORD;
  assigned_count int := 0;
BEGIN
  -- Check for brand_profiles still without company_id
  SELECT count(*) INTO pending_count
  FROM public.brand_profiles
  WHERE company_id IS NULL;

  IF pending_count > 0 THEN
    -- Try to assign to oldest company owned by the user
    FOR rec IN
      SELECT bp.id, bp.user_id, bp.name
      FROM public.brand_profiles bp
      WHERE bp.company_id IS NULL AND bp.user_id IS NOT NULL
    LOOP
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

    -- Check again
    SELECT count(*) INTO pending_count FROM public.brand_profiles WHERE company_id IS NULL;

    IF pending_count = 0 THEN
      -- All resolved - make company_id NOT NULL
      BEGIN
        ALTER TABLE public.brand_profiles
          ALTER COLUMN company_id SET NOT NULL;
      EXCEPTION WHEN others THEN
        NULL; -- Already NOT NULL
      END;
    END IF;
  END IF;
END $$;
