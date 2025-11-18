-- Fix message_room_members select policy to allow all users to read
-- This is needed to display participant information in message rooms
DROP POLICY IF EXISTS "message-room-members-select-policy" ON "message_room_members" CASCADE;
DROP POLICY IF EXISTS "Enable read access for all users" ON "message_room_members" CASCADE;

CREATE POLICY "Enable read access for all users" ON "message_room_members" 
AS PERMISSIVE FOR SELECT TO "public" 
USING (true);

