-- 1. 기본값 제거 (enum 변경 전 필수)
ALTER TABLE "report_requests" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
-- 2. text로 변환
ALTER TABLE "public"."report_requests" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
-- 3. 기존 enum 삭제
DROP TYPE "public"."report_request_status";--> statement-breakpoint
-- 4. 새 enum 생성
CREATE TYPE "public"."report_request_status" AS ENUM('requested', 'draft_ready', 'under_review', 'completed');--> statement-breakpoint
-- 5. 새 enum으로 변환 (기존 값 매핑)
ALTER TABLE "public"."report_requests" ALTER COLUMN "status" SET DATA TYPE "public"."report_request_status" USING (
  CASE "status"
    WHEN 'queued' THEN 'requested'::"public"."report_request_status"
    WHEN 'running' THEN 'under_review'::"public"."report_request_status"
    WHEN 'done' THEN 'completed'::"public"."report_request_status"
    WHEN 'failed' THEN 'under_review'::"public"."report_request_status"
    ELSE 'requested'::"public"."report_request_status"
  END
);--> statement-breakpoint
-- 6. 기본값 설정
ALTER TABLE "report_requests" ALTER COLUMN "status" SET DEFAULT 'requested'::"public"."report_request_status";