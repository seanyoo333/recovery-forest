-- ingredient_target_evidence: effect 컬럼 추가 (inhibit/activate 구분)

CREATE TYPE "public"."ingredient_target_evidence_effect" AS ENUM ('inhibit', 'activate');
--> statement-breakpoint

ALTER TABLE "ingredient_target_evidence"
ADD COLUMN "effect" "ingredient_target_evidence_effect";
--> statement-breakpoint

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
  ite.effect,
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
  ite.strength,
  ite.study_type,
  ite.notes,
  tma.meta_axis,
  tma.axis_weight,
  ite.created_at,
  ite.updated_at;
