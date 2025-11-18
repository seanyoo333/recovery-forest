CREATE TABLE "blog_posts_meta" (
	"post_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blog_posts_meta_post_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"author" text NOT NULL,
	"date" timestamp NOT NULL,
	"featured_image_url" text,
	"mdx_file_path" text NOT NULL,
	"naver_blog_url" text,
	"naver_post_id" text,
	"imported_at" timestamp,
	"is_curated" boolean DEFAULT false,
	"curation_notes" text,
	"published_at" timestamp,
	"is_published" boolean DEFAULT false,
	"email_sent" boolean DEFAULT false,
	"profile_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	CONSTRAINT "blog_posts_meta_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blog_posts_meta" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blog_posts_meta" ADD CONSTRAINT "blog_posts_meta_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "blog-posts-meta-select-policy" ON "blog_posts_meta" AS PERMISSIVE FOR SELECT TO public USING ("blog_posts_meta"."is_published" = true);--> statement-breakpoint
CREATE POLICY "blog-posts-meta-insert-policy" ON "blog_posts_meta" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "blog-posts-meta-update-policy" ON "blog_posts_meta" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
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
CREATE POLICY "blog-posts-meta-delete-policy" ON "blog_posts_meta" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));