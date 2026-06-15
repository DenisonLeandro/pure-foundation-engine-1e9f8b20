
CREATE TABLE public.company_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  blotato_api_key text,
  postforme_api_key text,
  anthropic_api_key text,
  unsplash_api_key text,
  pexels_api_key text,
  apify_api_token text,
  firecrawl_api_key text,
  higgsfield_api_id text,
  higgsfield_api_secret text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_configs TO authenticated;
GRANT ALL ON public.company_configs TO service_role;

ALTER TABLE public.company_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read company configs"
  ON public.company_configs FOR SELECT
  TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "managers can insert company configs"
  ON public.company_configs FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_members(company_id, auth.uid()));

CREATE POLICY "managers can update company configs"
  ON public.company_configs FOR UPDATE
  TO authenticated
  USING (public.can_manage_members(company_id, auth.uid()))
  WITH CHECK (public.can_manage_members(company_id, auth.uid()));

CREATE POLICY "managers can delete company configs"
  ON public.company_configs FOR DELETE
  TO authenticated
  USING (public.can_manage_members(company_id, auth.uid()));

CREATE TRIGGER trg_company_configs_updated_at
  BEFORE UPDATE ON public.company_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Migrate existing API keys from owner's user_configs into each company.
INSERT INTO public.company_configs (
  company_id, blotato_api_key, postforme_api_key, anthropic_api_key,
  unsplash_api_key, pexels_api_key, apify_api_token, firecrawl_api_key,
  higgsfield_api_id, higgsfield_api_secret
)
SELECT
  c.id,
  NULLIF(uc.blotato_api_key, ''),
  uc.postforme_api_key,
  uc.anthropic_api_key,
  uc.unsplash_api_key,
  uc.pexels_api_key,
  uc.apify_api_token,
  uc.firecrawl_api_key,
  uc.higgsfield_api_id,
  uc.higgsfield_api_secret
FROM public.companies c
JOIN public.user_configs uc ON uc.user_id = c.created_by
ON CONFLICT (company_id) DO NOTHING;

-- Helper: resolve "active" company keys for a user (first company they own/manage)
-- Used by edge functions that only have a user_id.
CREATE OR REPLACE FUNCTION public.get_company_keys_for_user(_user_id uuid)
RETURNS public.company_configs
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cc.*
  FROM public.company_configs cc
  JOIN public.company_members cm ON cm.company_id = cc.company_id
  WHERE cm.user_id = _user_id AND cm.status = 'active'
  ORDER BY CASE cm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, cm.created_at ASC
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_company_keys_for_user(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_company_keys_for_user(uuid) TO authenticated, service_role;
