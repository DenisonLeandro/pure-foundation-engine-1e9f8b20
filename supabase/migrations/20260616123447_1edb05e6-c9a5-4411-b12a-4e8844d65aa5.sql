-- 1) Remove raw third-party API key columns from user_configs.
--    Keys are now exclusively stored in public.company_configs (deny-all to clients,
--    read only via SECURITY DEFINER functions and service-role edge functions).
ALTER TABLE public.user_configs
  DROP COLUMN IF EXISTS postforme_api_key,
  DROP COLUMN IF EXISTS blotato_api_key,
  DROP COLUMN IF EXISTS pexels_api_key,
  DROP COLUMN IF EXISTS firecrawl_api_key,
  DROP COLUMN IF EXISTS higgsfield_api_id,
  DROP COLUMN IF EXISTS higgsfield_api_secret,
  DROP COLUMN IF EXISTS anthropic_api_key,
  DROP COLUMN IF EXISTS apify_api_token,
  DROP COLUMN IF EXISTS unsplash_api_key;

-- 2) Hide invite token from client SELECT. Owners/admins can still list invites
--    (id/email/role/status/expires_at) but never read the raw token; the
--    invite link is fetched on demand via the company-invite edge function.
REVOKE SELECT (token) ON public.company_invites FROM authenticated;
REVOKE SELECT (token) ON public.company_invites FROM anon;