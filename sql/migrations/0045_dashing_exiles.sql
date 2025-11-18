ALTER POLICY "admin-permissions-select-policy" ON "admin_permissions" TO authenticated USING ((select auth.uid()) = "admin_permissions"."admin_id" OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role = 'super_admin'
        AND is_active = true
      ));