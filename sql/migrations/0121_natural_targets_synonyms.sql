ALTER TABLE "natural_targets"
  ADD COLUMN IF NOT EXISTS "synonyms" text[] DEFAULT '{}';--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "natural_targets_synonyms_gin_idx"
  ON "natural_targets" USING gin("synonyms");--> statement-breakpoint
