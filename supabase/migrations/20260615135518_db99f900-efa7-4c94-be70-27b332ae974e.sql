ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS legacy_brand_profile_id uuid REFERENCES public.brand_profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_legacy_brand_profile_id
ON public.companies (legacy_brand_profile_id)
WHERE legacy_brand_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_created_by
ON public.companies (created_by);

DROP POLICY IF EXISTS "creators can view own companies" ON public.companies;
CREATE POLICY "creators can view own companies"
ON public.companies
FOR SELECT TO authenticated
USING (created_by = auth.uid());

CREATE OR REPLACE FUNCTION public.claim_owned_company(_company_id uuid)
RETURNS public.company_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company public.companies;
  _member public.company_members;
BEGIN
  SELECT * INTO _company
  FROM public.companies
  WHERE id = _company_id
    AND created_by = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empresa não encontrada ou usuário sem permissão';
  END IF;

  INSERT INTO public.company_members (company_id, user_id, role, status)
  VALUES (_company_id, auth.uid(), 'owner', 'active')
  ON CONFLICT (company_id, user_id)
  DO UPDATE SET role = 'owner', status = 'active', updated_at = now()
  RETURNING * INTO _member;

  RETURN _member;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_owned_company(uuid) TO authenticated;