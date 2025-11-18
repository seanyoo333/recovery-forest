ALTER TABLE "blog_posts_meta" DROP CONSTRAINT "blog_posts_meta_slug_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "blog_posts_meta_slug_unique" ON "blog_posts_meta" USING btree ("slug");