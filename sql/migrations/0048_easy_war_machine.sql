ALTER POLICY "products-update-policy" ON "products" TO authenticated USING ((select auth.uid()) = "products"."profile_id") WITH CHECK  (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      ));