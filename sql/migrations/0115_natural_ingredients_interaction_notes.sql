-- natural_ingredients에 interaction_notes 추가 (성분 간 상호작용: 시너지, 상쇄 등)
-- safety_notes: 이 성분 단독 주의사항 / interaction_notes: 다른 성분·약물과의 상호작용

ALTER TABLE "natural_ingredients" ADD COLUMN IF NOT EXISTS "interaction_notes" text DEFAULT '';
