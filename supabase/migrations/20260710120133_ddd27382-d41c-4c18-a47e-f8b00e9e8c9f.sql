
-- Restrict system_settings read to authenticated users only
DROP POLICY IF EXISTS "Anyone can read system_settings" ON public.system_settings;
CREATE POLICY "Authenticated can read system_settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Lock down third-party API key columns on user_configs so the client SDK
-- cannot read or write them directly. Edge functions using SERVICE_ROLE
-- (and SECURITY DEFINER RPCs) still access them normally.
REVOKE SELECT (postforme_api_key, blotato_api_key, anthropic_api_key, unsplash_api_key, pexels_api_key, apify_api_token, firecrawl_api_key, higgsfield_api_id, higgsfield_api_secret) ON public.user_configs FROM anon, authenticated, PUBLIC;
REVOKE UPDATE (postforme_api_key, blotato_api_key, anthropic_api_key, unsplash_api_key, pexels_api_key, apify_api_token, firecrawl_api_key, higgsfield_api_id, higgsfield_api_secret) ON public.user_configs FROM anon, authenticated, PUBLIC;
REVOKE INSERT (postforme_api_key, blotato_api_key, anthropic_api_key, unsplash_api_key, pexels_api_key, apify_api_token, firecrawl_api_key, higgsfield_api_id, higgsfield_api_secret) ON public.user_configs FROM anon, authenticated, PUBLIC;
