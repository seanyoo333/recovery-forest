ALTER POLICY "bot-message-room-members-select-policy" ON "bot_message_room_members" RENAME TO "Enable read access for all users";--> statement-breakpoint
ALTER POLICY "bot-message-room-members-insert-policy" ON "bot_message_room_members" RENAME TO "message-rooms-insert-policy";--> statement-breakpoint
ALTER POLICY "bot-message-rooms-select-policy" ON "bot_message_rooms" RENAME TO "Enable read access for all users";--> statement-breakpoint
ALTER POLICY "bot-message-rooms-update-policy" ON "bot_message_rooms" TO authenticated USING (EXISTS (
        SELECT 1 FROM message_room_members
        WHERE bot_message_room_id = "bot_message_rooms"."bot_message_room_id"
        AND profile_id = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM message_room_members
        WHERE bot_message_room_id = "bot_message_rooms"."bot_message_room_id"
        AND profile_id = (select auth.uid())
      ));--> statement-breakpoint
ALTER POLICY "bot-message-rooms-delete-policy" ON "bot_message_rooms" TO authenticated USING (EXISTS (
        SELECT 1 FROM message_room_members
        WHERE bot_message_room_id = "bot_message_rooms"."bot_message_room_id"
        AND profile_id = (select auth.uid())
      ));--> statement-breakpoint
ALTER POLICY "bot-messages-select-policy" ON "bot_messages" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "bot-messages-insert-policy" ON "bot_messages" TO authenticated WITH CHECK (true);