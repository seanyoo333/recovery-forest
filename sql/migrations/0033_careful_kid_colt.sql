ALTER POLICY "message-room-members-insert-policy" ON "message_room_members" TO authenticated WITH CHECK ((select auth.uid()) = "message_room_members"."profile_id" OR (
        EXISTS (
          SELECT 1 FROM message_room_members mrm
          WHERE mrm.message_room_id = "message_room_members"."message_room_id"
          AND mrm.profile_id = (select auth.uid())
        )
        AND NOT EXISTS (
          SELECT 1 FROM messages
          WHERE message_room_id = "message_room_members"."message_room_id"
        )
      ));