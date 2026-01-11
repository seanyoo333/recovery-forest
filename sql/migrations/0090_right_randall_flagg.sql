-- Refactor ingredient_target_evidence: evidence_level → study_type and separate evidence_sources
-- This migration aligns the database schema with the new 5-axis calculation system
-- and improves paper management by separating evidence sources

-- Step 1: Create evidence_sources table
CREATE TABLE "evidence_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pmid" text,
	"doi" text,
	"url" text,
	"title" text,
	"journal" text,
	"year" integer,
	"authors" text,
	"study_type" text DEFAULT 'mechanistic' NOT NULL,
	"strength" double precision DEFAULT 1 NOT NULL,
	"retrieved_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_sources_pmid_or_doi_check" CHECK (("pmid" IS NOT NULL) OR ("doi" IS NOT NULL)),
	CONSTRAINT "evidence_sources_strength_check" CHECK (strength >= 0 AND strength <= 2)
);
--> statement-breakpoint

-- Step 2: Create ingredient_target_evidence_sources mapping table
CREATE TABLE "ingredient_target_evidence_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_target_evidence_id" uuid NOT NULL,
	"evidence_source_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"extracted_strength_override" double precision,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "extracted_strength_override_check" CHECK (("extracted_strength_override" IS NULL) OR ("extracted_strength_override" >= 0 AND "extracted_strength_override" <= 2))
);
--> statement-breakpoint

-- Step 3: Rename evidence_level to study_type
ALTER TABLE "ingredient_target_evidence" RENAME COLUMN "evidence_level" TO "study_type";
--> statement-breakpoint

-- Step 4: Migrate existing data from old evidence_level values to new study_type values
-- Map old evidence_level values to new study_type values
UPDATE "ingredient_target_evidence"
SET "study_type" = CASE
  WHEN "study_type" = 'human' THEN 'human_observational'
  WHEN "study_type" = 'animal' THEN 'animal'
  WHEN "study_type" = 'cell' THEN 'cell'
  WHEN "study_type" = 'mixed' THEN 'human_observational'  -- mixed human studies -> human_observational
  WHEN "study_type" = 'preclinical' THEN 'mechanistic'  -- preclinical -> mechanistic
  ELSE 'mechanistic'  -- default fallback
END
WHERE "study_type" IN ('human', 'animal', 'cell', 'mixed', 'preclinical');
--> statement-breakpoint

-- Step 5: Add constraint to ensure study_type values match STUDY_TYPE_STRENGTH keys
ALTER TABLE "ingredient_target_evidence"
ADD CONSTRAINT "study_type_check" 
CHECK ("study_type" IN (
  'systematic_review',
  'rct',
  'human_observational',
  'case_report',
  'animal',
  'cell',
  'mechanistic'
));
--> statement-breakpoint

-- Step 6: Drop old unique index
DROP INDEX "ingredient_target_evidence_unique_idx";
--> statement-breakpoint

-- Step 7: Add created_at and updated_at columns
ALTER TABLE "ingredient_target_evidence" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint

-- Step 8: Add foreign key constraints
ALTER TABLE "ingredient_target_evidence_sources" ADD CONSTRAINT "ingredient_target_evidence_sources_ingredient_target_evidence_id_ingredient_target_evidence_id_fk" FOREIGN KEY ("ingredient_target_evidence_id") REFERENCES "public"."ingredient_target_evidence"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence_sources" ADD CONSTRAINT "ingredient_target_evidence_sources_evidence_source_id_evidence_sources_id_fk" FOREIGN KEY ("evidence_source_id") REFERENCES "public"."evidence_sources"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Step 9: Create indexes
CREATE UNIQUE INDEX "evidence_sources_pmid_unique_idx" ON "evidence_sources" USING btree ("pmid");
--> statement-breakpoint
CREATE UNIQUE INDEX "evidence_sources_doi_unique_idx" ON "evidence_sources" USING btree ("doi");
--> statement-breakpoint
CREATE UNIQUE INDEX "ingredient_target_evidence_sources_unique_idx" ON "ingredient_target_evidence_sources" USING btree ("ingredient_target_evidence_id","evidence_source_id");
--> statement-breakpoint

-- Step 10: Create new unique index with study_type (allows multiple study types per ingredient-target)
CREATE UNIQUE INDEX "ingredient_target_evidence_unique_idx" ON "ingredient_target_evidence" USING btree ("ingredient_id","target_id","study_type");
--> statement-breakpoint

-- Step 11: Migrate existing pmids to evidence_sources
-- Extract unique pmids from ingredient_target_evidence.pmids array before dropping the column
INSERT INTO "evidence_sources" ("pmid", "study_type", "strength", "created_at", "updated_at", "retrieved_at")
SELECT DISTINCT
  unnest("pmids") as "pmid",
  ite."study_type",
  ite."strength",
  now(),
  now(),
  now()
FROM "ingredient_target_evidence" ite
WHERE array_length("pmids", 1) > 0
ON CONFLICT ("pmid") DO NOTHING;
--> statement-breakpoint

-- Step 12: Create mappings from existing data
-- Link each ingredient_target_evidence row to its pmids in evidence_sources
INSERT INTO "ingredient_target_evidence_sources" (
  "ingredient_target_evidence_id",
  "evidence_source_id",
  "is_primary",
  "created_at"
)
SELECT 
  ite."id" as "ingredient_target_evidence_id",
  es."id" as "evidence_source_id",
  CASE WHEN row_number() OVER (PARTITION BY ite."id" ORDER BY es."strength" DESC, es."study_type") = 1 
    THEN true 
    ELSE false 
  END as "is_primary",
  now()
FROM "ingredient_target_evidence" ite
CROSS JOIN LATERAL unnest(ite."pmids") as pmid_value
INNER JOIN "evidence_sources" es ON es."pmid" = pmid_value
WHERE array_length(ite."pmids", 1) > 0;
--> statement-breakpoint

-- Step 13: Drop pmids column (after migrating data)
ALTER TABLE "ingredient_target_evidence" DROP COLUMN "pmids";
--> statement-breakpoint

-- Step 14: Enable RLS (Row Level Security)
ALTER TABLE "evidence_sources" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence_sources" ENABLE ROW LEVEL SECURITY;
