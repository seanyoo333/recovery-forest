CREATE TYPE "public"."report_request_status" AS ENUM('queued', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "health_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"report_json" jsonb,
	"report_html" text,
	"pdf_url" text,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "report_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "report_request_status" DEFAULT 'queued' NOT NULL,
	"input_json" jsonb NOT NULL,
	"snapshot_json" jsonb,
	"report_type" text DEFAULT 'v1',
	"paid_status" text DEFAULT 'free',
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "health_reports" ADD CONSTRAINT "health_reports_request_id_report_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."report_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_reports" ADD CONSTRAINT "health_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_requests" ADD CONSTRAINT "report_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "health_reports_request_id_unique" ON "health_reports" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "health_reports_user_id_idx" ON "health_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "report_requests_user_id_idx" ON "report_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "report_requests_status_idx" ON "report_requests" USING btree ("status");--> statement-breakpoint
CREATE POLICY "health-reports-select-policy" ON "health_reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "health_reports"."user_id");--> statement-breakpoint
CREATE POLICY "health-reports-insert-policy" ON "health_reports" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "health_reports"."user_id");--> statement-breakpoint
CREATE POLICY "health-reports-update-policy" ON "health_reports" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "health_reports"."user_id") WITH CHECK ((select auth.uid()) = "health_reports"."user_id");--> statement-breakpoint
CREATE POLICY "health-reports-delete-policy" ON "health_reports" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "health_reports"."user_id");--> statement-breakpoint
CREATE POLICY "report-requests-select-policy" ON "report_requests" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "report_requests"."user_id");--> statement-breakpoint
CREATE POLICY "report-requests-insert-policy" ON "report_requests" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "report_requests"."user_id");--> statement-breakpoint
CREATE POLICY "report-requests-update-policy" ON "report_requests" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "report_requests"."user_id") WITH CHECK ((select auth.uid()) = "report_requests"."user_id");--> statement-breakpoint
CREATE POLICY "report-requests-delete-policy" ON "report_requests" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "report_requests"."user_id");