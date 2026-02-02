ALTER TABLE "evidence_sources" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN "cited" integer;--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN "snippet" text;--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN "candidates" jsonb;