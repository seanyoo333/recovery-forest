ALTER TABLE "target_tags" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "target_tags" CASCADE;--> statement-breakpoint
DROP INDEX "ingredient_target_evidence_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "ingredient_target_evidence_ing_target_uidx" ON "ingredient_target_evidence" USING btree ("ingredient_id","target_id");--> statement-breakpoint
DROP TYPE "public"."target_tag_category";