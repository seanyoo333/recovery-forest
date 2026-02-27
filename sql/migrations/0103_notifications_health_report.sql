ALTER TYPE "public"."notification_type" ADD VALUE 'health_report';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "report_request_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "content" text;