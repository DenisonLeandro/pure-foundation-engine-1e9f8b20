-- =====================================================
-- Autopilot v2 — Motor da fila (RPCs de claim/requeue) + reagendamento do cron
-- =====================================================
-- Fila de jobs processada por autopilot-worker; disparo periódico por
-- autopilot-tick (substitui autopilot-cron). O claim usa FOR UPDATE SKIP LOCKED
-- para permitir múltiplos workers concorrentes sem processar o mesmo job 2x.

-- ── 1. Claim atômico de jobs prontos ────────────────────────────────
-- Marca os jobs 'queued' cujo next_attempt_at já passou como 'running'
-- (attempts++), pulando linhas travadas por outro worker. Retorna os jobs
-- reservados para este worker processar.
CREATE OR REPLACE FUNCTION public.autopilot_claim_jobs(_limit int DEFAULT 3)
RETURNS SETOF public.autopilot_jobs
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.autopilot_jobs j
  SET status = 'running', locked_at = now(), attempts = attempts + 1, updated_at = now()
  WHERE j.id IN (
    SELECT id FROM public.autopilot_jobs
    WHERE status = 'queued' AND next_attempt_at <= now()
    ORDER BY next_attempt_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT _limit
  )
  RETURNING j.*;
$$;

-- ── 2. Reaper de jobs "presos" (worker morreu no meio) ──────────────
-- Jobs 'running' há mais de _stuck_seconds voltam à fila (com backoff) ou,
-- se esgotaram as tentativas, viram 'failed' e marcam o post como falho.
CREATE OR REPLACE FUNCTION public.autopilot_requeue_stuck_jobs(_stuck_seconds int DEFAULT 300)
RETURNS int
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _n int;
BEGIN
  WITH stuck AS (
    SELECT id, post_id, attempts, max_attempts
    FROM public.autopilot_jobs
    WHERE status = 'running'
      AND locked_at IS NOT NULL
      AND locked_at < now() - make_interval(secs => _stuck_seconds)
    FOR UPDATE SKIP LOCKED
  ),
  upd AS (
    UPDATE public.autopilot_jobs j SET
      status = CASE WHEN s.attempts >= s.max_attempts THEN 'failed' ELSE 'queued' END,
      next_attempt_at = CASE
        WHEN s.attempts >= s.max_attempts THEN j.next_attempt_at
        ELSE now() + make_interval(secs => least(60 * power(2, s.attempts), 900)::double precision)
      END,
      last_error = 'reaped: stuck em running (worker interrompido)',
      updated_at = now()
    FROM stuck s
    WHERE j.id = s.id
    RETURNING s.post_id, j.status AS new_status
  )
  -- Se o job foi definitivamente pra 'failed', reflete no post.
  , postfail AS (
    UPDATE public.autopilot_posts p SET
      status = 'failed',
      error = 'geração interrompida (job esgotou tentativas)',
      updated_at = now()
    FROM upd
    WHERE upd.post_id = p.id AND upd.new_status = 'failed'
    RETURNING 1
  )
  SELECT count(*) INTO _n FROM upd;
  RETURN COALESCE(_n, 0);
END;
$$;

-- Só o backend (service_role) mexe na fila.
REVOKE ALL ON FUNCTION public.autopilot_claim_jobs(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.autopilot_requeue_stuck_jobs(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.autopilot_claim_jobs(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.autopilot_requeue_stuck_jobs(int) TO service_role;

-- ── 3. Reagendamento do cron: autopilot-tick a cada minuto ──────────
-- IMPORTANTE: a URL é específica do projeto Supabase. Este projeto é
-- `pgimbjfdxwefahxmpdpc` (ver supabase/config.toml). A migration legada do
-- Autopilot v1 apontava para OUTRO projeto (remix antigo) — desagendamos ela.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Desagenda o job legado (v1), se existir.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'autopilot-hourly-check') THEN
    PERFORM cron.unschedule('autopilot-hourly-check');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'autopilot-tick') THEN
    PERFORM cron.unschedule('autopilot-tick');
  END IF;
END $$;

-- Agenda o tick do v2 (1x por minuto). O tick reenfileira jobs presos e
-- invoca o worker; o pg_net dispara o HTTP de forma assíncrona.
select cron.schedule(
  'autopilot-tick',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://pgimbjfdxwefahxmpdpc.supabase.co/functions/v1/autopilot-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
