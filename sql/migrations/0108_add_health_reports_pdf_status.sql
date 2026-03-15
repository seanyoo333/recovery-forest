-- health_reports.pdf_status: PDF 생성 상태 (pdf_generating → pdf_ready)
CREATE TYPE "public"."health_report_pdf_status" AS ENUM('pdf_generating', 'pdf_ready');--> statement-breakpoint
ALTER TABLE "public"."health_reports" ADD COLUMN "pdf_status" "health_report_pdf_status";
