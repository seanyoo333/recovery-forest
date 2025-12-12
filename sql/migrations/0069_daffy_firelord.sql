ALTER TABLE "posts" ADD COLUMN "is_notice" boolean DEFAULT false;--> statement-breakpoint
CREATE POLICY "posts-select-notice-policy" ON "posts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("posts"."is_notice");--> statement-breakpoint
ALTER POLICY "posts-select-policy" ON "posts" TO public USING (NOT "posts"."is_notice");--> statement-breakpoint
ALTER POLICY "posts-insert-policy" ON "posts" TO authenticated WITH CHECK (
        (select auth.uid()) = "posts"."profile_id"
        AND (
          NOT "posts"."is_notice" OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'content_admin')
            AND is_active = true
          )
        )
      );--> statement-breakpoint
ALTER POLICY "posts-update-policy" ON "posts" TO authenticated USING (true) WITH CHECK (
        (
          NOT "posts"."is_notice" OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'content_admin')
            AND is_active = true
          )
        )
      );--> statement-breakpoint
ALTER POLICY "posts-delete-policy" ON "posts" TO authenticated USING (
        ((select auth.uid()) = "posts"."profile_id" AND NOT "posts"."is_notice")
        OR EXISTS (
          SELECT 1 FROM admin_permissions
          WHERE admin_id = (select auth.uid())
          AND admin_role IN ('super_admin', 'content_admin')
          AND is_active = true
        )
      );