-- Fix RLS policy for blog_posts_meta to allow public access to published posts
DROP POLICY IF EXISTS "blog-posts-meta-select-policy" ON "blog_posts_meta";

CREATE POLICY "blog-posts-meta-select-policy" ON "blog_posts_meta"
AS PERMISSIVE
FOR SELECT
TO public
USING ("is_published" = true);

