DROP POLICY "bot-message-room-members policy" ON "bot_message_room_members" CASCADE;--> statement-breakpoint
DROP POLICY "bot-message-rooms policy" ON "bot_message_rooms" CASCADE;--> statement-breakpoint
DROP POLICY "bot-messages policy" ON "bot_messages" CASCADE;--> statement-breakpoint
CREATE POLICY "bot-message-room-members insert" ON "bot_message_room_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("bot_message_room_members"."profile_id" = (select auth.uid()) AND EXISTS (
        SELECT 1 FROM "bot_message_rooms"
        WHERE "bot_message_rooms"."bot_message_room_id" = "bot_message_room_members"."bot_message_room_id"
        AND "bot_message_rooms"."created_by" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "bot-message-room-members update" ON "bot_message_room_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.is_bot_user_member("bot_message_room_members"."bot_message_room_id", (select auth.uid()))) WITH CHECK (public.is_bot_user_member("bot_message_room_members"."bot_message_room_id", (select auth.uid())));--> statement-breakpoint
CREATE POLICY "bot-message-room-members delete" ON "bot_message_room_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.is_bot_user_member("bot_message_room_members"."bot_message_room_id", (select auth.uid())));--> statement-breakpoint
CREATE POLICY "bot-message-rooms insert" ON "bot_message_rooms" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("bot_message_rooms"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "bot-message-rooms update" ON "bot_message_rooms" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.is_bot_user_member("bot_message_rooms"."bot_message_room_id", (select auth.uid()))) WITH CHECK (public.is_bot_user_member("bot_message_rooms"."bot_message_room_id", (select auth.uid())));--> statement-breakpoint
CREATE POLICY "bot-message-rooms delete" ON "bot_message_rooms" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.is_bot_user_member("bot_message_rooms"."bot_message_room_id", (select auth.uid())));--> statement-breakpoint
CREATE POLICY "bot-messages insert ai" ON "bot_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("bot_messages"."sender_id" = 'ai-assistant' AND public.is_bot_user_member("bot_messages"."bot_message_room_id", (select auth.uid())));--> statement-breakpoint
CREATE POLICY "bot-messages insert user" ON "bot_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("bot_messages"."sender_id" = (select auth.uid())::text AND public.is_bot_user_member("bot_messages"."bot_message_room_id", (select auth.uid())));--> statement-breakpoint
CREATE POLICY "bot-messages update" ON "bot_messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.is_bot_user_member("bot_messages"."bot_message_room_id", (select auth.uid()))) WITH CHECK (public.is_bot_user_member("bot_messages"."bot_message_room_id", (select auth.uid())));--> statement-breakpoint
CREATE POLICY "bot-messages delete" ON "bot_messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.is_bot_user_member("bot_messages"."bot_message_room_id", (select auth.uid())));