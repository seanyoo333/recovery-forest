CREATE TYPE "public"."grid_option_kind" AS ENUM('preset', 'template');--> statement-breakpoint
CREATE TYPE "public"."habit_category" AS ENUM('exercise', 'sleep', 'supplement', 'diet', 'therapy');--> statement-breakpoint
CREATE TYPE "public"."habit_time_block" AS ENUM('am', 'noon', 'pm', 'bed');--> statement-breakpoint
CREATE TABLE "daily_grid_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"time_block" "habit_time_block" NOT NULL,
	"category" "habit_category" NOT NULL,
	"option_id" uuid,
	"template_id" uuid,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_grid_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "grid_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "habit_category" NOT NULL,
	"label" text NOT NULL,
	"kind" "grid_option_kind" NOT NULL,
	"template_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grid_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "section_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"amount_num" double precision,
	"amount_unit" text,
	"meta" jsonb,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "section_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "section_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"section_type" "habit_category" NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "section_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_grid_logs" ADD CONSTRAINT "daily_grid_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_grid_logs" ADD CONSTRAINT "daily_grid_logs_option_id_grid_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."grid_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_grid_logs" ADD CONSTRAINT "daily_grid_logs_template_id_section_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."section_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_options" ADD CONSTRAINT "grid_options_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_options" ADD CONSTRAINT "grid_options_template_id_section_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."section_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_items" ADD CONSTRAINT "section_items_template_id_section_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."section_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_templates" ADD CONSTRAINT "section_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_grid_logs_unique_idx" ON "daily_grid_logs" USING btree ("user_id","log_date","time_block","category");--> statement-breakpoint
CREATE UNIQUE INDEX "grid_options_user_category_active_idx" ON "grid_options" USING btree ("user_id","category","is_active","sort_order");--> statement-breakpoint
CREATE POLICY "daily-grid-logs-select" ON "daily_grid_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "daily_grid_logs"."user_id");--> statement-breakpoint
CREATE POLICY "daily-grid-logs-insert" ON "daily_grid_logs" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "daily_grid_logs"."user_id");--> statement-breakpoint
CREATE POLICY "daily-grid-logs-update" ON "daily_grid_logs" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "daily_grid_logs"."user_id") WITH CHECK ((select auth.uid()) = "daily_grid_logs"."user_id");--> statement-breakpoint
CREATE POLICY "daily-grid-logs-delete" ON "daily_grid_logs" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "daily_grid_logs"."user_id");--> statement-breakpoint
CREATE POLICY "grid-options-select" ON "grid_options" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "grid_options"."user_id");--> statement-breakpoint
CREATE POLICY "grid-options-insert" ON "grid_options" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "grid_options"."user_id");--> statement-breakpoint
CREATE POLICY "grid-options-update" ON "grid_options" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "grid_options"."user_id") WITH CHECK ((select auth.uid()) = "grid_options"."user_id");--> statement-breakpoint
CREATE POLICY "grid-options-delete" ON "grid_options" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "grid_options"."user_id");--> statement-breakpoint
CREATE POLICY "section-items-select" ON "section_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM section_templates
        WHERE section_templates.id = "section_items"."template_id"
        AND section_templates.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "section-items-insert" ON "section_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM section_templates
        WHERE section_templates.id = "section_items"."template_id"
        AND section_templates.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "section-items-update" ON "section_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM section_templates
        WHERE section_templates.id = "section_items"."template_id"
        AND section_templates.user_id = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM section_templates
        WHERE section_templates.id = "section_items"."template_id"
        AND section_templates.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "section-items-delete" ON "section_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM section_templates
        WHERE section_templates.id = "section_items"."template_id"
        AND section_templates.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "section-templates-select" ON "section_templates" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "section_templates"."user_id");--> statement-breakpoint
CREATE POLICY "section-templates-insert" ON "section_templates" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "section_templates"."user_id");--> statement-breakpoint
CREATE POLICY "section-templates-update" ON "section_templates" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "section_templates"."user_id") WITH CHECK ((select auth.uid()) = "section_templates"."user_id");--> statement-breakpoint
CREATE POLICY "section-templates-delete" ON "section_templates" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "section_templates"."user_id");