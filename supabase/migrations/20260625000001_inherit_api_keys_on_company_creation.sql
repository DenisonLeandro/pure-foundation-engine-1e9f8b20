-- =====================================================
-- Auto-inherit API keys when creating new company
-- =====================================================
-- When a user creates a new company, it will automatically inherit
-- API keys from their first existing company (if it has any).
-- This ensures all companies share the same API credentials by default.

CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _creator_id uuid := NEW.created_by;
  _source_config public.company_configs;
BEGIN
  -- 1. Add creator as owner in company_members
  INSERT INTO public.company_members (company_id, user_id, role, status)
  VALUES (NEW.id, _creator_id, 'owner', 'active');

  -- 2. Create empty company_configs row for the new company
  INSERT INTO public.company_configs (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;

  -- 3. Try to inherit API keys from the creator's first company
  --    (the one with the earliest created_at that has non-null keys)
  SELECT cc.* INTO _source_config
  FROM public.company_configs cc
  JOIN public.companies c ON c.id = cc.company_id
  WHERE c.created_by = _creator_id
    AND c.id != NEW.id  -- Don't copy from itself
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

  -- 4. If found a source company with keys, copy them to new company
  IF _source_config.id IS NOT NULL THEN
    UPDATE public.company_configs
    SET
      postforme_api_key = _source_config.postforme_api_key,
      blotato_api_key = _source_config.blotato_api_key,
      anthropic_api_key = _source_config.anthropic_api_key,
      unsplash_api_key = _source_config.unsplash_api_key,
      pexels_api_key = _source_config.pexels_api_key,
      apify_api_token = _source_config.apify_api_token,
      firecrawl_api_key = _source_config.firecrawl_api_key,
      higgsfield_api_id = _source_config.higgsfield_api_id,
      higgsfield_api_secret = _source_config.higgsfield_api_secret
    WHERE company_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
