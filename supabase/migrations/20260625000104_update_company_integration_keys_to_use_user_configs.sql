-- =====================================================
-- Update update_company_integration_keys to use user_configs
-- =====================================================
-- Since API keys are now stored in user_configs (not company_configs),
-- update this function to write to user_configs instead

CREATE OR REPLACE FUNCTION public.update_company_integration_keys(
  _company_id uuid,
  _patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _role text;
  _key text;
  _val jsonb;
  _str text;
  _col text;
  _set_parts text[] := ARRAY[]::text[];
  _params text[] := ARRAY[]::text[];
  _alias text;
  _allowed jsonb := jsonb_build_object(
    'postforme_api_key',     'postforme_api_key',
    'postformeApiKey',       'postforme_api_key',
    'blotato_api_key',       'blotato_api_key',
    'blotatoApiKey',         'blotato_api_key',
    'pexels_api_key',        'pexels_api_key',
    'pexelsApiKey',          'pexels_api_key',
    'apify_api_token',       'apify_api_token',
    'apifyApiToken',         'apify_api_token',
    'firecrawl_api_key',     'firecrawl_api_key',
    'firecrawlApiKey',       'firecrawl_api_key',
    'higgsfield_api_id',     'higgsfield_api_id',
    'higgsfieldApiId',       'higgsfield_api_id',
    'higgsfield_api_secret', 'higgsfield_api_secret',
    'higgsfieldApiSecret',   'higgsfield_api_secret'
  );
  _normalized jsonb := '{}'::jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_company_member(_company_id, _uid) THEN
    RAISE EXCEPTION 'not a member of company' USING ERRCODE = '42501';
  END IF;

  SELECT public.get_company_role(_company_id, _uid) INTO _role;
  IF _role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'insufficient role: % (owner/admin required)', coalesce(_role,'none') USING ERRCODE = '42501';
  END IF;

  IF _patch IS NULL OR jsonb_typeof(_patch) <> 'object' THEN
    RAISE EXCEPTION 'patch must be a JSON object' USING ERRCODE = '22023';
  END IF;

  -- Validate keys and normalize to snake_case column names.
  FOR _key, _val IN SELECT * FROM jsonb_each(_patch) LOOP
    _alias := _allowed ->> _key;
    IF _alias IS NULL THEN
      RAISE EXCEPTION 'unknown field: %', _key USING ERRCODE = '22023';
    END IF;
    _normalized := _normalized || jsonb_build_object(_alias, _val);
  END LOOP;

  IF _normalized = '{}'::jsonb THEN
    -- nothing to do
    RETURN jsonb_build_object('success', true, 'updated', false);
  END IF;

  -- Ensure row exists in user_configs (idempotent insert).
  INSERT INTO public.user_configs (user_id)
  VALUES (_uid)
  ON CONFLICT (user_id) DO NOTHING;

  -- Build dynamic UPDATE only for present fields.
  FOR _key, _val IN SELECT * FROM jsonb_each(_normalized) LOOP
    _col := _key;
    IF jsonb_typeof(_val) = 'null' THEN
      _set_parts := _set_parts || format('%I = NULL', _col);
    ELSIF jsonb_typeof(_val) = 'string' THEN
      _str := _val #>> '{}';
      IF _str IS NULL OR btrim(_str) = '' THEN
        _set_parts := _set_parts || format('%I = NULL', _col);
      ELSE
        _set_parts := _set_parts || format('%I = %L', _col, btrim(_str));
      END IF;
    ELSE
      RAISE EXCEPTION 'field % must be string or null', _col USING ERRCODE = '22023';
    END IF;
  END LOOP;

  _set_parts := _set_parts || 'updated_at = now()';

  EXECUTE format(
    'UPDATE public.user_configs SET %s WHERE user_id = %L',
    array_to_string(_set_parts, ', '),
    _uid
  );

  RETURN jsonb_build_object('success', true, 'updated', true);
END;
$$;

REVOKE ALL ON FUNCTION public.update_company_integration_keys(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_company_integration_keys(uuid, jsonb) TO authenticated;
