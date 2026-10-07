-- ============================================================
-- 050_fix_dispatch_response_authorization.sql
--
-- handle_dispatch_response is SECURITY DEFINER and granted to
-- `authenticated`, but it never checked who the caller was: it read
-- professional_id from the dispatch row, not from the session. Any
-- authenticated user holding a dispatch UUID could accept or decline a
-- job on another professional's behalf, which also cancels every
-- competing dispatch and creates the service_requests row.
--
-- This migration republishes the function body from 010 unchanged, plus:
--   1. p_response is validated against the two values the flow expects;
--   2. an authenticated caller must be the professional who owns the
--      dispatch.
--
-- auth.uid() IS NULL is still allowed so server-side/service_role callers
-- (schedulers, edge functions) keep working. anon cannot reach this
-- function: EXECUTE is granted to `authenticated` only.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_dispatch_response(
  p_dispatch_id UUID,
  p_response    TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispatch              RECORD;
  v_broadcast             RECORD;
  v_config                RECORD;
  v_resp_minutes          NUMERIC;
  v_old_total_accepted    INT;
  v_old_total_declined    INT;
  v_old_total_dispatched  INT;
  v_old_avg_response      NUMERIC;
  v_new_avg_response      NUMERIC;
  v_new_acceptance_rate   NUMERIC;
BEGIN
  -- status has a CHECK constraint, so an unexpected value would fail late and
  -- partially. Reject anything outside the two answers this flow defines.
  IF p_response IS NULL OR p_response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'INVALID_DISPATCH_RESPONSE';
  END IF;

  SELECT * INTO v_dispatch
  FROM request_dispatches
  WHERE id = p_dispatch_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispatch not found or already responded';
  END IF;

  -- A dispatch belongs to exactly one professional. An authenticated caller
  -- may only answer their own. auth.uid() is NULL for service_role/server
  -- callers, which keeps schedulers and edge functions working; anon never
  -- reaches this function because EXECUTE is granted to authenticated only.
  IF auth.uid() IS NOT NULL AND auth.uid() <> v_dispatch.professional_id THEN
    RAISE EXCEPTION 'DISPATCH_OWNER_REQUIRED';
  END IF;

  SELECT * INTO v_broadcast
  FROM broadcast_requests
  WHERE id = v_dispatch.broadcast_id
  FOR UPDATE;

  SELECT * INTO v_config FROM matching_config WHERE id = 'default';

  v_resp_minutes := EXTRACT(EPOCH FROM (NOW() - v_dispatch.dispatched_at)) / 60.0;

  SELECT
    total_accepted,
    total_declined,
    total_dispatched,
    avg_response_minutes
  INTO
    v_old_total_accepted,
    v_old_total_declined,
    v_old_total_dispatched,
    v_old_avg_response
  FROM professional_metrics
  WHERE user_id = v_dispatch.professional_id
  FOR UPDATE;

  UPDATE request_dispatches SET
    status       = p_response,
    responded_at = NOW()
  WHERE id = p_dispatch_id;

  IF p_response = 'accepted' THEN
    UPDATE request_dispatches SET
      status = 'cancelled'
    WHERE broadcast_id = v_dispatch.broadcast_id
      AND id != p_dispatch_id
      AND status = 'pending';

    UPDATE broadcast_requests SET
      status                    = 'accepted',
      accepted_professional_id  = v_dispatch.professional_id
    WHERE id = v_dispatch.broadcast_id;

    INSERT INTO service_requests (client_id, professional_id, description, status)
    SELECT
      b.client_id,
      v_dispatch.professional_id,
      b.description,
      'accepted'
    FROM broadcast_requests b
    WHERE b.id = v_dispatch.broadcast_id;

  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM request_dispatches
      WHERE broadcast_id = v_dispatch.broadcast_id
        AND round = v_dispatch.round
        AND status = 'pending'
    ) THEN
      UPDATE broadcast_requests SET status = 'expanding'
      WHERE id = v_dispatch.broadcast_id AND status = 'dispatching';
    END IF;
  END IF;

  IF p_response = 'accepted' AND v_old_total_dispatched IS NOT NULL THEN
    v_new_avg_response := CASE
      WHEN v_old_total_dispatched = 0 THEN v_resp_minutes
      ELSE (v_old_avg_response * v_old_total_dispatched + v_resp_minutes)
           / (v_old_total_dispatched + 1)
    END;
  ELSE
    v_new_avg_response := v_old_avg_response;
  END IF;

  DECLARE
    v_new_accepted INT := v_old_total_accepted + (p_response = 'accepted')::INT;
    v_new_declined INT := v_old_total_declined + (p_response = 'declined')::INT;
  BEGIN
    v_new_acceptance_rate := v_new_accepted::NUMERIC
                             / NULLIF(v_new_accepted + v_new_declined, 0);
  END;

  UPDATE professional_metrics SET
    total_dispatched     = COALESCE(v_old_total_dispatched, 0) + 1,
    total_accepted       = COALESCE(v_old_total_accepted, 0)  + (p_response = 'accepted')::INT,
    total_declined       = COALESCE(v_old_total_declined, 0)  + (p_response = 'declined')::INT,
    avg_response_minutes = COALESCE(v_new_avg_response, avg_response_minutes),
    acceptance_rate      = COALESCE(v_new_acceptance_rate, acceptance_rate),
    concurrent_active    = CASE
                             WHEN p_response = 'accepted'
                             THEN COALESCE(concurrent_active, 0) + 1
                             ELSE concurrent_active
                           END,
    last_dispatched_at   = NOW(),
    updated_at           = NOW()
  WHERE user_id = v_dispatch.professional_id;
END;
$$;

-- CREATE OR REPLACE keeps existing grants; these are restated so the intent is
-- explicit and the migration is safe to re-run. Deliberately additive: no
-- blanket REVOKE FROM PUBLIC, which could strip access service_role inherits.
REVOKE EXECUTE ON FUNCTION public.handle_dispatch_response(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.handle_dispatch_response(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_dispatch_response(UUID, TEXT) TO service_role;

COMMENT ON FUNCTION public.handle_dispatch_response(UUID, TEXT) IS
  'Answers one pending dispatch. The authenticated caller must own the dispatch; server/service_role callers are exempt. Validates p_response before any write.';
