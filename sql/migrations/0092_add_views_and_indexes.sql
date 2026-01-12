-- Add views and indexes for performance optimization
-- This migration creates views for common queries and adds indexes for better query performance

-- Step 1: Create routine_daily_scores_view
DROP VIEW IF EXISTS routine_daily_scores_view;
--> statement-breakpoint
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
  MAX(rdl.created_at) AS last_recorded_at
FROM routine_daily_grid_logs rdl
GROUP BY rdl.user_id, rdl.log_date, rdl.category;
--> statement-breakpoint

-- Step 2: Create ingredient_target_evidence_full_view
DROP VIEW IF EXISTS ingredient_target_evidence_full_view;
--> statement-breakpoint
CREATE VIEW ingredient_target_evidence_full_view
WITH (security_invoker = ON) AS
SELECT
  ite.id AS evidence_id,
  ite.ingredient_id,
  ni.display_name AS ingredient_name,
  ni.slug AS ingredient_slug,
  ite.target_id,
  nt.slug AS target_slug,
  nt.display_name AS target_name,
  nt.description AS target_description,
  ite.strength,
  ite.study_type,
  ite.notes AS evidence_notes,
  tma.meta_axis,
  tma.axis_weight,
  COUNT(DISTINCT ites.evidence_source_id) AS evidence_count,
  COUNT(DISTINCT CASE WHEN ites.is_primary = true THEN ites.evidence_source_id END) AS primary_evidence_count,
  ite.created_at AS evidence_created_at,
  ite.updated_at AS evidence_updated_at
FROM ingredient_target_evidence ite
INNER JOIN natural_ingredients ni ON ite.ingredient_id = ni.id
INNER JOIN natural_targets nt ON ite.target_id = nt.id
INNER JOIN target_to_meta_axis tma ON nt.id = tma.target_id
LEFT JOIN ingredient_target_evidence_sources ites ON ite.id = ites.ingredient_target_evidence_id
GROUP BY
  ite.id,
  ite.ingredient_id,
  ni.display_name,
  ni.slug,
  ite.target_id,
  nt.slug,
  nt.display_name,
  nt.description,
  ite.strength,
  ite.study_type,
  ite.notes,
  tma.meta_axis,
  tma.axis_weight,
  ite.created_at,
  ite.updated_at;
--> statement-breakpoint

-- Step 3: Create blood_test_results_summary_view
DROP VIEW IF EXISTS blood_test_results_summary_view;
--> statement-breakpoint
CREATE VIEW blood_test_results_summary_view
WITH (security_invoker = ON) AS
SELECT DISTINCT ON (btr.patient_id, btr.test_id, btr.test_date)
  btr.patient_id,
  btr.test_id,
  btr.test_date,
  btr.result_id,
  btr.result_value,
  btr.result_unit,
  btr.confidence,
  btr.image_id,
  btr.notes,
  btt.standard_name,
  btt.unit AS type_unit,
  btt.reference_min,
  btt.reference_max,
  btt.clinical_significance,
  btt.descriptions AS type_descriptions,
  btt.variations AS type_variations,
  CASE
    WHEN btt.reference_min IS NOT NULL AND btr.result_value < btt.reference_min THEN true
    WHEN btt.reference_max IS NOT NULL AND btr.result_value > btt.reference_max THEN true
    ELSE false
  END AS is_out_of_range,
  btr.created_at AS result_created_at,
  btr.updated_at AS result_updated_at
FROM blood_test_results btr
INNER JOIN blood_test_types btt ON btr.test_id = btt.test_id
ORDER BY btr.patient_id, btr.test_id, btr.test_date DESC, btr.result_id DESC;
--> statement-breakpoint

-- Step 4: Add indexes for routine_daily_grid_logs
CREATE INDEX IF NOT EXISTS idx_routine_daily_grid_logs_user_date ON routine_daily_grid_logs(user_id, log_date DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_routine_daily_grid_logs_user_category_date ON routine_daily_grid_logs(user_id, category, log_date DESC);
--> statement-breakpoint

-- Step 5: Add indexes for ingredient_target_evidence
CREATE INDEX IF NOT EXISTS idx_ingredient_target_evidence_ingredient ON ingredient_target_evidence(ingredient_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ingredient_target_evidence_target ON ingredient_target_evidence(target_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ingredient_target_evidence_study_type ON ingredient_target_evidence(study_type);
--> statement-breakpoint

-- Step 6: Add indexes for blood_test_results
CREATE INDEX IF NOT EXISTS idx_blood_test_results_patient_date ON blood_test_results(patient_id, test_date DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_blood_test_results_patient_test_date ON blood_test_results(patient_id, test_id, test_date DESC);
--> statement-breakpoint

-- Step 7: Add indexes for routine_templates (for sorting)
CREATE INDEX IF NOT EXISTS idx_routine_templates_user_sort ON routine_templates(user_id, sort_order ASC, created_at DESC);
--> statement-breakpoint

-- Step 8: Add indexes for routine_items (for template queries)
CREATE INDEX IF NOT EXISTS idx_routine_items_template_sort ON routine_items(template_id, sort_order ASC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_routine_items_ingredient ON routine_items(ingredient_id) WHERE ingredient_id IS NOT NULL;
