CREATE TABLE "ingredient_experiences" (
	"experience_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingredient_experiences_experience_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"ingredient_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"content" text NOT NULL,
	"usage_goal" text DEFAULT '컨디션 관리' NOT NULL,
	"duration_label" text DEFAULT '1~4주' NOT NULL,
	"form_factor" text DEFAULT '캡슐' NOT NULL,
	"summary_label" text DEFAULT '잘 모르겠음' NOT NULL,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ingredient_experiences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ingredient_experiences" ADD CONSTRAINT "ingredient_experiences_ingredient_id_natural_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."natural_ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_experiences" ADD CONSTRAINT "ingredient_experiences_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ingredient-experiences-ingredient-created-at-idx" ON "ingredient_experiences" USING btree ("ingredient_id","created_at");--> statement-breakpoint
CREATE POLICY "ingredient-experiences-select-policy" ON "ingredient_experiences" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "ingredient-experiences-insert-policy" ON "ingredient_experiences" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "ingredient_experiences"."profile_id");--> statement-breakpoint
CREATE POLICY "ingredient-experiences-update-policy" ON "ingredient_experiences" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "ingredient_experiences"."profile_id") WITH CHECK ((select auth.uid()) = "ingredient_experiences"."profile_id");--> statement-breakpoint
CREATE POLICY "ingredient-experiences-delete-policy" ON "ingredient_experiences" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "ingredient_experiences"."profile_id");