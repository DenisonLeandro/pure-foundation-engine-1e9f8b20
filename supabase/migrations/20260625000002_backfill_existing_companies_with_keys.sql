-- =====================================================
-- Backfill existing companies with inherited keys
-- =====================================================
-- For each user with multiple companies, copy keys from their
-- first company (that has keys) to all other companies that don't have keys yet.

DO $$
DECLARE
  _user_id uuid;
  _source_config public.company_configs;
  _target_company_id uuid;
  _updated_count int := 0;
BEGIN
  -- For each user that has multiple companies
  FOR _user_id IN
    SELECT DISTINCT created_by
    FROM public.companies
    GROUP BY created_by
    HAVING COUNT(*) > 1
  LOOP
    -- Find the source company (first one with any API keys)
    SELECT cc.* INTO _source_config
    FROM public.company_configs cc
    JOIN public.companies c ON c.id = cc.company_id
    WHERE c.created_by = _user_id
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
      )
    ORDER BY c.created_at ASC
    LIMIT 1;

    -- If we found a source, copy to all other companies
    IF _source_config.id IS NOT NULL THEN
      FOR _target_company_id IN
        SELECT c.id
        FROM public.companies c
        WHERE c.created_by = _user_id
          AND c.id != _source_config.company_id
      LOOP
        UPDATE public.company_configs
        SET
          postforme_api_key = COALESCE(postforme_api_key, _source_config.postforme_api_key),
          blotato_api_key = COALESCE(blotato_api_key, _source_config.blotato_api_key),
          anthropic_api_key = COALESCE(anthropic_api_key, _source_config.anthropic_api_key),
          unsplash_api_key = COALESCE(unsplash_api_key, _source_config.unsplash_api_key),
          pexels_api_key = COALESCE(pexels_api_key, _source_config.pexels_api_key),
          apify_api_token = COALESCE(apify_api_token, _source_config.apify_api_token),
          firecrawl_api_key = COALESCE(firecrawl_api_key, _source_config.firecrawl_api_key),
          higgsfield_api_id = COALESCE(higgsfield_api_id, _source_config.higgsfield_api_id),
          higgsfield_api_secret = COALESCE(higgsfield_api_secret, _source_config.higgsfield_api_secret)
        WHERE company_id = _target_company_id;
        _updated_count := _updated_count + 1;
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE '[backfill] Inherited API keys to % company configs', _updated_count;
END;
$$;
