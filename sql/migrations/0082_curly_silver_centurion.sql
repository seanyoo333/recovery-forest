ALTER POLICY "clinic-photos-insert-policy" ON "clinic_photos" TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      ));--> statement-breakpoint
ALTER POLICY "clinic-photos-update-policy" ON "clinic_photos" TO authenticated USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      ));--> statement-breakpoint
ALTER POLICY "clinic-photos-delete-policy" ON "clinic_photos" TO authenticated USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      ));--> statement-breakpoint
ALTER POLICY "clinics-insert-policy" ON "clinics" TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      ));--> statement-breakpoint
ALTER POLICY "clinics-update-policy" ON "clinics" TO authenticated USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      ));--> statement-breakpoint
ALTER POLICY "clinics-delete-policy" ON "clinics" TO authenticated USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      ));