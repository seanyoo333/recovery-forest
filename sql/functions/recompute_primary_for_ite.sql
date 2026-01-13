CREATE OR REPLACE FUNCTION recompute_primary_for_ite(p_ite_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_best_ites_id uuid;
BEGIN
  -- 후보 중 “best” 하나를 고른다
  SELECT ites.id
  INTO v_best_ites_id
  FROM ingredient_target_evidence_sources ites
  JOIN evidence_sources es ON es.id = ites.evidence_source_id
  WHERE ites.ingredient_target_evidence_id = p_ite_id
  ORDER BY
    COALESCE(ites.extracted_strength_override, es.strength) DESC,
    COALESCE(es.year, 0) DESC,
    study_type_rank(es.study_type) DESC,
    ites.created_at DESC
  LIMIT 1;

  -- 후보가 없으면 primary 전부 false로
  IF v_best_ites_id IS NULL THEN
    UPDATE ingredient_target_evidence_sources
    SET is_primary = false
    WHERE ingredient_target_evidence_id = p_ite_id;

    -- ite도 기본값으로(원하면 NULL 처리)
    UPDATE ingredient_target_evidence
    SET strength = 0, study_type = 'mechanistic', updated_at = now()
    WHERE id = p_ite_id;

    RETURN;
  END IF;

  -- primary 싹 reset
  UPDATE ingredient_target_evidence_sources
  SET is_primary = false
  WHERE ingredient_target_evidence_id = p_ite_id;

  -- best만 primary
  UPDATE ingredient_target_evidence_sources
  SET is_primary = true
  WHERE id = v_best_ites_id;

  -- ite 요약값을 primary 기반으로 업데이트
  UPDATE ingredient_target_evidence ite
  SET
    strength = COALESCE(ites.extracted_strength_override, es.strength),
    study_type = es.study_type,
    updated_at = now()
  FROM ingredient_target_evidence_sources ites
  JOIN evidence_sources es ON es.id = ites.evidence_source_id
  WHERE ite.id = p_ite_id
    AND ites.id = v_best_ites_id;

END;
$$;
