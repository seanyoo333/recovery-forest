DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE TABLE "admin_permissions" (
      "admin_id" uuid PRIMARY KEY NOT NULL,
      "admin_role" "admin_role" NOT NULL,
      "permissions" jsonb,
      "is_active" boolean DEFAULT true NOT NULL,
      "created_by" uuid,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    ALTER TABLE "admin_permissions" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'admin_permissions_admin_id_profiles_profile_id_fk') THEN
    ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_admin_id_profiles_profile_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'admin_permissions_created_by_profiles_profile_id_fk') THEN
    ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_created_by_profiles_profile_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("profile_id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    DROP POLICY IF EXISTS "admin-permissions-select-policy" ON "admin_permissions" CASCADE;
    CREATE POLICY "admin-permissions-select-policy" ON "admin_permissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "admin_permissions"."admin_id" OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role = 'super_admin'
        AND is_active = true
      ));
    DROP POLICY IF EXISTS "admin-permissions-insert-policy" ON "admin_permissions" CASCADE;
    CREATE POLICY "admin-permissions-insert-policy" ON "admin_permissions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role = 'super_admin'
        AND is_active = true
      ));
    DROP POLICY IF EXISTS "admin-permissions-update-policy" ON "admin_permissions" CASCADE;
    CREATE POLICY "admin-permissions-update-policy" ON "admin_permissions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role = 'super_admin'
        AND is_active = true
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role = 'super_admin'
        AND is_active = true
      ));
    DROP POLICY IF EXISTS "admin-permissions-delete-policy" ON "admin_permissions" CASCADE;
    CREATE POLICY "admin-permissions-delete-policy" ON "admin_permissions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role = 'super_admin'
        AND is_active = true
      ));
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'select-payment-policy') THEN
    ALTER POLICY "select-payment-policy" ON "payments" RENAME TO "payments-select-policy";
  END IF;
END $$;--> statement-breakpoint
DROP POLICY IF EXISTS "payments-select-policy" ON "payments" CASCADE;--> statement-breakpoint
CREATE POLICY "payments-select-policy" ON "payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "payments"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "payments-insert-policy" ON "payments" CASCADE;--> statement-breakpoint
CREATE POLICY "payments-insert-policy" ON "payments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "payments"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "payments-update-policy" ON "payments" CASCADE;--> statement-breakpoint
CREATE POLICY "payments-update-policy" ON "payments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "payments"."profile_id") WITH CHECK ((select auth.uid()) = "payments"."profile_id");