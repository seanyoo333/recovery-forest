ALTER TABLE "blog_posts_meta"
ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint

ALTER TABLE "blog_posts_meta"
ADD COLUMN IF NOT EXISTS "image_alt" text;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "blog_posts_meta_slug_published_idx"
ON "blog_posts_meta" ("slug", "is_published");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "blog_posts_meta_category_published_date_idx"
ON "blog_posts_meta" ("category", "is_published", "date" DESC);--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "set_blog_posts_meta_updated_at"
ON public.blog_posts_meta;--> statement-breakpoint

CREATE TRIGGER "set_blog_posts_meta_updated_at"
BEFORE UPDATE ON public.blog_posts_meta
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
