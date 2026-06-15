CREATE OR REPLACE FUNCTION public.get_company_configs_status(_company_id uuid)
RETURNS TABLE (
  has_postforme boolean,
  has_blotato boolean,
  has_pexels boolean,
  has_apify boolean,
  has_firecrawl boolean,
  has_higgsfield boolean,
  has_higgsfield_api_id boolean,
  has_higgsfield_api_secret boolean,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce(length(cc.postforme_api_key) > 0, false)                                   AS has_postforme,
    coalesce(length(cc.blotato_api_key)   > 0, false)                                   AS has_blotato,
    coalesce(length(cc.pexels_api_key)    > 0, false)                                   AS has_pexels,
    coalesce(length(cc.apify_api_token)   > 0, false)                                   AS has_apify,
    coalesce(length(cc.firecrawl_api_key) > 0, false)                                   AS has_firecrawl,
    coalesce(length(cc.higgsfield_api_id) > 0
             AND length(cc.higgsfield_api_secret) > 0, false)                           AS has_higgsfield,
    coalesce(length(cc.higgsfield_api_id) > 0, false)                                   AS has_higgsfield_api_id,
    coalesce(length(cc.higgsfield_api_secret) > 0, false)                               AS has_higgsfield_api_secret,
    cc.updated_at                                                                       AS updated_at
  FROM (
    SELECT _company_id AS company_id
    WHERE public.is_company_member(_company_id, auth.uid())
  ) m
  LEFT JOIN public.company_configs cc ON cc.company_id = m.company_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_configs_status(uuid) TO authenticated;