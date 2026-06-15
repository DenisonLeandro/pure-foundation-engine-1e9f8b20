REVOKE ALL ON FUNCTION public.claim_owned_company(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_owned_company(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_owned_company(uuid) TO authenticated;