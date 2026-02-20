-- Add additional columns to evidence_sources table
-- source: 출처 정보
-- cited: 인용 횟수
-- snippet: 논문 요약 스니펫
-- candidates: 성분-표적 후보 배열 (JSON)

ALTER TABLE "evidence_sources" ADD COLUMN "source" text;
--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN "cited" integer;
--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN "snippet" text;
--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN "candidates" jsonb;
--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN "status" text;
--> statement-breakpoint

