CREATE TABLE "blog_post_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text DEFAULT 'naver' NOT NULL,
	"source_url" text NOT NULL,
	"title" text NOT NULL,
	"published_at" timestamp,
	"raw_html" text,
	"raw_text" text,
	"clean_text" text,
	"checksum" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_post_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blog_posts_meta" ADD COLUMN "source" text DEFAULT 'mdx';--> statement-breakpoint
ALTER TABLE "blog_posts_meta" ADD COLUMN "canonical_url" text;--> statement-breakpoint
ALTER TABLE "blog_posts_meta" ADD COLUMN "content_ref_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "blog_post_sources_source_url_unique" ON "blog_post_sources" USING btree ("source_url");--> statement-breakpoint
ALTER TABLE "blog_posts_meta" ADD CONSTRAINT "blog_posts_meta_content_ref_id_blog_post_sources_id_fk" FOREIGN KEY ("content_ref_id") REFERENCES "public"."blog_post_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "blog-post-sources-select-policy" ON "blog_post_sources" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "blog-post-sources-insert-policy" ON "blog_post_sources" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "blog-post-sources-update-policy" ON "blog_post_sources" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "blog-post-sources-delete-policy" ON "blog_post_sources" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));