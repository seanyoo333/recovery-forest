-- Add unique constraint to blood_test_types.standard_name
-- This prevents duplicate standard_name entries

-- First, clean up any existing duplicates
-- Strategy: Update blood_test_results to reference the kept test_id, then delete duplicates

-- Step 1: For each duplicate group, find the test_id to keep (lowest test_id)
-- Step 2: Update blood_test_results to use the kept test_id for all duplicates
-- Step 3: Delete the duplicate records

-- Update blood_test_results: change test_id from duplicate to the one we'll keep
UPDATE blood_test_results btr
SET test_id = (
  SELECT MIN(btt2.test_id)
  FROM blood_test_types btt2
  WHERE LOWER(btt2.standard_name) = LOWER(
    (SELECT standard_name FROM blood_test_types WHERE test_id = btr.test_id)
  )
)
WHERE EXISTS (
  SELECT 1
  FROM blood_test_types btt
  WHERE btt.test_id = btr.test_id
    AND btt.test_id NOT IN (
      SELECT MIN(btt2.test_id)
      FROM blood_test_types btt2
      WHERE LOWER(btt2.standard_name) = LOWER(btt.standard_name)
    )
);

-- Now safe to delete duplicates (keep the one with the lowest test_id)
DELETE FROM blood_test_types
WHERE test_id NOT IN (
  SELECT MIN(test_id)
  FROM blood_test_types
  GROUP BY LOWER(standard_name)
);

-- Add unique constraint on standard_name (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS blood_test_types_standard_name_unique_lower 
ON blood_test_types (LOWER(standard_name));

-- Initialize standard blood test types (insert if not exists)
-- Use NOT EXISTS to check for existing records before inserting
INSERT INTO blood_test_types (standard_name, unit, reference_min, reference_max, clinical_significance, descriptions)
SELECT * FROM (VALUES
  ('lmr', '', NULL, NULL, NULL, '{}'::jsonb),
  ('nlr', '', NULL, NULL, NULL, '{}'::jsonb),
  ('glucose', 'mg/dL', 70, 100, '정상 범위: 70-100 mg/dL', '{}'::jsonb),
  ('hgba1c', '%', 4.0, 5.6, '정상 범위: 4.0-5.6%', '{}'::jsonb),
  ('ldh', 'U/L', 140, 280, '정상 범위: 140-280 U/L', '{}'::jsonb),
  ('crp', 'mg/dL', 0, 0.3, '정상 범위: 0-0.3 mg/dL', '{}'::jsonb),
  ('vitamin_d3', 'ng/mL', 30, 100, '정상 범위: 30-100 ng/mL', '{}'::jsonb),
  ('platelet', '10³/µL', 150, 450, '정상 범위: 150-450 10³/µL', '{}'::jsonb),
  ('ast', 'U/L', 10, 40, '정상 범위: 10-40 U/L', '{}'::jsonb),
  ('alt', 'U/L', 10, 40, '정상 범위: 10-40 U/L', '{}'::jsonb),
  ('egfr', 'mL/min/1.73㎡', 90, NULL, '정상 범위: 90 이상', '{}'::jsonb),
  ('cholesterol', 'mg/dL', NULL, 200, '정상 범위: 200 mg/dL 이하', '{}'::jsonb),
  ('wbc', '10³/µL', 4.0, 10.0, '정상 범위: 4.0-10.0 10³/µL', '{}'::jsonb),
  ('rbc', '10⁶/µL', 4.5, 5.5, '정상 범위: 4.5-5.5 10⁶/µL', '{}'::jsonb),
  ('hgb', 'g/dL', 12.0, 16.0, '정상 범위: 12.0-16.0 g/dL', '{}'::jsonb),
  ('hct', '%', 36, 46, '정상 범위: 36-46%', '{}'::jsonb),
  ('mcv', 'fL', 80, 100, '정상 범위: 80-100 fL', '{}'::jsonb),
  ('mchc', 'g/dL', 32, 36, '정상 범위: 32-36 g/dL', '{}'::jsonb),
  ('rdw', '%', 11.5, 14.5, '정상 범위: 11.5-14.5%', '{}'::jsonb),
  ('pdw', 'fL', NULL, NULL, NULL, '{}'::jsonb),
  ('neutrophil', '%', 50, 70, '정상 범위: 50-70%', '{}'::jsonb),
  ('lymphocyte', '%', 20, 40, '정상 범위: 20-40%', '{"description": "면역반응 관여 백혈구 (T림프구- 세포성 면역, B림프구-체액성면역)", "significance": {"up": ["세균성 상기도 감염", "바이러스 감염", "호르몬 질환", "결핵", "림프성 백혈병"], "down": ["호지킨병", "쿠싱증후군", "부신피질호르몬사용", "외상", "초기 급성 radiation syndrome", "화상", "AIDS", "면역억제제"]}}'::jsonb),
  ('monocyte', '%', 2, 8, '정상 범위: 2-8%', '{}'::jsonb),
  ('eosinophil', '%', 1, 4, '정상 범위: 1-4%', '{}'::jsonb),
  ('basophil', '%', 0, 1, '정상 범위: 0-1%', '{}'::jsonb),
  ('total_bilirubin', 'mg/dL', 0.2, 1.2, '정상 범위: 0.2-1.2 mg/dL', '{}'::jsonb),
  ('gtp', 'U/L', 0, 50, '정상 범위: 0-50 U/L', '{}'::jsonb),
  ('bun', 'mg/dL', 7, 20, '정상 범위: 7-20 mg/dL', '{}'::jsonb),
  ('creatinine', 'mg/dL', 0.6, 1.2, '정상 범위: 0.6-1.2 mg/dL', '{}'::jsonb),
  ('uric_acid', 'mg/dL', 3.5, 7.2, '정상 범위: 3.5-7.2 mg/dL', '{}'::jsonb),
  ('triglyceride', 'mg/dL', NULL, 150, '정상 범위: 150 mg/dL 이하', '{}'::jsonb),
  ('hdl', 'mg/dL', 40, NULL, '정상 범위: 40 mg/dL 이상', '{}'::jsonb),
  ('ldl', 'mg/dL', NULL, 100, '정상 범위: 100 mg/dL 이하', '{}'::jsonb),
  ('free_t3', 'pg/mL', 2.3, 4.2, '정상 범위: 2.3-4.2 pg/mL', '{}'::jsonb),
  ('free_t4', 'ng/dL', 0.9, 1.7, '정상 범위: 0.9-1.7 ng/dL', '{}'::jsonb),
  ('tsh', 'µIU/mL', 0.4, 4.0, '정상 범위: 0.4-4.0 µIU/mL', '{}'::jsonb),
  ('homocysteine', 'µmol/L', NULL, 15, '정상 범위: 15 µmol/L 이하', '{}'::jsonb),
  ('tumor_marker_cea', 'ng/mL', NULL, 3.0, '정상 범위: 3.0 ng/mL 이하', '{}'::jsonb),
  ('tumor_marker_ca199', 'U/mL', NULL, 37, '정상 범위: 37 U/mL 이하', '{}'::jsonb),
  ('tumor_marker_ca125', 'U/mL', NULL, 35, '정상 범위: 35 U/mL 이하', '{}'::jsonb),
  ('tumor_marker_ca153', 'U/mL', NULL, 30, '정상 범위: 30 U/mL 이하', '{}'::jsonb),
  ('tumor_marker_psa', 'ng/mL', NULL, 4.0, '정상 범위: 4.0 ng/mL 이하', '{}'::jsonb),
  ('tumor_marker_afp', 'ng/mL', NULL, 10, '정상 범위: 10 ng/mL 이하', '{}'::jsonb),
  ('tumor_marker_ca724', 'U/mL', NULL, 6.9, '정상 범위: 6.9 U/mL 이하', '{}'::jsonb),
  ('tumor_marker_nse', 'ng/mL', NULL, 16.3, '정상 범위: 16.3 ng/mL 이하', '{}'::jsonb),
  ('tumor_marker_scc', 'ng/mL', NULL, 1.5, '정상 범위: 1.5 ng/mL 이하', '{}'::jsonb)
) AS v(standard_name, unit, reference_min, reference_max, clinical_significance, descriptions)
WHERE NOT EXISTS (
  SELECT 1 FROM blood_test_types btt
  WHERE LOWER(btt.standard_name) = LOWER(v.standard_name)
);

