-- 건강 리포트 요청: 워크플로 진행 단계·오류·재시도 (status enum 유지)
-- updated_at 컬럼은 기존 테이블에 있음 — 자동화 UPDATE 시 갱신용 트리거 추가

ALTER TABLE "report_requests"
  ADD COLUMN IF NOT EXISTS "current_step" text,
  ADD COLUMN IF NOT EXISTS "last_error_message" text,
  ADD COLUMN IF NOT EXISTS "retry_count" integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN "report_requests"."current_step" IS '메인 플로우 단계 식별자 (예: sub1_health, sub2_health, sub3_health)';
COMMENT ON COLUMN "report_requests"."last_error_message" IS '실패/검수 시 운영자용 마지막 오류 메시지';
COMMENT ON COLUMN "report_requests"."retry_count" IS '워크플로 재시도 횟수';

CREATE OR REPLACE FUNCTION public.report_requests_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS report_requests_touch_updated_at ON public.report_requests;
CREATE TRIGGER report_requests_touch_updated_at
  BEFORE UPDATE ON public.report_requests
  FOR EACH ROW
  EXECUTE PROCEDURE public.report_requests_touch_updated_at();
