ALTER POLICY "bot-message-rooms-update-policy" ON "bot_message_rooms" TO authenticated USING (EXISTS (
        SELECT 1 FROM bot_message_room_members
        WHERE bot_message_room_id = "bot_message_rooms"."bot_message_room_id"
        AND profile_id = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM bot_message_room_members
        WHERE bot_message_room_id = "bot_message_rooms"."bot_message_room_id"
        AND profile_id = (select auth.uid())
      ));--> statement-breakpoint
ALTER POLICY "bot-message-rooms-delete-policy" ON "bot_message_rooms" TO authenticated USING (EXISTS (
        SELECT 1 FROM bot_message_room_members
        WHERE bot_message_room_id = "bot_message_rooms"."bot_message_room_id"
        AND profile_id = (select auth.uid())
      ));--> statement-breakpoint
ALTER POLICY "bot-messages-select-policy" ON "bot_messages" TO authenticated USING (true);