ALTER TABLE "evidence_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "natural_ingredients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "natural_targets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_ingredients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "target_to_meta_axis" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER POLICY "routine-daily-grid-logs-select" ON "routine_daily_grid_logs" RENAME TO "routine-daily-grid-logs-select-policy";--> statement-breakpoint
ALTER POLICY "routine-daily-grid-logs-insert" ON "routine_daily_grid_logs" RENAME TO "routine-daily-grid-logs-insert-policy";--> statement-breakpoint
ALTER POLICY "routine-daily-grid-logs-update" ON "routine_daily_grid_logs" RENAME TO "routine-daily-grid-logs-update-policy";--> statement-breakpoint
ALTER POLICY "routine-daily-grid-logs-delete" ON "routine_daily_grid_logs" RENAME TO "routine-daily-grid-logs-delete-policy";--> statement-breakpoint
ALTER POLICY "routine-grid-options-select" ON "routine_grid_options" RENAME TO "routine-grid-options-select-policy";--> statement-breakpoint
ALTER POLICY "routine-grid-options-insert" ON "routine_grid_options" RENAME TO "routine-grid-options-insert-policy";--> statement-breakpoint
ALTER POLICY "routine-grid-options-update" ON "routine_grid_options" RENAME TO "routine-grid-options-update-policy";--> statement-breakpoint
ALTER POLICY "routine-grid-options-delete" ON "routine_grid_options" RENAME TO "routine-grid-options-delete-policy";--> statement-breakpoint
ALTER POLICY "routine-items-select" ON "routine_items" RENAME TO "routine-items-select-policy";--> statement-breakpoint
ALTER POLICY "routine-items-insert" ON "routine_items" RENAME TO "routine-items-insert-policy";--> statement-breakpoint
ALTER POLICY "routine-items-update" ON "routine_items" RENAME TO "routine-items-update-policy";--> statement-breakpoint
ALTER POLICY "routine-items-delete" ON "routine_items" RENAME TO "routine-items-delete-policy";--> statement-breakpoint
ALTER POLICY "routine-templates-select" ON "routine_templates" RENAME TO "routine-templates-select-policy";--> statement-breakpoint
ALTER POLICY "routine-templates-insert" ON "routine_templates" RENAME TO "routine-templates-insert-policy";--> statement-breakpoint
ALTER POLICY "routine-templates-update" ON "routine_templates" RENAME TO "routine-templates-update-policy";--> statement-breakpoint
ALTER POLICY "routine-templates-delete" ON "routine_templates" RENAME TO "routine-templates-delete-policy";--> statement-breakpoint
ALTER POLICY "streaks-select" ON "streaks" RENAME TO "streaks-select-policy";--> statement-breakpoint
ALTER POLICY "streaks-insert" ON "streaks" RENAME TO "streaks-insert-policy";--> statement-breakpoint
ALTER POLICY "streaks-update" ON "streaks" RENAME TO "streaks-update-policy";--> statement-breakpoint
ALTER POLICY "streaks-delete" ON "streaks" RENAME TO "streaks-delete-policy";--> statement-breakpoint
CREATE POLICY "evidence-sources-select-policy" ON "evidence_sources" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "evidence-sources-insert-policy" ON "evidence_sources" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "evidence-sources-update-policy" ON "evidence_sources" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
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
CREATE POLICY "evidence-sources-delete-policy" ON "evidence_sources" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "ingredient-target-evidence-select-policy" ON "ingredient_target_evidence" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "ingredient-target-evidence-insert-policy" ON "ingredient_target_evidence" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "ingredient-target-evidence-update-policy" ON "ingredient_target_evidence" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
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
CREATE POLICY "ingredient-target-evidence-delete-policy" ON "ingredient_target_evidence" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "ingredient-target-evidence-sources-select-policy" ON "ingredient_target_evidence_sources" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "ingredient-target-evidence-sources-insert-policy" ON "ingredient_target_evidence_sources" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "ingredient-target-evidence-sources-update-policy" ON "ingredient_target_evidence_sources" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
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
CREATE POLICY "ingredient-target-evidence-sources-delete-policy" ON "ingredient_target_evidence_sources" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "natural-ingredients-select-policy" ON "natural_ingredients" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "natural-ingredients-insert-policy" ON "natural_ingredients" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "natural-ingredients-update-policy" ON "natural_ingredients" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
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
CREATE POLICY "natural-ingredients-delete-policy" ON "natural_ingredients" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "natural-targets-select-policy" ON "natural_targets" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "natural-targets-insert-policy" ON "natural_targets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "natural-targets-update-policy" ON "natural_targets" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
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
CREATE POLICY "natural-targets-delete-policy" ON "natural_targets" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "product-ingredients-select-policy" ON "product_ingredients" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "product-ingredients-insert-policy" ON "product_ingredients" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "product-ingredients-update-policy" ON "product_ingredients" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "product-ingredients-delete-policy" ON "product_ingredients" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "target-to-meta-axis-select-policy" ON "target_to_meta_axis" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "target-to-meta-axis-insert-policy" ON "target_to_meta_axis" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));--> statement-breakpoint
CREATE POLICY "target-to-meta-axis-update-policy" ON "target_to_meta_axis" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
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
CREATE POLICY "target-to-meta-axis-delete-policy" ON "target_to_meta_axis" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));