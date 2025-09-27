ALTER TABLE "notifications" RENAME COLUMN "product_id" TO "team_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_product_id_products_product_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_team_id_teams_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("team_id") ON DELETE cascade ON UPDATE no action;