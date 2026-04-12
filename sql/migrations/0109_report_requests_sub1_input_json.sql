-- report_requests: n8n 건강리포트 플로우 중간 단계 데이터 저장용 컬럼

ALTER TABLE "report_requests"
ADD COLUMN "sub1_input_json" jsonb;

ALTER TABLE "report_requests"
ADD COLUMN "sub2_input_json" jsonb;
