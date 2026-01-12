DROP VIEW IF EXISTS routine_daily_scores_view;

CREATE VIEW routine_daily_scores_view
WITH (security_invoker = ON) AS
SELECT
  rdl.user_id,
  rdl.log_date,
  rdl.category,
  COUNT(*) AS record_count,
  COUNT(DISTINCT rdl.time_block) AS time_blocks_count,
  COUNT(DISTINCT rdl.option_id) AS unique_options_count,
  COUNT(DISTINCT rdl.template_id) AS unique_templates_count,
  -- 최신 기록 시간
  MAX(rdl.created_at) AS last_recorded_at
FROM routine_daily_grid_logs rdl
GROUP BY rdl.user_id, rdl.log_date, rdl.category;
