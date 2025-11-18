CREATE TABLE IF NOT EXISTS "programs" (
	"program_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "programs_program_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"program_name" text NOT NULL,
	"program_location" text NOT NULL,
	"program_address" text NOT NULL,
	"program_description" text NOT NULL,
	"topic_id" bigint NOT NULL,
	"program_notice" text NOT NULL,
	"program_image" text NOT NULL,
	"is_free" boolean NOT NULL,
	"program_url" text NOT NULL,
	"program_date_start" timestamp NOT NULL,
	"program_time_start" text NOT NULL,
	"program_time_end" text NOT NULL,
	"program_recruitment_start" text NOT NULL,
	"program_recruitment_end" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "program_name_check" CHECK (LENGTH("programs"."program_name") > 0),
	CONSTRAINT "program_description_check" CHECK (LENGTH("programs"."program_description") > 0)
);
--> statement-breakpoint
ALTER TABLE "post_replies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "post_reply_upvotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "post_upvotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "topics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_upvotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "follows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "message_room_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "message_rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_activity_logs') THEN
    ALTER TABLE "admin_activity_logs" DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "admin-logs-select-policy" ON "admin_activity_logs" CASCADE;
    DROP TABLE "admin_activity_logs" CASCADE;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clinics' AND column_name = 'clinic_boss') THEN
    ALTER TABLE "clinics" ADD COLUMN "clinic_boss" uuid;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE "profiles" ADD COLUMN "email" text;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_name = 'programs_topic_id_topics_topic_id_fk') THEN
    ALTER TABLE "programs" ADD CONSTRAINT "programs_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_name = 'clinics_clinic_boss_profiles_profile_id_fk') THEN
    ALTER TABLE "clinics" ADD CONSTRAINT "clinics_clinic_boss_profiles_profile_id_fk" FOREIGN KEY ("clinic_boss") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    IF EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_permissions' AND policyname = 'admin-permissions-manage-policy') THEN
      ALTER POLICY "admin-permissions-manage-policy" ON "admin_permissions" RENAME TO "admin-permissions-update-policy";
    END IF;
    DROP POLICY IF EXISTS "admin-permissions-select-policy" ON "admin_permissions" CASCADE;
  END IF;
END $$;--> statement-breakpoint
DROP POLICY IF EXISTS "select-profile-policy" ON "profiles" CASCADE;--> statement-breakpoint
CREATE POLICY "post-replies-select-policy" ON "post_replies" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "post-replies-insert-policy" ON "post_replies" CASCADE;--> statement-breakpoint
CREATE POLICY "post-replies-insert-policy" ON "post_replies" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "post_replies"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "post-replies-update-policy" ON "post_replies" CASCADE;--> statement-breakpoint
CREATE POLICY "post-replies-update-policy" ON "post_replies" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "post_replies"."profile_id") WITH CHECK ((select auth.uid()) = "post_replies"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "post-replies-delete-policy" ON "post_replies" CASCADE;--> statement-breakpoint
CREATE POLICY "post-replies-delete-policy" ON "post_replies" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "post_replies"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "post-reply-upvotes-select-policy" ON "post_reply_upvotes" CASCADE;--> statement-breakpoint
CREATE POLICY "post-reply-upvotes-select-policy" ON "post_reply_upvotes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "post-reply-upvotes-insert-policy" ON "post_reply_upvotes" CASCADE;--> statement-breakpoint
CREATE POLICY "post-reply-upvotes-insert-policy" ON "post_reply_upvotes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "post_reply_upvotes"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "post-reply-upvotes-delete-policy" ON "post_reply_upvotes" CASCADE;--> statement-breakpoint
CREATE POLICY "post-reply-upvotes-delete-policy" ON "post_reply_upvotes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "post_reply_upvotes"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "post-upvotes-select-policy" ON "post_upvotes" CASCADE;--> statement-breakpoint
CREATE POLICY "post-upvotes-select-policy" ON "post_upvotes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "post-upvotes-insert-policy" ON "post_upvotes" CASCADE;--> statement-breakpoint
CREATE POLICY "post-upvotes-insert-policy" ON "post_upvotes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "post_upvotes"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "post-upvotes-delete-policy" ON "post_upvotes" CASCADE;--> statement-breakpoint
CREATE POLICY "post-upvotes-delete-policy" ON "post_upvotes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "post_upvotes"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "posts-select-policy" ON "posts" CASCADE;--> statement-breakpoint
CREATE POLICY "posts-select-policy" ON "posts" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "posts-insert-policy" ON "posts" CASCADE;--> statement-breakpoint
CREATE POLICY "posts-insert-policy" ON "posts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "posts"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "posts-update-policy" ON "posts" CASCADE;--> statement-breakpoint
CREATE POLICY "posts-update-policy" ON "posts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "posts"."profile_id") WITH CHECK ((select auth.uid()) = "posts"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "posts-delete-policy" ON "posts" CASCADE;--> statement-breakpoint
CREATE POLICY "posts-delete-policy" ON "posts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "posts"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "topics-select-policy" ON "topics" CASCADE;--> statement-breakpoint
CREATE POLICY "topics-select-policy" ON "topics" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    DROP POLICY IF EXISTS "topics-insert-policy" ON "topics" CASCADE;
    CREATE POLICY "topics-insert-policy" ON "topics" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'content_admin')
            AND is_active = true
          ));
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    DROP POLICY IF EXISTS "topics-update-policy" ON "topics" CASCADE;
    CREATE POLICY "topics-update-policy" ON "topics" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
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
    DROP POLICY IF EXISTS "topics-delete-policy" ON "topics" CASCADE;
    CREATE POLICY "topics-delete-policy" ON "topics" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'content_admin')
            AND is_active = true
          ));
  END IF;
END $$;--> statement-breakpoint
DROP POLICY IF EXISTS "categories-select-policy" ON "categories" CASCADE;--> statement-breakpoint
CREATE POLICY "categories-select-policy" ON "categories" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    DROP POLICY IF EXISTS "categories-insert-policy" ON "categories" CASCADE;
    CREATE POLICY "categories-insert-policy" ON "categories" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'product_admin')
            AND is_active = true
          ));
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    DROP POLICY IF EXISTS "categories-update-policy" ON "categories" CASCADE;
    CREATE POLICY "categories-update-policy" ON "categories" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'product_admin')
            AND is_active = true
          )) WITH CHECK (EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'product_admin')
            AND is_active = true
          ));
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    DROP POLICY IF EXISTS "categories-delete-policy" ON "categories" CASCADE;
    CREATE POLICY "categories-delete-policy" ON "categories" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'product_admin')
            AND is_active = true
          ));
  END IF;
END $$;--> statement-breakpoint
DROP POLICY IF EXISTS "product-upvotes-select-policy" ON "product_upvotes" CASCADE;--> statement-breakpoint
CREATE POLICY "product-upvotes-select-policy" ON "product_upvotes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "product-upvotes-insert-policy" ON "product_upvotes" CASCADE;--> statement-breakpoint
CREATE POLICY "product-upvotes-insert-policy" ON "product_upvotes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "product_upvotes"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "product-upvotes-delete-policy" ON "product_upvotes" CASCADE;--> statement-breakpoint
CREATE POLICY "product-upvotes-delete-policy" ON "product_upvotes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "product_upvotes"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "products-select-policy" ON "products" CASCADE;--> statement-breakpoint
CREATE POLICY "products-select-policy" ON "products" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    DROP POLICY IF EXISTS "products-insert-policy" ON "products" CASCADE;
    CREATE POLICY "products-insert-policy" ON "products" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'product_admin')
            AND is_active = true
          ));
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    DROP POLICY IF EXISTS "products-update-policy" ON "products" CASCADE;
    CREATE POLICY "products-update-policy" ON "products" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'product_admin')
            AND is_active = true
          )) WITH CHECK (EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'product_admin')
            AND is_active = true
          ));
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    DROP POLICY IF EXISTS "products-delete-policy" ON "products" CASCADE;
    CREATE POLICY "products-delete-policy" ON "products" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = (select auth.uid())
            AND admin_role IN ('super_admin', 'product_admin')
            AND is_active = true
          ));
  END IF;
END $$;--> statement-breakpoint
DROP POLICY IF EXISTS "reviews-select-policy" ON "reviews" CASCADE;--> statement-breakpoint
CREATE POLICY "reviews-select-policy" ON "reviews" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "reviews-insert-policy" ON "reviews" CASCADE;--> statement-breakpoint
CREATE POLICY "reviews-insert-policy" ON "reviews" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "reviews"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "reviews-update-policy" ON "reviews" CASCADE;--> statement-breakpoint
CREATE POLICY "reviews-update-policy" ON "reviews" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "reviews"."profile_id") WITH CHECK ((select auth.uid()) = "reviews"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "reviews-delete-policy" ON "reviews" CASCADE;--> statement-breakpoint
CREATE POLICY "reviews-delete-policy" ON "reviews" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "reviews"."profile_id");--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_permissions' AND policyname = 'admin-permissions-insert-policy') THEN
      CREATE POLICY "admin-permissions-insert-policy" ON "admin_permissions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role = 'super_admin'
        AND is_active = true
      ));
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_permissions' AND policyname = 'admin-permissions-delete-policy') THEN
      CREATE POLICY "admin-permissions-delete-policy" ON "admin_permissions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role = 'super_admin'
        AND is_active = true
      ));
    END IF;
  END IF;
END $$;--> statement-breakpoint
DROP POLICY IF EXISTS "follows-select-policy" ON "follows" CASCADE;--> statement-breakpoint
CREATE POLICY "follows-select-policy" ON "follows" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "follows-insert-policy" ON "follows" CASCADE;--> statement-breakpoint
CREATE POLICY "follows-insert-policy" ON "follows" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "follows"."follower_id");--> statement-breakpoint
DROP POLICY IF EXISTS "follows-delete-policy" ON "follows" CASCADE;--> statement-breakpoint
CREATE POLICY "follows-delete-policy" ON "follows" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "follows"."follower_id");--> statement-breakpoint
DROP POLICY IF EXISTS "message-room-members-select-policy" ON "message_room_members" CASCADE;--> statement-breakpoint
CREATE POLICY "message-room-members-select-policy" ON "message_room_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM message_room_members mrm
        WHERE mrm.message_room_id = "message_room_members"."message_room_id"
        AND mrm.profile_id = (select auth.uid())
      ));--> statement-breakpoint
DROP POLICY IF EXISTS "message-room-members-insert-policy" ON "message_room_members" CASCADE;--> statement-breakpoint
CREATE POLICY "message-room-members-insert-policy" ON "message_room_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "message_room_members"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "message-room-members-update-policy" ON "message_room_members" CASCADE;--> statement-breakpoint
CREATE POLICY "message-room-members-update-policy" ON "message_room_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "message_room_members"."profile_id") WITH CHECK ((select auth.uid()) = "message_room_members"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "message-room-members-delete-policy" ON "message_room_members" CASCADE;--> statement-breakpoint
CREATE POLICY "message-room-members-delete-policy" ON "message_room_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "message_room_members"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "message-rooms-select-policy" ON "message_rooms" CASCADE;--> statement-breakpoint
CREATE POLICY "message-rooms-select-policy" ON "message_rooms" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM message_room_members
        WHERE message_room_id = "message_rooms"."message_room_id"
        AND profile_id = (select auth.uid())
      ));--> statement-breakpoint
DROP POLICY IF EXISTS "message-rooms-insert-policy" ON "message_rooms" CASCADE;--> statement-breakpoint
CREATE POLICY "message-rooms-insert-policy" ON "message_rooms" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
DROP POLICY IF EXISTS "message-rooms-update-policy" ON "message_rooms" CASCADE;--> statement-breakpoint
CREATE POLICY "message-rooms-update-policy" ON "message_rooms" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM message_room_members
        WHERE message_room_id = "message_rooms"."message_room_id"
        AND profile_id = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM message_room_members
        WHERE message_room_id = "message_rooms"."message_room_id"
        AND profile_id = (select auth.uid())
      ));--> statement-breakpoint
DROP POLICY IF EXISTS "message-rooms-delete-policy" ON "message_rooms" CASCADE;--> statement-breakpoint
CREATE POLICY "message-rooms-delete-policy" ON "message_rooms" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM message_room_members
        WHERE message_room_id = "message_rooms"."message_room_id"
        AND profile_id = (select auth.uid())
      ));--> statement-breakpoint
DROP POLICY IF EXISTS "messages-select-policy" ON "messages" CASCADE;--> statement-breakpoint
CREATE POLICY "messages-select-policy" ON "messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM message_room_members
        WHERE message_room_id = "messages"."message_room_id"
        AND profile_id = (select auth.uid())
      ));--> statement-breakpoint
DROP POLICY IF EXISTS "messages-insert-policy" ON "messages" CASCADE;--> statement-breakpoint
CREATE POLICY "messages-insert-policy" ON "messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "messages"."sender_id" AND EXISTS (
        SELECT 1 FROM message_room_members
        WHERE message_room_id = "messages"."message_room_id"
        AND profile_id = (select auth.uid())
      ));--> statement-breakpoint
DROP POLICY IF EXISTS "messages-update-policy" ON "messages" CASCADE;--> statement-breakpoint
CREATE POLICY "messages-update-policy" ON "messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "messages"."sender_id") WITH CHECK ((select auth.uid()) = "messages"."sender_id");--> statement-breakpoint
DROP POLICY IF EXISTS "messages-delete-policy" ON "messages" CASCADE;--> statement-breakpoint
CREATE POLICY "messages-delete-policy" ON "messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "messages"."sender_id");--> statement-breakpoint
DROP POLICY IF EXISTS "notifications-select-policy" ON "notifications" CASCADE;--> statement-breakpoint
CREATE POLICY "notifications-select-policy" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "notifications"."target_id");--> statement-breakpoint
DROP POLICY IF EXISTS "notifications-insert-policy" ON "notifications" CASCADE;--> statement-breakpoint
CREATE POLICY "notifications-insert-policy" ON "notifications" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
DROP POLICY IF EXISTS "notifications-update-policy" ON "notifications" CASCADE;--> statement-breakpoint
CREATE POLICY "notifications-update-policy" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "notifications"."target_id") WITH CHECK ((select auth.uid()) = "notifications"."target_id");--> statement-breakpoint
DROP POLICY IF EXISTS "notifications-delete-policy" ON "notifications" CASCADE;--> statement-breakpoint
CREATE POLICY "notifications-delete-policy" ON "notifications" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "notifications"."target_id");--> statement-breakpoint
DROP POLICY IF EXISTS "User can only update their own profiles" ON "profiles" CASCADE;--> statement-breakpoint
CREATE POLICY "User can only update their own profiles" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "profiles"."profile_id") WITH CHECK ((select auth.uid()) = "profiles"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "User can only delete their own profile" ON "profiles" CASCADE;--> statement-breakpoint
CREATE POLICY "User can only delete their own profile" ON "profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "profiles"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "Enable read access for all users" ON "profiles" CASCADE;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "profiles" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "profiles" CASCADE;--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_permissions' AND policyname = 'admin-permissions-select-policy') THEN
      CREATE POLICY "admin-permissions-select-policy" ON "admin_permissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "admin_permissions"."admin_id" OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND admin_role = 'super_admin'
        AND is_active = true
      ));
    END IF;
  END IF;
END $$;