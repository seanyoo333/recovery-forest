-- effect enum에 unclear 추가, ite에 outcome_direction, ites에 outcome_text/dose_info 추가
-- disease_id는 0113에서 diseases 테이블 생성 후 추가 (disease_slug 사용 안 함)

-- 1. effect enum에 'unclear' 추가
ALTER TYPE "public"."ingredient_target_evidence_effect" ADD VALUE IF NOT EXISTS 'unclear';--> statement-breakpoint

-- 2. outcome_direction enum 생성 (논문별 결과 방향: positive/negative/neutral)
DO $$ BEGIN
  CREATE TYPE "public"."outcome_direction_enum" AS ENUM('positive', 'negative', 'neutral');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- 3. ingredient_target_evidence에 outcome_direction 추가
ALTER TABLE "ingredient_target_evidence" ADD COLUMN IF NOT EXISTS "outcome_direction" "public"."outcome_direction_enum";--> statement-breakpoint

-- 4. ingredient_target_evidence_sources에 outcome_text, dose_info 추가 (disease_id는 0113에서)
ALTER TABLE "ingredient_target_evidence_sources" ADD COLUMN IF NOT EXISTS "outcome_text" text;--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence_sources" ADD COLUMN IF NOT EXISTS "dose_info" jsonb;--> statement-breakpoint

-- 5. VIEW 갱신 (outcome_direction 포함)
DROP VIEW IF EXISTS ingredient_target_evidence_full_view;--> statement-breakpoint
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
  ite.effect,
  ite.outcome_direction,
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
  ite.effect,
  ite.outcome_direction,
  ite.strength,
  ite.study_type,
  ite.notes,
  tma.meta_axis,
  tma.axis_weight,
  ite.created_at,
  ite.updated_at;
