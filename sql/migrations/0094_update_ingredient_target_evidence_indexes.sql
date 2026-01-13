-- Update ingredient_target_evidence and ingredient_target_evidence_sources indexes
-- 1. Change ingredient_target_evidence unique index from (ingredient_id, target_id, study_type) to (ingredient_id, target_id)
-- 2. Add partial unique index to ensure only one is_primary = true per ingredient_target_evidence_id

-- Step 1: Drop existing unique index
DROP INDEX IF EXISTS ingredient_target_evidence_unique_idx;
--> statement-breakpoint

-- Step 2: Create new unique index on (ingredient_id, target_id) only
-- This ensures one row per ingredient-target combination
CREATE UNIQUE INDEX IF NOT EXISTS ingredient_target_evidence_ing_target_uidx
ON ingredient_target_evidence (ingredient_id, target_id);
--> statement-breakpoint

-- Step 3: Add partial unique index to ensure only one is_primary = true per ingredient_target_evidence_id
-- This ensures that each ingredient_target_evidence can have at most one primary evidence source
CREATE UNIQUE INDEX IF NOT EXISTS ites_primary_one_per_ite_uidx
ON ingredient_target_evidence_sources (ingredient_target_evidence_id)
WHERE is_primary = true;
--> statement-breakpoint

