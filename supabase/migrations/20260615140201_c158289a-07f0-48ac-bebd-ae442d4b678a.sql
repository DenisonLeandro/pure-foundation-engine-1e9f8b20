
-- Validation trigger: ensure legacy_brand_profile_id points to a brand owned by the same user
CREATE OR REPLACE FUNCTION public.validate_company_legacy_brand()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _brand_owner uuid;
BEGIN
  IF NEW.legacy_brand_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO _brand_owner
  FROM public.brand_profiles
  WHERE id = NEW.legacy_brand_profile_id;

  IF _brand_owner IS NULL THEN
    RAISE EXCEPTION 'Marca antiga sem dono não pode ser convertida em empresa';
  END IF;

  IF _brand_owner <> NEW.created_by THEN
    RAISE EXCEPTION 'Somente o dono da marca pode convertê-la em empresa';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_company_legacy_brand ON public.companies;
CREATE TRIGGER trg_validate_company_legacy_brand
  BEFORE INSERT OR UPDATE OF legacy_brand_profile_id ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.validate_company_legacy_brand();

-- Revoke any direct write access on company_members from regular roles.
-- Inserts/updates must happen via SECURITY DEFINER paths (triggers, RPCs, edge function).
REVOKE INSERT, UPDATE ON public.company_members FROM authenticated;
REVOKE INSERT, UPDATE ON public.company_members FROM anon;

-- Make sure no permissive INSERT policy exists for authenticated users
DROP POLICY IF EXISTS "users can insert their own membership" ON public.company_members;
DROP POLICY IF EXISTS "authenticated can insert company members" ON public.company_members;
