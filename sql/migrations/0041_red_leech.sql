ALTER POLICY "message-room-members-insert-policy" ON "message_room_members" TO authenticated WITH CHECK (true);--> statement-breakpoint
ALTER POLICY "message-room-members-update-policy" ON "message_room_members" TO authenticated USING ((select auth.uid()) = "message_room_members"."profile_id") WITH CHECK ((select auth.uid()) = "message_room_members"."profile_id");--> statement-breakpoint
ALTER POLICY "messages-select-policy" ON "messages" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "messages-insert-policy" ON "messages" TO authenticated WITH CHECK (true);