ALTER TABLE "categories" RENAME COLUMN "main_energy" TO "academic_name";--> statement-breakpoint
ALTER TABLE "categories" RENAME COLUMN "korean_main_energy" TO "target";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "korean_name";