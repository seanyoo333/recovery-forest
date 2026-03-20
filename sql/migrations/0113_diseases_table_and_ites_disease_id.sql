-- diseases 정규화 테이블 추가, ites에 disease_id FK 적용
-- evidence 흐름: n8n 추출 → evidence_sources.candidates → 인간 검수 → ite/ites 연결
-- disease_slug 텍스트 산재 방지 (breast cancer, breast_cancer, HER2+ 등 통일)

-- 1. diseases 테이블 (정규화된 암/질병 유형, synonyms는 0114에서 추가)
CREATE TABLE IF NOT EXISTS "diseases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "parent_id" uuid REFERENCES "diseases"("id") ON DELETE SET NULL,
  "disease_group" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "diseases_slug_idx" ON "diseases"("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "diseases_parent_id_idx" ON "diseases"("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "diseases_disease_group_idx" ON "diseases"("disease_group");--> statement-breakpoint

-- 2. ingredient_target_evidence_sources에 disease_id 추가 (diseases FK)
ALTER TABLE "ingredient_target_evidence_sources" ADD COLUMN IF NOT EXISTS "disease_id" uuid REFERENCES "diseases"("id") ON DELETE SET NULL;--> statement-breakpoint

-- 2b. disease_slug 제거 (이전 0112에서 추가된 경우 백워드 호환)
ALTER TABLE "ingredient_target_evidence_sources" DROP COLUMN IF EXISTS "disease_slug";--> statement-breakpoint

-- 3. RLS 정책: diseases는 공개 조회
ALTER TABLE "diseases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "diseases-select-policy" ON "diseases";--> statement-breakpoint
CREATE POLICY "diseases-select-policy" ON "diseases" FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "diseases-insert-policy" ON "diseases";--> statement-breakpoint
CREATE POLICY "diseases-insert-policy" ON "diseases" FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM admin_permissions WHERE admin_id = auth.uid() AND admin_role IN ('super_admin', 'content_admin') AND is_active = true)
);--> statement-breakpoint
DROP POLICY IF EXISTS "diseases-update-policy" ON "diseases";--> statement-breakpoint
CREATE POLICY "diseases-update-policy" ON "diseases" FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM admin_permissions WHERE admin_id = auth.uid() AND admin_role IN ('super_admin', 'content_admin') AND is_active = true)
);--> statement-breakpoint
DROP POLICY IF EXISTS "diseases-delete-policy" ON "diseases";--> statement-breakpoint
CREATE POLICY "diseases-delete-policy" ON "diseases" FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM admin_permissions WHERE admin_id = auth.uid() AND admin_role IN ('super_admin', 'content_admin') AND is_active = true)
);
