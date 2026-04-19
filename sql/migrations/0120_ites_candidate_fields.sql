ALTER TABLE "ingredient_target_evidence_sources"
  ADD COLUMN IF NOT EXISTS "effect" "ingredient_target_evidence_effect";--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence_sources"
  ADD COLUMN IF NOT EXISTS "outcome_direction" "outcome_direction_enum";--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence_sources"
  ADD COLUMN IF NOT EXISTS "candidate_index" integer;--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence_sources"
  ADD COLUMN IF NOT EXISTS "disease_slug" text;--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence_sources"
  ADD COLUMN IF NOT EXISTS "candidate_confidence" double precision;--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence_sources"
  ADD COLUMN IF NOT EXISTS "extraction_note" text;--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE "ingredient_target_evidence_sources"
    ADD CONSTRAINT "ingredient_target_evidence_sources_candidate_confidence_check"
    CHECK (
      ("candidate_confidence" IS NULL)
      OR ("candidate_confidence" >= 0 AND "candidate_confidence" <= 1)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;--> statement-breakpoint
