ALTER TABLE "evidence_sources"
  DROP CONSTRAINT IF EXISTS "evidence_sources_identifier_check";--> statement-breakpoint

DROP INDEX IF EXISTS "evidence_sources_title_year_key_unique";--> statement-breakpoint

ALTER TABLE "evidence_sources" DROP COLUMN IF EXISTS "title_year_key";--> statement-breakpoint

ALTER TABLE "evidence_sources"
  ALTER COLUMN "pmid" SET DATA TYPE bigint
  USING CASE
    WHEN "pmid" IS NULL THEN NULL
    WHEN trim("pmid"::text) ~ '^[0-9]+$' THEN trim("pmid"::text)::bigint
    ELSE NULL
  END;--> statement-breakpoint

ALTER TABLE "evidence_sources" ADD COLUMN IF NOT EXISTS "pmcid" text;--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN IF NOT EXISTS "title_norm" text;--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN IF NOT EXISTS "first_author_norm" text;--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN IF NOT EXISTS "source_input" text;--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN IF NOT EXISTS "canonical_id" text;--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN IF NOT EXISTS "match_strategy" text;--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD COLUMN IF NOT EXISTS "review_reason" text;--> statement-breakpoint

UPDATE "evidence_sources"
SET "title_norm" = lower(trim("title"))
WHERE "title_norm" IS NULL
  AND "title" IS NOT NULL
  AND trim("title") <> '';--> statement-breakpoint

ALTER TABLE "evidence_sources"
  ADD CONSTRAINT "evidence_sources_identifier_check"
  CHECK (
    ("pmid" IS NOT NULL)
    OR ("doi_norm" IS NOT NULL AND "doi_norm" <> '')
    OR ("title_norm" IS NOT NULL AND "title_norm" <> '' AND "year" IS NOT NULL)
  );--> statement-breakpoint

ALTER TABLE "evidence_sources"
  ADD COLUMN IF NOT EXISTS "title_year_key" text
  GENERATED ALWAYS AS (
    CASE
      WHEN (
        "doi_norm" IS NULL
        AND "pmid" IS NULL
        AND "title" IS NOT NULL
        AND trim("title") <> ''
        AND "year" IS NOT NULL
        AND "year"::text ~ '^\\d{1,5}$'
      ) THEN trim("title") || ':' || "year"::text
      ELSE NULL
    END
  ) STORED;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "evidence_sources_title_year_key_unique"
ON "evidence_sources" ("title_year_key");--> statement-breakpoint
