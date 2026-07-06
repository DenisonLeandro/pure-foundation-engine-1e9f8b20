
ALTER TABLE public.company_configs
  ADD COLUMN IF NOT EXISTS profile_urls jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.get_company_profile_urls(_company_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(profile_urls, '{}'::jsonb)
    FROM public.company_configs
   WHERE company_id = _company_id
     AND public.is_company_member(_company_id, auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.set_company_profile_urls(_company_id uuid, _patch jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _role text;
  _result jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_company_member(_company_id, _uid) THEN
    RAISE EXCEPTION 'not a member of company' USING ERRCODE = '42501';
  END IF;

  SELECT public.get_company_role(_company_id, _uid) INTO _role;
  IF _role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'insufficient role: % (owner/admin required)', COALESCE(_role, 'none')
      USING ERRCODE = '42501';
  END IF;

  IF _patch IS NULL OR jsonb_typeof(_patch) <> 'object' THEN
    RAISE EXCEPTION 'patch must be a JSON object' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.company_configs (company_id)
  VALUES (_company_id)
  ON CONFLICT (company_id) DO NOTHING;

  UPDATE public.company_configs
     SET profile_urls = COALESCE(profile_urls, '{}'::jsonb) || _patch,
         updated_at = now()
   WHERE company_id = _company_id
   RETURNING profile_urls INTO _result;

  RETURN COALESCE(_result, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_profile_urls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_company_profile_urls(uuid, jsonb) TO authenticated;
