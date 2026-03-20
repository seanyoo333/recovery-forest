-- diseases에 synonyms 추가 (같은 암종 다른 명칭 매칭용)
-- evidence_sources에 dose_info_candidates 분리 (candidates 내 dose_info 제거)

-- 1. diseases에 synonyms 컬럼 추가 (text[])
ALTER TABLE "diseases" ADD COLUMN IF NOT EXISTS "synonyms" text[] DEFAULT '{}';--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "diseases_synonyms_gin_idx" ON "diseases" USING gin("synonyms");--> statement-breakpoint

-- 2. evidence_sources에 dose_info_candidates 컬럼 추가 (jsonb)
ALTER TABLE "evidence_sources" ADD COLUMN IF NOT EXISTS "dose_info_candidates" jsonb;--> statement-breakpoint
