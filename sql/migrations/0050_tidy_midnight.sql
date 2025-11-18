CREATE POLICY "events-update-policy" ON "events" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "events"."profile_id") WITH CHECK ((select auth.uid()) = "events"."profile_id");--> statement-breakpoint
CREATE POLICY "events-delete-policy" ON "events" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "follows-update-policy" ON "follows" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "follows"."follower_id") WITH CHECK ((select auth.uid()) = "follows"."follower_id");--> statement-breakpoint
ALTER POLICY "events-select-policy" ON "events" TO public USING (true);--> statement-breakpoint
ALTER POLICY "admin-permissions-select-policy" ON "admin_permissions" TO authenticated USING ((select auth.uid()) = "admin_permissions"."admin_id" OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role = 'super_admin'
        AND is_active = true
      ));