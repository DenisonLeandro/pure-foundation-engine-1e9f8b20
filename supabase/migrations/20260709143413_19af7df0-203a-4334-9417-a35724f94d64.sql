-- Autopilot v2 cron fix: use Vault token instead of missing supabase.service_role_key GUC
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

DO $$
DECLARE
  _secret_id uuid;
  _token text;
BEGIN
  SELECT id
    INTO _secret_id
    FROM vault.secrets
   WHERE name = 'autopilot_service_key'
   LIMIT 1;

  IF _secret_id IS NULL THEN
    _token := encode(gen_random_bytes(48), 'hex');
    PERFORM vault.create_secret(_token, 'autopilot_service_key');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'autopilot-hourly-check') THEN
    PERFORM cron.unschedule('autopilot-hourly-check');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'autopilot-tick') THEN
    PERFORM cron.unschedule('autopilot-tick');
  END IF;
END $$;

select cron.schedule(
  'autopilot-tick',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://pgimbjfdxwefahxmpdpc.supabase.co/functions/v1/autopilot-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || public.get_vault_secret('autopilot_service_key')
    ),
    body := '{}'::jsonb
  );
  $$
);