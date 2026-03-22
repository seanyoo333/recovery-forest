-- 혈액검사 타입 메타데이터 확장 (참고범위 노트, 계산 지표, 근거 ID)
ALTER TABLE blood_test_types
  ADD COLUMN IF NOT EXISTS reference_note text,
  ADD COLUMN IF NOT EXISTS is_derived_metric boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS derived_formula text,
  ADD COLUMN IF NOT EXISTS evidence_source_ids uuid[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN blood_test_types.reference_note IS '기본 참고범위에 대한 주의/설명 (성별·연령·기관별 차이 등)';
COMMENT ON COLUMN blood_test_types.is_derived_metric IS '계산 지표 여부 (예: LMR, NLR)';
COMMENT ON COLUMN blood_test_types.derived_formula IS '계산식 설명 (표시용)';
COMMENT ON COLUMN blood_test_types.evidence_source_ids IS 'evidence_sources.id UUID 배열 (MVP)';

-- descriptions JSON에 interpretation_cautions 키 사용 (스키마 변경 없이 jsonb 확장)

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
  btt.reference_note AS type_reference_note,
  btt.clinical_significance,
  btt.descriptions AS type_descriptions,
  btt.variations AS type_variations,
  btt.is_derived_metric AS type_is_derived_metric,
  btt.derived_formula AS type_derived_formula,
  btt.evidence_source_ids AS type_evidence_source_ids,
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
