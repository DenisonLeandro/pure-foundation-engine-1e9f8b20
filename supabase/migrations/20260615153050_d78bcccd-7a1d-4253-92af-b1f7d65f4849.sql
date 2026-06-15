REVOKE EXECUTE ON FUNCTION public.get_company_configs_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_company_configs_status(uuid) TO authenticated;