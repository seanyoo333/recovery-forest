ALTER POLICY "message-room-members-insert-policy" ON "message_room_members" TO authenticated WITH CHECK (
    );--> statement-breakpoint
ALTER POLICY "messages-select-policy" ON "messages" TO authenticated USING ((select auth.uid()) = "messages"."sender_id");