DROP VIEW IF EXISTS blood_test_results_summary_view;

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
  -- Reference 범위 체크
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
