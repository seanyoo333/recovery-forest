-- health_reports.pdf_path: Private Storage 경로 (signed URL 생성용)
ALTER TABLE "public"."health_reports" ADD COLUMN IF NOT EXISTS "pdf_path" text;
