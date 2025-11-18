ALTER POLICY "message-room-members-insert-policy" ON "message_room_members" TO authenticated WITH CHECK ((select auth.uid()) = "message_room_members"."profile_id" OR (
        EXISTS (
          SELECT 1 FROM public.message_rooms mr
          WHERE mr.message_room_id = "message_room_members"."message_room_id"
          AND mr.created_at > NOW() - INTERVAL '1 minute'
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.messages
          WHERE message_room_id = "message_room_members"."message_room_id"
        )
      ));--> statement-breakpoint
ALTER POLICY "messages-select-policy" ON "messages" TO authenticated USING (EXISTS (
        SELECT 1 FROM message_room_members
        WHERE message_room_id = "messages"."message_room_id"
        AND profile_id = (select auth.uid())
      ));