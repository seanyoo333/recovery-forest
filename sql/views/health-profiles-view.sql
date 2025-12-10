CREATE OR REPLACE VIEW health_profiles_view
WITH (security_invoker = ON) AS
SELECT
  -- Blood Test Result 정보
  btr.result_id,
  btr.patient_id,
  btr.test_id,
  btr.image_id,
  btr.result_value,
  btr.confidence,
  btr.result_unit,
  btr.test_date,
  btr.notes,
  btr.created_at AS result_created_at,
  btr.updated_at AS result_updated_at,
  -- Blood Test Type 정보
  btt.standard_name,
  btt.unit AS type_unit,
  btt.reference_min,
  btt.reference_max,
  btt.clinical_significance,
  btt.variations AS type_variations,
  -- Blood Test Image 정보
  bti.image_hash,
  bti.image_url,
  bti.test_date AS image_test_date,
  bti.created_at AS image_created_at,
  -- Patient Health Profile 정보
  php.age,
  php.gender,
  php.disease,
  php.disease_status,
  php.treatment_status,
  php.medication_status,
  php.medication_name,
  php.height_cm,
  php.weight_kg,
  php.created_at AS profile_created_at,
  php.updated_at AS profile_updated_at,
  -- Profile 기본 정보
  p.name AS patient_name,
  p.avatar AS patient_avatar,
  p.email AS patient_email,
  p.username AS patient_username,
  -- Reference 범위 체크 (값이 범위 밖인지 확인)
  CASE
    WHEN btt.reference_min IS NOT NULL AND btr.result_value < btt.reference_min THEN true
    WHEN btt.reference_max IS NOT NULL AND btr.result_value > btt.reference_max THEN true
    ELSE false
  END AS is_out_of_range,
  -- BMI 계산 (height_cm와 weight_kg가 있으면)
  CASE
    WHEN php.height_cm IS NOT NULL AND php.height_cm > 0 AND php.weight_kg IS NOT NULL THEN
      ROUND(php.weight_kg / POWER(php.height_cm / 100.0, 2), 1)
    ELSE NULL
  END AS bmi
FROM blood_test_results btr
INNER JOIN blood_test_types btt ON btr.test_id = btt.test_id
LEFT JOIN blood_test_images bti ON btr.image_id = bti.image_id
LEFT JOIN patient_health_profiles php ON btr.patient_id = php.patient_id
LEFT JOIN profiles p ON php.patient_id = p.profile_id;

