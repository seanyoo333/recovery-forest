ALTER TABLE "posts"
ADD COLUMN IF NOT EXISTS "references" jsonb NOT NULL DEFAULT '[]'::jsonb;--> statement-breakpoint

UPDATE "posts"
SET "references" = jsonb_build_array(
  jsonb_build_object(
    'label', '출처',
    'url', trim("reference")
  )
)
WHERE
  ("references" IS NULL OR "references" = '[]'::jsonb)
  AND "reference" IS NOT NULL
  AND trim("reference") <> ''
  AND trim("reference") ~* '^https?://';--> statement-breakpoint
