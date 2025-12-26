DROP POLICY IF EXISTS "Enable read access for all users" ON "bot_message_room_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-message-room-members-insert-policy" ON "bot_message_room_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-message-room-members-update-policy" ON "bot_message_room_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-message-room-members-delete-policy" ON "bot_message_room_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable read access for all users" ON "bot_message_rooms" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-message-rooms-insert-policy" ON "bot_message_rooms" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-message-rooms-update-policy" ON "bot_message_rooms" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-message-rooms-delete-policy" ON "bot_message_rooms" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-messages-select-policy" ON "bot_messages" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-messages-insert-policy" ON "bot_messages" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-messages-update-policy" ON "bot_messages" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-messages-delete-policy" ON "bot_messages" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable read access for all users" ON "message_room_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "message-room-members-insert-policy" ON "message_room_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "message-room-members-update-policy" ON "message_room_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "message-room-members-delete-policy" ON "message_room_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable read access for all users" ON "message_rooms" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "message-rooms-insert-policy" ON "message_rooms" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "message-rooms-update-policy" ON "message_rooms" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "message-rooms-delete-policy" ON "message_rooms" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "messages-select-policy" ON "messages" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "messages-insert-policy" ON "messages" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "messages-update-policy" ON "messages" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "messages-delete-policy" ON "messages" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "bot-message-room-members select" ON "bot_message_room_members" CASCADE;--> statement-breakpoint
CREATE POLICY "bot-message-room-members select" ON "bot_message_room_members" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "bot-message-room-members policy" ON "bot_message_room_members" CASCADE;--> statement-breakpoint
CREATE POLICY "bot-message-room-members policy" ON "bot_message_room_members" AS PERMISSIVE FOR ALL TO "authenticated" USING (public.is_bot_user_member("bot_message_room_members"."bot_message_room_id", (select auth.uid()))) WITH CHECK (public.is_bot_user_member("bot_message_room_members"."bot_message_room_id", (select auth.uid())));--> statement-breakpoint
DROP POLICY IF EXISTS "bot-message-rooms select" ON "bot_message_rooms" CASCADE;--> statement-breakpoint
CREATE POLICY "bot-message-rooms select" ON "bot_message_rooms" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "bot-message-rooms policy" ON "bot_message_rooms" CASCADE;--> statement-breakpoint
CREATE POLICY "bot-message-rooms policy" ON "bot_message_rooms" AS PERMISSIVE FOR ALL TO "authenticated" USING (public.is_bot_user_member("bot_message_rooms"."bot_message_room_id", (select auth.uid()))) WITH CHECK (public.is_bot_user_member("bot_message_rooms"."bot_message_room_id", (select auth.uid())));--> statement-breakpoint
DROP POLICY IF EXISTS "bot-messages select" ON "bot_messages" CASCADE;--> statement-breakpoint
CREATE POLICY "bot-messages select" ON "bot_messages" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "bot-messages policy" ON "bot_messages" CASCADE;--> statement-breakpoint
CREATE POLICY "bot-messages policy" ON "bot_messages" AS PERMISSIVE FOR ALL TO "authenticated" USING (public.is_bot_user_member("bot_messages"."bot_message_room_id", (select auth.uid()))) WITH CHECK (public.is_bot_user_member("bot_messages"."bot_message_room_id", (select auth.uid())));--> statement-breakpoint
DROP POLICY IF EXISTS "message-room-members select" ON "message_room_members" CASCADE;--> statement-breakpoint
CREATE POLICY "message-room-members select" ON "message_room_members" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "message-room-members policy" ON "message_room_members" CASCADE;--> statement-breakpoint
CREATE POLICY "message-room-members policy" ON "message_room_members" AS PERMISSIVE FOR ALL TO "authenticated" USING (public.is_user_member("message_room_members"."message_room_id", (select auth.uid()))) WITH CHECK (public.is_user_member("message_room_members"."message_room_id", (select auth.uid())));--> statement-breakpoint
DROP POLICY IF EXISTS "message-rooms select" ON "message_rooms" CASCADE;--> statement-breakpoint
CREATE POLICY "message-rooms select" ON "message_rooms" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "message-rooms policy" ON "message_rooms" CASCADE;--> statement-breakpoint
CREATE POLICY "message-rooms policy" ON "message_rooms" AS PERMISSIVE FOR ALL TO "authenticated" USING (public.is_user_member("message_rooms"."message_room_id", (select auth.uid()))) WITH CHECK (public.is_user_member("message_rooms"."message_room_id", (select auth.uid())));--> statement-breakpoint
DROP POLICY IF EXISTS "messages select" ON "messages" CASCADE;--> statement-breakpoint
CREATE POLICY "messages select" ON "messages" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
DROP POLICY IF EXISTS "messages policy" ON "messages" CASCADE;--> statement-breakpoint
CREATE POLICY "messages policy" ON "messages" AS PERMISSIVE FOR ALL TO "authenticated" USING (public.is_user_member("messages"."message_room_id", (select auth.uid()))) WITH CHECK (public.is_user_member("messages"."message_room_id", (select auth.uid())));