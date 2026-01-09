ALTER TABLE "daily_grid_logs" RENAME TO "routine_daily_grid_logs";--> statement-breakpoint
ALTER TABLE "grid_option_ingredients" RENAME TO "routine_grid_option_ingredients";--> statement-breakpoint
ALTER TABLE "grid_options" RENAME TO "routine_grid_options";--> statement-breakpoint
ALTER TABLE "section_items" RENAME TO "routine_items";--> statement-breakpoint
ALTER TABLE "section_templates" RENAME TO "routine_templates";--> statement-breakpoint
ALTER TABLE "routine_daily_grid_logs" DROP CONSTRAINT "daily_grid_logs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_daily_grid_logs" DROP CONSTRAINT "daily_grid_logs_option_id_grid_options_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_daily_grid_logs" DROP CONSTRAINT "daily_grid_logs_template_id_section_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_grid_option_ingredients" DROP CONSTRAINT "grid_option_ingredients_grid_option_id_grid_options_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_grid_option_ingredients" DROP CONSTRAINT "grid_option_ingredients_ingredient_id_natural_ingredients_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_grid_options" DROP CONSTRAINT "grid_options_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_grid_options" DROP CONSTRAINT "grid_options_template_id_section_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_items" DROP CONSTRAINT "section_items_template_id_section_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_items" DROP CONSTRAINT "section_items_ingredient_id_natural_ingredients_id_fk";
--> statement-breakpoint
ALTER TABLE "routine_templates" DROP CONSTRAINT "section_templates_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "daily_grid_logs_unique_idx";--> statement-breakpoint
DROP INDEX "grid_option_ingredients_unique_idx";--> statement-breakpoint
ALTER TABLE "routine_templates" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "routine_daily_grid_logs" ADD CONSTRAINT "routine_daily_grid_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_daily_grid_logs" ADD CONSTRAINT "routine_daily_grid_logs_option_id_routine_grid_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."routine_grid_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_daily_grid_logs" ADD CONSTRAINT "routine_daily_grid_logs_template_id_routine_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."routine_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_grid_option_ingredients" ADD CONSTRAINT "routine_grid_option_ingredients_grid_option_id_routine_grid_options_id_fk" FOREIGN KEY ("grid_option_id") REFERENCES "public"."routine_grid_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_grid_option_ingredients" ADD CONSTRAINT "routine_grid_option_ingredients_ingredient_id_natural_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."natural_ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_grid_options" ADD CONSTRAINT "routine_grid_options_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_grid_options" ADD CONSTRAINT "routine_grid_options_template_id_routine_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."routine_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_items" ADD CONSTRAINT "routine_items_template_id_routine_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."routine_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_items" ADD CONSTRAINT "routine_items_ingredient_id_natural_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."natural_ingredients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_templates" ADD CONSTRAINT "routine_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "routine_daily_grid_logs_unique_idx" ON "routine_daily_grid_logs" USING btree ("user_id","log_date","time_block","category");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_grid_option_ingredients_unique_idx" ON "routine_grid_option_ingredients" USING btree ("grid_option_id","ingredient_id");--> statement-breakpoint
ALTER POLICY "daily-grid-logs-select" ON "routine_daily_grid_logs" RENAME TO "routine-daily-grid-logs-select";--> statement-breakpoint
ALTER POLICY "daily-grid-logs-insert" ON "routine_daily_grid_logs" RENAME TO "routine-daily-grid-logs-insert";--> statement-breakpoint
ALTER POLICY "daily-grid-logs-update" ON "routine_daily_grid_logs" RENAME TO "routine-daily-grid-logs-update";--> statement-breakpoint
ALTER POLICY "daily-grid-logs-delete" ON "routine_daily_grid_logs" RENAME TO "routine-daily-grid-logs-delete";--> statement-breakpoint
ALTER POLICY "grid-option-ingredients-select" ON "routine_grid_option_ingredients" RENAME TO "routine-grid-option-ingredients-select";--> statement-breakpoint
ALTER POLICY "grid-option-ingredients-insert" ON "routine_grid_option_ingredients" RENAME TO "routine-grid-option-ingredients-insert";--> statement-breakpoint
ALTER POLICY "grid-option-ingredients-update" ON "routine_grid_option_ingredients" RENAME TO "routine-grid-option-ingredients-update";--> statement-breakpoint
ALTER POLICY "grid-option-ingredients-delete" ON "routine_grid_option_ingredients" RENAME TO "routine-grid-option-ingredients-delete";--> statement-breakpoint
ALTER POLICY "grid-options-select" ON "routine_grid_options" RENAME TO "routine-grid-options-select";--> statement-breakpoint
ALTER POLICY "grid-options-insert" ON "routine_grid_options" RENAME TO "routine-grid-options-insert";--> statement-breakpoint
ALTER POLICY "grid-options-update" ON "routine_grid_options" RENAME TO "routine-grid-options-update";--> statement-breakpoint
ALTER POLICY "grid-options-delete" ON "routine_grid_options" RENAME TO "routine-grid-options-delete";--> statement-breakpoint
ALTER POLICY "section-items-select" ON "routine_items" RENAME TO "routine-items-select";--> statement-breakpoint
ALTER POLICY "section-items-insert" ON "routine_items" RENAME TO "routine-items-insert";--> statement-breakpoint
ALTER POLICY "section-items-update" ON "routine_items" RENAME TO "routine-items-update";--> statement-breakpoint
ALTER POLICY "section-items-delete" ON "routine_items" RENAME TO "routine-items-delete";--> statement-breakpoint
ALTER POLICY "section-templates-select" ON "routine_templates" RENAME TO "routine-templates-select";--> statement-breakpoint
ALTER POLICY "section-templates-insert" ON "routine_templates" RENAME TO "routine-templates-insert";--> statement-breakpoint
ALTER POLICY "section-templates-update" ON "routine_templates" RENAME TO "routine-templates-update";--> statement-breakpoint
ALTER POLICY "section-templates-delete" ON "routine_templates" RENAME TO "routine-templates-delete";