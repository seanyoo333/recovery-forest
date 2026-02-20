-- Migration 0098: Schema sync no-op
-- Policy renames and RLS were already applied in 0093_third_wildside
-- evidence_figures was created in 0097_evidence_figures
-- This migration exists to satisfy drizzle-kit generate snapshot; no actions needed
SELECT 1;
