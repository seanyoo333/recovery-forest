-- Add 'failed' to report_request_status enum (요청 실패 시 n8n에서 설정)
ALTER TYPE "public"."report_request_status" ADD VALUE IF NOT EXISTS 'failed';
