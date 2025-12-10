CREATE TABLE "blog_post_upvotes" (
	"post_id" bigint,
	"profile_id" uuid,
	CONSTRAINT "blog_post_upvotes_post_id_profile_id_pk" PRIMARY KEY("post_id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "blog_post_upvotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blog_posts_meta" ADD COLUMN "upvotes" bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "blog_post_upvotes" ADD CONSTRAINT "blog_post_upvotes_post_id_blog_posts_meta_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts_meta"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_upvotes" ADD CONSTRAINT "blog_post_upvotes_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "blog-posts-meta-update-upvotes-policy" ON "blog_posts_meta" AS PERMISSIVE FOR UPDATE TO public USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "blog-post-upvotes-select-policy" ON "blog_post_upvotes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "blog-post-upvotes-insert-policy" ON "blog_post_upvotes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "blog_post_upvotes"."profile_id");--> statement-breakpoint
CREATE POLICY "blog-post-upvotes-delete-policy" ON "blog_post_upvotes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "blog_post_upvotes"."profile_id");