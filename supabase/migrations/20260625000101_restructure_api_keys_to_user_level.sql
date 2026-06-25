-- =====================================================
-- Restructure API keys to user level (not company level)
-- =====================================================
-- Move API keys from company_configs to user_configs
-- All companies owned by a user will inherit keys from that user
-- This simplifies multi-company and multi-user scenarios

-- 1. Ensure user_configs has all API key columns
ALTER TABLE public.user_configs
ADD COLUMN IF NOT EXISTS postforme_api_key text,
ADD COLUMN IF NOT EXISTS blotato_api_key text,
ADD COLUMN IF NOT EXISTS anthropic_api_key text,
ADD COLUMN IF NOT EXISTS unsplash_api_key text,
ADD COLUMN IF NOT EXISTS pexels_api_key text,
ADD COLUMN IF NOT EXISTS apify_api_token text,
ADD COLUMN IF NOT EXISTS firecrawl_api_key text,
ADD COLUMN IF NOT EXISTS higgsfield_api_id text,
ADD COLUMN IF NOT EXISTS higgsfield_api_secret text;

-- 2. Migrate API keys from company_configs to user_configs
-- For each company, find the owner and copy keys to their user_configs
UPDATE public.user_configs uc
SET
  postforme_api_key = COALESCE(uc.postforme_api_key, cc.postforme_api_key),
  blotato_api_key = COALESCE(uc.blotato_api_key, cc.blotato_api_key),
  anthropic_api_key = COALESCE(uc.anthropic_api_key, cc.anthropic_api_key),
  unsplash_api_key = COALESCE(uc.unsplash_api_key, cc.unsplash_api_key),
  pexels_api_key = COALESCE(uc.pexels_api_key, cc.pexels_api_key),
  apify_api_token = COALESCE(uc.apify_api_token, cc.apify_api_token),
  firecrawl_api_key = COALESCE(uc.firecrawl_api_key, cc.firecrawl_api_key),
  higgsfield_api_id = COALESCE(uc.higgsfield_api_id, cc.higgsfield_api_id),
  higgsfield_api_secret = COALESCE(uc.higgsfield_api_secret, cc.higgsfield_api_secret)
FROM public.company_configs cc
JOIN public.companies c ON c.id = cc.company_id
WHERE c.created_by = uc.user_id
  AND (
    cc.postforme_api_key IS NOT NULL OR
    cc.blotato_api_key IS NOT NULL OR
    cc.anthropic_api_key IS NOT NULL OR
    cc.unsplash_api_key IS NOT NULL OR
    cc.pexels_api_key IS NOT NULL OR
    cc.apify_api_token IS NOT NULL OR
    cc.firecrawl_api_key IS NOT NULL OR
    cc.higgsfield_api_id IS NOT NULL OR
    cc.higgsfield_api_secret IS NOT NULL
  );

-- 3. Clear API keys from company_configs (they're now in user_configs)
UPDATE public.company_configs
SET
  postforme_api_key = NULL,
  blotato_api_key = NULL,
  anthropic_api_key = NULL,
  unsplash_api_key = NULL,
  pexels_api_key = NULL,
  apify_api_token = NULL,
  firecrawl_api_key = NULL,
  higgsfield_api_id = NULL,
  higgsfield_api_secret = NULL;

-- 4. Update get_company_keys_for_user to pull from user_configs instead
CREATE OR REPLACE FUNCTION public.get_company_keys_for_user(_user_id uuid)
RETURNS public.user_configs
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uc.*
  FROM public.user_configs uc
  WHERE uc.user_id = _user_id
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_company_keys_for_user(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_company_keys_for_user(uuid) TO authenticated, service_role;
