CREATE TABLE "grid_option_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grid_option_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grid_option_ingredients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ingredient_target_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"strength" double precision DEFAULT 1 NOT NULL,
	"evidence_level" text DEFAULT 'preclinical' NOT NULL,
	"pmids" text[] DEFAULT '{}',
	"notes" text,
	CONSTRAINT "strength_check" CHECK (strength >= 0 AND strength <= 2)
);
--> statement-breakpoint
CREATE TABLE "natural_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"synonyms" text[] DEFAULT '{}',
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	CONSTRAINT "natural_ingredients_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "natural_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	CONSTRAINT "natural_targets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" bigint NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "target_to_meta_axis" (
	"target_id" uuid NOT NULL,
	"meta_axis" text NOT NULL,
	"axis_weight" double precision DEFAULT 1 NOT NULL,
	CONSTRAINT "target_to_meta_axis_target_id_meta_axis_pk" PRIMARY KEY("target_id","meta_axis"),
	CONSTRAINT "axis_weight_check" CHECK (axis_weight >= 0 AND axis_weight <= 2)
);
--> statement-breakpoint
DROP INDEX IF EXISTS "grid_options_user_category_active_idx";--> statement-breakpoint
ALTER TABLE "grid_option_ingredients" ADD CONSTRAINT "grid_option_ingredients_grid_option_id_grid_options_id_fk" FOREIGN KEY ("grid_option_id") REFERENCES "public"."grid_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_option_ingredients" ADD CONSTRAINT "grid_option_ingredients_ingredient_id_natural_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."natural_ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence" ADD CONSTRAINT "ingredient_target_evidence_ingredient_id_natural_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."natural_ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence" ADD CONSTRAINT "ingredient_target_evidence_target_id_natural_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."natural_targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_natural_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."natural_ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_to_meta_axis" ADD CONSTRAINT "target_to_meta_axis_target_id_natural_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."natural_targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "grid_option_ingredients_unique_idx" ON "grid_option_ingredients" USING btree ("grid_option_id","ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ingredient_target_evidence_unique_idx" ON "ingredient_target_evidence" USING btree ("ingredient_id","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_ingredients_unique_idx" ON "product_ingredients" USING btree ("product_id","ingredient_id");--> statement-breakpoint
CREATE POLICY "grid-option-ingredients-select" ON "grid_option_ingredients" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM grid_options
        WHERE grid_options.id = "grid_option_ingredients"."grid_option_id"
        AND grid_options.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "grid-option-ingredients-insert" ON "grid_option_ingredients" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM grid_options
        WHERE grid_options.id = "grid_option_ingredients"."grid_option_id"
        AND grid_options.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "grid-option-ingredients-update" ON "grid_option_ingredients" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM grid_options
        WHERE grid_options.id = "grid_option_ingredients"."grid_option_id"
        AND grid_options.user_id = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM grid_options
        WHERE grid_options.id = "grid_option_ingredients"."grid_option_id"
        AND grid_options.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "grid-option-ingredients-delete" ON "grid_option_ingredients" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM grid_options
        WHERE grid_options.id = "grid_option_ingredients"."grid_option_id"
        AND grid_options.user_id = (select auth.uid())
      ));