ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_message_room_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_message_rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clinic_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clinics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_message_room_members" ADD CONSTRAINT "bot_message_room_members_bot_message_room_id_profile_id_pk" PRIMARY KEY("bot_message_room_id","profile_id");--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'point_payments' AND policyname = 'select-payment-policy') THEN
    ALTER POLICY "select-payment-policy" ON "point_payments" RENAME TO "point-payments-select-policy";
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE POLICY "events-select-policy" ON "events" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "events"."profile_id" OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));
  ELSE
    CREATE POLICY "events-select-policy" ON "events" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "events"."profile_id");
  END IF;
END $$;--> statement-breakpoint
CREATE POLICY "events-insert-policy" ON "events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "events"."profile_id");--> statement-breakpoint
CREATE POLICY "bot-message-room-members-select-policy" ON "bot_message_room_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM bot_message_room_members bmrm
        WHERE bmrm.bot_message_room_id = "bot_message_room_members"."bot_message_room_id"
        AND bmrm.profile_id = (select auth.uid())
        AND bmrm.is_hidden = false
      ));--> statement-breakpoint
CREATE POLICY "bot-message-room-members-insert-policy" ON "bot_message_room_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM bot_message_rooms
        WHERE bot_message_room_id = "bot_message_room_members"."bot_message_room_id"
        AND (
          created_by = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM bot_message_room_members
            WHERE bot_message_room_id = "bot_message_room_members"."bot_message_room_id"
            AND profile_id = (select auth.uid())
            AND is_hidden = false
          )
        )
      ));--> statement-breakpoint
CREATE POLICY "bot-message-room-members-update-policy" ON "bot_message_room_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "bot_message_room_members"."profile_id") WITH CHECK ((select auth.uid()) = "bot_message_room_members"."profile_id");--> statement-breakpoint
CREATE POLICY "bot-message-room-members-delete-policy" ON "bot_message_room_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "bot_message_room_members"."profile_id");--> statement-breakpoint
CREATE POLICY "bot-message-rooms-select-policy" ON "bot_message_rooms" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "bot_message_rooms"."created_by" OR EXISTS (
        SELECT 1 FROM bot_message_room_members
        WHERE bot_message_room_id = "bot_message_rooms"."bot_message_room_id"
        AND profile_id = (select auth.uid())
        AND is_hidden = false
      ));--> statement-breakpoint
CREATE POLICY "bot-message-rooms-insert-policy" ON "bot_message_rooms" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "bot_message_rooms"."created_by");--> statement-breakpoint
CREATE POLICY "bot-message-rooms-update-policy" ON "bot_message_rooms" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "bot_message_rooms"."created_by") WITH CHECK ((select auth.uid()) = "bot_message_rooms"."created_by");--> statement-breakpoint
CREATE POLICY "bot-message-rooms-delete-policy" ON "bot_message_rooms" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "bot_message_rooms"."created_by");--> statement-breakpoint
CREATE POLICY "bot-messages-select-policy" ON "bot_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM bot_message_room_members
        WHERE bot_message_room_id = "bot_messages"."bot_message_room_id"
        AND profile_id = (select auth.uid())
        AND is_hidden = false
      ));--> statement-breakpoint
CREATE POLICY "bot-messages-insert-policy" ON "bot_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM bot_message_room_members
        WHERE bot_message_room_id = "bot_messages"."bot_message_room_id"
        AND profile_id = (select auth.uid())
        AND is_hidden = false
      ) AND (
        "bot_messages"."sender_id" = (select auth.uid())::text
        OR "bot_messages"."sender_id" = 'ai-assistant'
      ));--> statement-breakpoint
CREATE POLICY "bot-messages-update-policy" ON "bot_messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("bot_messages"."sender_id" = (select auth.uid())::text) WITH CHECK ("bot_messages"."sender_id" = (select auth.uid())::text);--> statement-breakpoint
CREATE POLICY "bot-messages-delete-policy" ON "bot_messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("bot_messages"."sender_id" = (select auth.uid())::text);--> statement-breakpoint
CREATE POLICY "clinic-photos-select-policy" ON "clinic_photos" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE POLICY "clinic-photos-insert-policy" ON "clinic_photos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = "clinic_photos"."clinic_id"
        AND (
          clinic_boss = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'clinic_admin')
            AND is_active = true
          )
        )
      ));
  ELSE
    CREATE POLICY "clinic-photos-insert-policy" ON "clinic_photos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = "clinic_photos"."clinic_id"
        AND clinic_boss = (select auth.uid())
      ));
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE POLICY "clinic-photos-update-policy" ON "clinic_photos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = "clinic_photos"."clinic_id"
        AND (
          clinic_boss = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'clinic_admin')
            AND is_active = true
          )
        )
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = "clinic_photos"."clinic_id"
        AND (
          clinic_boss = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'clinic_admin')
            AND is_active = true
          )
        )
      ));
  ELSE
    CREATE POLICY "clinic-photos-update-policy" ON "clinic_photos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = "clinic_photos"."clinic_id"
        AND clinic_boss = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = "clinic_photos"."clinic_id"
        AND clinic_boss = (select auth.uid())
      ));
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE POLICY "clinic-photos-delete-policy" ON "clinic_photos" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = "clinic_photos"."clinic_id"
        AND (
          clinic_boss = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'clinic_admin')
            AND is_active = true
          )
        )
      ));
  ELSE
    CREATE POLICY "clinic-photos-delete-policy" ON "clinic_photos" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = "clinic_photos"."clinic_id"
        AND clinic_boss = (select auth.uid())
      ));
  END IF;
END $$;--> statement-breakpoint
CREATE POLICY "clinics-select-policy" ON "clinics" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE POLICY "clinics-insert-policy" ON "clinics" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "clinics"."clinic_boss" OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      ));
  ELSE
    CREATE POLICY "clinics-insert-policy" ON "clinics" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "clinics"."clinic_boss");
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE POLICY "clinics-update-policy" ON "clinics" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "clinics"."clinic_boss" OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      )) WITH CHECK ((select auth.uid()) = "clinics"."clinic_boss" OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      ));
  ELSE
    CREATE POLICY "clinics-update-policy" ON "clinics" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "clinics"."clinic_boss") WITH CHECK ((select auth.uid()) = "clinics"."clinic_boss");
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE POLICY "clinics-delete-policy" ON "clinics" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "clinics"."clinic_boss" OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      ));
  ELSE
    CREATE POLICY "clinics-delete-policy" ON "clinics" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "clinics"."clinic_boss");
  END IF;
END $$;--> statement-breakpoint
CREATE POLICY "point-payments-insert-policy" ON "point_payments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "point_payments"."profile_id");--> statement-breakpoint
CREATE POLICY "point-payments-update-policy" ON "point_payments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "point_payments"."profile_id") WITH CHECK ((select auth.uid()) = "point_payments"."profile_id");--> statement-breakpoint
CREATE POLICY "programs-select-policy" ON "programs" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE POLICY "programs-insert-policy" ON "programs" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE POLICY "programs-update-policy" ON "programs" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    CREATE POLICY "programs-delete-policy" ON "programs" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      ));
  END IF;
END $$;--> statement-breakpoint
CREATE POLICY "teams-select-policy" ON "teams" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "teams-insert-policy" ON "teams" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "teams"."team_leader_id");--> statement-breakpoint
CREATE POLICY "teams-update-policy" ON "teams" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "teams"."team_leader_id") WITH CHECK ((select auth.uid()) = "teams"."team_leader_id");--> statement-breakpoint
CREATE POLICY "teams-delete-policy" ON "teams" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "teams"."team_leader_id");