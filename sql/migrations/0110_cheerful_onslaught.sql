-- 이미 0107, 0108, 0109, 0110_profiles 에서 적용된 구문은 제외 (중복 실행 방지)
DO $$ BEGIN
  CREATE TYPE "public"."health_report_pdf_status" AS ENUM('pdf_generating', 'pdf_ready');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TYPE "public"."report_request_status" ADD VALUE IF NOT EXISTS 'failed';--> statement-breakpoint
ALTER TABLE "knowledge_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge_sections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge_vectors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "section_map" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "health_reports" ADD COLUMN IF NOT EXISTS "pdf_path" text;--> statement-breakpoint
ALTER TABLE "health_reports" ADD COLUMN IF NOT EXISTS "pdf_status" "health_report_pdf_status";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_sections_doc_id_section_title_uidx" ON "knowledge_sections" USING btree ("doc_id","section_title");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_username_unique" ON "profiles" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_email_unique" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE POLICY "knowledge-documents-select-policy" ON "knowledge_documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-documents-insert-policy" ON "knowledge_documents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-documents-update-policy" ON "knowledge_documents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
)) WITH CHECK (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-documents-delete-policy" ON "knowledge_documents" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-sections-select-policy" ON "knowledge_sections" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-sections-insert-policy" ON "knowledge_sections" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-sections-update-policy" ON "knowledge_sections" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
)) WITH CHECK (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-sections-delete-policy" ON "knowledge_sections" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-vectors-select-policy" ON "knowledge_vectors" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-vectors-insert-policy" ON "knowledge_vectors" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-vectors-update-policy" ON "knowledge_vectors" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
)) WITH CHECK (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "knowledge-vectors-delete-policy" ON "knowledge_vectors" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "section-map-select-policy" ON "section_map" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "section-map-insert-policy" ON "section_map" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "section-map-update-policy" ON "section_map" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
)) WITH CHECK (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));--> statement-breakpoint
CREATE POLICY "section-map-delete-policy" ON "section_map" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));