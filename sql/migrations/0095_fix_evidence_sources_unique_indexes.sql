-- Fix evidence_sources unique indexes to handle empty strings properly
-- Empty strings are normalized to NULL to prevent unique constraint violations
-- This allows multiple records with NULL pmid/doi while maintaining uniqueness for actual values

-- Step 1: Drop existing unique indexes
DROP INDEX IF EXISTS evidence_sources_pmid_unique_idx;
--> statement-breakpoint
DROP INDEX IF EXISTS evidence_sources_doi_unique_idx;
--> statement-breakpoint

-- Step 2: Normalize empty strings to NULL for existing data
UPDATE evidence_sources
SET pmid = NULL
WHERE pmid = '';
--> statement-breakpoint

UPDATE evidence_sources
SET doi = NULL
WHERE doi = '';
--> statement-breakpoint

-- Step 3: Create partial unique indexes that exclude NULL and empty strings
-- This ensures uniqueness only for actual values while allowing multiple NULLs
CREATE UNIQUE INDEX IF NOT EXISTS evidence_sources_pmid_unique_idx
ON evidence_sources (pmid)
WHERE pmid IS NOT NULL AND pmid != '';
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS evidence_sources_doi_unique_idx
ON evidence_sources (doi)
WHERE doi IS NOT NULL AND doi != '';
--> statement-breakpoint

-- Step 4: Update check constraint to exclude empty strings
ALTER TABLE evidence_sources
DROP CONSTRAINT IF EXISTS evidence_sources_pmid_or_doi_check;
--> statement-breakpoint

ALTER TABLE evidence_sources
ADD CONSTRAINT evidence_sources_pmid_or_doi_check
CHECK (("pmid" IS NOT NULL AND "pmid" != '') OR ("doi" IS NOT NULL AND "doi" != ''));
--> statement-breakpoint

