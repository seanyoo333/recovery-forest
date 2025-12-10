ALTER TABLE "blog_posts_meta" DROP COLUMN "featured_image_url";--> statement-breakpoint
ALTER TABLE "blog_posts_meta" DROP COLUMN "mdx_file_path";--> statement-breakpoint
ALTER POLICY "blog-posts-meta-select-policy" ON "blog_posts_meta" TO public USING (true);