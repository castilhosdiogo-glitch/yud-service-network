-- ============================================================
-- 053_guard_generate_weekly_report.sql
--
-- generate_weekly_report is SECURITY DEFINER and granted to
-- `authenticated`, with no authorization check in its body. Any signed-in
-- user could invoke it.
--
-- Scope of the issue, which is narrower than the 2026-10-05 watchdog
-- report states: the function returns a report id, not the metrics, and
-- weekly_reports is already admin-only through RLS
-- ("weekly_reports_admin_all"). A non-admin could therefore force the
-- aggregation to run and upsert the row, but could not read the result.
-- So this is unauthorized write and compute, not a metrics leak.
--
-- The body below is republished from 041 unchanged; the only addition is
-- the guard. auth.uid() IS NULL is allowed so the pg_cron job, which runs
-- without a JWT, keeps working.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_weekly_report(
  p_week_start DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn_weekly_report$
DECLARE
  v_week_start DATE;
  v_week_end   DATE;
  v_ts_start   TIMESTAMPTZ;
  v_ts_end     TIMESTAMPTZ;
  v_report_id  UUID;
BEGIN
  -- Only an admin may trigger a report. auth.uid() is NULL for the pg_cron
  -- job and for service_role callers, which must keep working.
  IF (SELECT auth.uid()) IS NOT NULL
     AND NOT has_role('admin'::app_role, (SELECT auth.uid())) THEN
    RAISE EXCEPTION 'ADMIN_ROLE_REQUIRED';
  END IF;

  -- Resolve janela da semana.
  -- date_trunc('week', x) retorna segunda 00:00. Se p_week_start
  -- for NULL, pega a segunda da semana passada (7 dias atrás).
  IF p_week_start IS NULL THEN
    v_week_start := (date_trunc('week', now() - INTERVAL '7 days'))::DATE;
  ELSE
    v_week_start := p_week_start;
  END IF;

  v_week_end := v_week_start + INTERVAL '6 days';
  v_ts_start := v_week_start::TIMESTAMPTZ;
  v_ts_end   := (v_week_end + INTERVAL '1 day')::TIMESTAMPTZ;

  -- Upsert num único WITH+INSERT: CTEs agregam tudo e o INSERT
  -- encaixa no weekly_reports. Evita `SELECT ... INTO v_summary`
  -- (editor Supabase interpreta isso como CREATE TABLE AS).
  WITH
  br AS (
    SELECT id, status, city, category_id
    FROM   public.broadcast_requests
    WHERE  created_at >= v_ts_start AND created_at < v_ts_end
  ),
  br_stats AS (
    SELECT
      COUNT(*)::INT                                                     AS total,
      COUNT(*) FILTER (WHERE status = 'accepted')::INT                  AS accepted,
      COUNT(*) FILTER (WHERE status = 'expired')::INT                   AS expired,
      COUNT(*) FILTER (WHERE status = 'cancelled')::INT                 AS cancelled,
      COUNT(*) FILTER (WHERE status = 'no_pros_available')::INT         AS no_pros,
      COUNT(*) FILTER (WHERE status IN ('dispatching','expanding'))::INT AS in_flight
    FROM br
  ),
  resp_times AS (
    SELECT AVG(EXTRACT(EPOCH FROM (rd.responded_at - rd.dispatched_at)) / 60.0) AS avg_min
    FROM   public.request_dispatches rd
    JOIN   br ON br.id = rd.broadcast_id
    WHERE  rd.status = 'accepted'
      AND  rd.responded_at IS NOT NULL
  ),
  by_city_raw AS (
    SELECT br.city,
           COUNT(*)::INT                                        AS total,
           COUNT(*) FILTER (WHERE br.status = 'accepted')::INT  AS accepted
    FROM br GROUP BY br.city
  ),
  by_city_agg AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'city', city, 'total', total, 'accepted', accepted
    )), '[]'::jsonb) AS data
    FROM by_city_raw
  ),
  by_cat_raw AS (
    SELECT br.category_id, c.name AS category_name,
           COUNT(*)::INT                                        AS total,
           COUNT(*) FILTER (WHERE br.status = 'accepted')::INT  AS accepted
    FROM       br
    LEFT JOIN  public.categories c ON c.id = br.category_id
    GROUP BY   br.category_id, c.name
  ),
  by_cat_agg AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'category_id', category_id, 'category_name', category_name,
      'total', total, 'accepted', accepted
    )), '[]'::jsonb) AS data
    FROM by_cat_raw
  ),
  wl_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE notified_at IS NULL)::INT                         AS pending_total,
      COUNT(*) FILTER (WHERE created_at >= v_ts_start
                         AND created_at <  v_ts_end)::INT                      AS added_this_week,
      COUNT(*) FILTER (WHERE notified_at >= v_ts_start
                         AND notified_at <  v_ts_end)::INT                     AS notified_this_week
    FROM public.waiting_list
  ),
  pros_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE COALESCE(pp.disponivel, false) = true
                         AND COALESCE(pp.onboarding_completo, false) = true)::INT AS active_total,
      COUNT(*) FILTER (WHERE pp.created_at >= v_ts_start
                         AND pp.created_at <  v_ts_end)::INT                      AS new_signups_week,
      COUNT(*) FILTER (WHERE pp.onboarding_completo = true
                         AND pp.updated_at >= v_ts_start
                         AND pp.updated_at <  v_ts_end)::INT                      AS onboarded_week
    FROM public.professional_profiles pp
  ),
  demand_stats AS (
    SELECT
      COALESCE(jsonb_agg(jsonb_build_object(
        'category_id',    category_id,
        'category_name',  category_name,
        'city',           city,
        'orders_per_pro', orders_per_pro,
        'active_pros',    active_pros,
        'orders',         orders_this_month
      )) FILTER (WHERE demand_status = 'UNDER_DEMAND'), '[]'::jsonb) AS under_demand,
      COALESCE(jsonb_agg(jsonb_build_object(
        'category_id',    category_id,
        'category_name',  category_name,
        'city',           city,
        'orders_per_pro', orders_per_pro,
        'active_pros',    active_pros,
        'orders',         orders_this_month
      )) FILTER (WHERE demand_status = 'OVER_DEMAND'), '[]'::jsonb) AS over_demand,
      COALESCE(jsonb_agg(jsonb_build_object(
        'category_id',   category_id,
        'category_name', category_name,
        'city',          city,
        'max_slots',     max_professionals
      )) FILTER (WHERE demand_status = 'NO_PROS'), '[]'::jsonb) AS no_pros_slots,
      COUNT(*) FILTER (WHERE demand_status = 'HEALTHY')::INT AS healthy_count
    FROM public.analytics_professional_demand
  )
  INSERT INTO public.weekly_reports (week_start, week_end, summary)
  SELECT
    v_week_start,
    v_week_end,
    jsonb_build_object(
      'broadcasts', jsonb_build_object(
        'total',                 brs.total,
        'accepted',              brs.accepted,
        'expired',               brs.expired,
        'cancelled',             brs.cancelled,
        'no_pros_available',     brs.no_pros,
        'in_flight',             brs.in_flight,
        'accept_rate',           CASE WHEN brs.total > 0
                                      THEN ROUND(brs.accepted::NUMERIC / brs.total * 100, 1)
                                      ELSE 0 END,
        'avg_response_minutes',  COALESCE(ROUND(rt.avg_min::NUMERIC, 1), 0)
      ),
      'by_city',     bca.data,
      'by_category', bcata.data,
      'waiting_list', jsonb_build_object(
        'pending_total',      ws.pending_total,
        'added_this_week',    ws.added_this_week,
        'notified_this_week', ws.notified_this_week
      ),
      'pros', jsonb_build_object(
        'active_total',     ps.active_total,
        'new_signups_week', ps.new_signups_week,
        'onboarded_week',   ps.onboarded_week
      ),
      'supply_health', jsonb_build_object(
        'under_demand',  ds.under_demand,
        'over_demand',   ds.over_demand,
        'no_pros_slots', ds.no_pros_slots,
        'healthy_count', ds.healthy_count
      )
    )
  FROM       br_stats brs
  CROSS JOIN resp_times rt
  CROSS JOIN by_city_agg bca
  CROSS JOIN by_cat_agg bcata
  CROSS JOIN wl_stats ws
  CROSS JOIN pros_stats ps
  CROSS JOIN demand_stats ds
  ON CONFLICT (week_start) DO UPDATE
    SET summary    = EXCLUDED.summary,
        week_end   = EXCLUDED.week_end,
        created_at = now()
  RETURNING id INTO v_report_id;

  RETURN v_report_id;
END;
$fn_weekly_report$;

REVOKE ALL ON FUNCTION public.generate_weekly_report(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_weekly_report(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_weekly_report(DATE) TO service_role;

COMMENT ON FUNCTION public.generate_weekly_report(DATE) IS
  'Aggregates the weekly admin report. Requires an admin caller; the pg_cron job and service_role run without a JWT and are exempt.';
