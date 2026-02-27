-- routine_daily_full_view: 사용자 생활 루틴 기록을 한눈에 조회
-- n8n Get Row 노드에서 user_id로 한 번에 불러와 AI agent 맞춤 답변에 활용
-- routine_daily_scores_view, ingredient_target_evidence_full_view 등과 동일한 패턴
DROP VIEW IF EXISTS routine_daily_full_view;
--> statement-breakpoint
CREATE VIEW routine_daily_full_view
WITH (security_invoker = ON) AS
SELECT
  rdl.id,
  rdl.user_id,
  rdl.log_date,
  rdl.time_block,
  rdl.category,
  rdl.option_id,
  rdl.template_id,
  rdl.created_at,
  rdl.updated_at,
  rgo.label AS option_label,
  rt.name AS template_name,
  rt.section_type AS template_section_type,
  rt.notes AS template_notes,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'label', ri.label,
        'amount_num', ri.amount_num,
        'amount_unit', ri.amount_unit
      ) ORDER BY ri.sort_order
    )
    FROM routine_items ri
    WHERE ri.template_id = rdl.template_id
  ) AS template_items
FROM routine_daily_grid_logs rdl
LEFT JOIN routine_grid_options rgo ON rdl.option_id = rgo.id
LEFT JOIN routine_templates rt ON rdl.template_id = rt.id;
