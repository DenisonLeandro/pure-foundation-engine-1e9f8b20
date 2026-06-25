-- =====================================================
-- Update get_company_configs_status to use user-level keys
-- =====================================================
-- Since API keys are now stored in user_configs (not company_configs),
-- update this function to pull from user_configs instead

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
    coalesce(length(uc.postforme_api_key) > 0, false)                                   AS has_postforme,
    coalesce(length(uc.blotato_api_key)   > 0, false)                                   AS has_blotato,
    coalesce(length(uc.pexels_api_key)    > 0, false)                                   AS has_pexels,
    coalesce(length(uc.apify_api_token)   > 0, false)                                   AS has_apify,
    coalesce(length(uc.firecrawl_api_key) > 0, false)                                   AS has_firecrawl,
    coalesce(length(uc.higgsfield_api_id) > 0
             AND length(uc.higgsfield_api_secret) > 0, false)                           AS has_higgsfield,
    coalesce(length(uc.higgsfield_api_id) > 0, false)                                   AS has_higgsfield_api_id,
    coalesce(length(uc.higgsfield_api_secret) > 0, false)                               AS has_higgsfield_api_secret,
    uc.updated_at                                                                       AS updated_at
  FROM (
    SELECT auth.uid() AS user_id
    WHERE public.is_company_member(_company_id, auth.uid())
  ) m
  LEFT JOIN public.user_configs uc ON uc.user_id = m.user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_configs_status(uuid) TO authenticated;
