-- =====================================================
-- Auto-inherit API keys when creating new company
-- =====================================================
-- Modify handle_new_company() to inherit API keys
-- from creator's first company (if it has any)

CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _creator_id uuid := NEW.created_by;
  _source_keys RECORD;
BEGIN
  -- 1. Add creator as owner in company_members
  -- Use ON CONFLICT to handle edge cases
  INSERT INTO public.company_members (company_id, user_id, role, status)
  VALUES (NEW.id, _creator_id, 'owner', 'active')
  ON CONFLICT (company_id, user_id) DO UPDATE
  SET role = 'owner', status = 'active'
  WHERE company_members.company_id = NEW.id AND company_members.user_id = _creator_id;

  -- 2. Create empty company_configs row for the new company
  INSERT INTO public.company_configs (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;

  -- 3. Try to inherit API keys from creator's first company with keys
  SELECT
    blotato_api_key, postforme_api_key, anthropic_api_key,
    unsplash_api_key, pexels_api_key, apify_api_token,
    firecrawl_api_key, higgsfield_api_id, higgsfield_api_secret
  INTO _source_keys
  FROM public.company_configs cc
  JOIN public.companies c ON c.id = cc.company_id
  WHERE c.created_by = _creator_id
    AND c.id != NEW.id
    AND (
      cc.blotato_api_key IS NOT NULL OR
      cc.postforme_api_key IS NOT NULL OR
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

  -- 4. Copy keys if found
  IF _source_keys IS NOT NULL THEN
    UPDATE public.company_configs
    SET
      blotato_api_key = _source_keys.blotato_api_key,
      postforme_api_key = _source_keys.postforme_api_key,
      anthropic_api_key = _source_keys.anthropic_api_key,
      unsplash_api_key = _source_keys.unsplash_api_key,
      pexels_api_key = _source_keys.pexels_api_key,
      apify_api_token = _source_keys.apify_api_token,
      firecrawl_api_key = _source_keys.firecrawl_api_key,
      higgsfield_api_id = _source_keys.higgsfield_api_id,
      higgsfield_api_secret = _source_keys.higgsfield_api_secret
    WHERE company_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
