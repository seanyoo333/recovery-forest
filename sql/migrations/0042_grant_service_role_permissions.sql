-- Grant permissions to service_role for message tables
-- This allows adminClient (which uses service_role) to bypass RLS and perform operations
-- Service role is used for server-side operations that need elevated permissions

-- Message tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "message_rooms" TO "service_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "message_room_members" TO "service_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "messages" TO "service_role";

-- Also grant usage on sequences (for auto-increment columns)
GRANT USAGE, SELECT ON SEQUENCE "message_rooms_message_room_id_seq" TO "service_role";
GRANT USAGE, SELECT ON SEQUENCE "messages_message_id_seq" TO "service_role";

