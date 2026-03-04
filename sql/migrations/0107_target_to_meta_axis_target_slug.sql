-- target_to_meta_axis: target_slug 컬럼 추가 (natural_targets.slug 디노말라이즈)
-- 쿼리 시 JOIN 없이 target 식별에 활용

ALTER TABLE "target_to_meta_axis"
ADD COLUMN "target_slug" text;

-- 기존 데이터: natural_targets와 조인하여 slug 채우기
UPDATE "target_to_meta_axis" tma
SET "target_slug" = nt.slug
FROM "natural_targets" nt
WHERE tma.target_id = nt.id;
