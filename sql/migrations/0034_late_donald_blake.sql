ALTER POLICY "message-room-members-update-policy" ON "message_room_members" TO authenticated USING (EXISTS (
        SELECT 1 FROM message_room_members mrm
        WHERE mrm.message_room_id = "message_room_members"."message_room_id"
        AND mrm.profile_id = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM message_room_members mrm
        WHERE mrm.message_room_id = "message_room_members"."message_room_id"
        AND mrm.profile_id = (select auth.uid())
      ));