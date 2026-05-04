ALTER TABLE "topics"
ADD COLUMN IF NOT EXISTS "display_order" integer;--> statement-breakpoint

ALTER TABLE "topics"
ADD COLUMN IF NOT EXISTS "is_admin_only" boolean NOT NULL DEFAULT false;--> statement-breakpoint

-- slug 중복이 있으면 unique 제약 충돌을 피하기 위해 후행 행의 slug를 분기 처리
WITH duplicated AS (
  SELECT
    topic_id,
    slug,
    row_number() OVER (PARTITION BY slug ORDER BY topic_id) AS rn
  FROM "topics"
)
UPDATE "topics" t
SET slug = t.slug || '-' || t.topic_id::text
FROM duplicated d
WHERE t.topic_id = d.topic_id
  AND d.rn > 1;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "topics_slug_unique_idx"
ON "topics" ("slug");--> statement-breakpoint

INSERT INTO "topics" ("name", "slug", "display_order", "is_admin_only")
VALUES
  ('공지사항', 'notice', 1, true),
  ('암 대사', 'cancer-metabolism', 2, false),
  ('영양 및 식단', 'nutrition-diet', 3, false),
  ('건강 및 치유', 'health-healing', 4, false),
  ('암 소식', 'cancer-news', 5, false)
ON CONFLICT ("slug")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "display_order" = EXCLUDED."display_order",
  "is_admin_only" = EXCLUDED."is_admin_only",
  "updated_at" = now();--> statement-breakpoint

WITH ordered_topics AS (
  SELECT
    topic_id,
    COALESCE(
      display_order,
      1000 + row_number() OVER (ORDER BY topic_id)
    ) AS resolved_order
  FROM "topics"
)
UPDATE "topics" t
SET "display_order" = o.resolved_order
FROM ordered_topics o
WHERE t.topic_id = o.topic_id;--> statement-breakpoint

ALTER TABLE "topics"
ALTER COLUMN "display_order" SET NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "topics_display_order_unique_idx"
ON "topics" ("display_order");--> statement-breakpoint
