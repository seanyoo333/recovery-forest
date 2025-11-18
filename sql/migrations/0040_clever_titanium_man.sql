ALTER POLICY "message-room-members-insert-policy" ON "message_room_members" TO authenticated WITH CHECK (
    (select auth.uid()) = "message_room_members"."profile_id"
  );