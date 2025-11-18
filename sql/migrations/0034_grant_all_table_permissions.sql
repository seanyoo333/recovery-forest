-- Grant necessary permissions to authenticated role on all tables
-- This is required even when RLS is enabled
-- RLS policies define which rows can be accessed, but GRANT defines table-level access

-- Set default privileges for future tables
-- This ensures that new tables created in the public schema will automatically
-- have the necessary permissions granted to the authenticated role
ALTER DEFAULT PRIVILEGES IN SCHEMA "public"
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "authenticated";

-- Grant permissions on existing tables
-- Community tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "posts" TO "authenticated";
GRANT SELECT, INSERT, DELETE ON TABLE "post_replies" TO "authenticated";
GRANT SELECT, INSERT, DELETE ON TABLE "post_upvotes" TO "authenticated";
GRANT SELECT, INSERT, DELETE ON TABLE "post_reply_upvotes" TO "authenticated";
GRANT SELECT ON TABLE "topics" TO "authenticated";
GRANT SELECT ON TABLE "categories" TO "authenticated";

-- User tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "profiles" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "follows" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "notifications" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "admin_permissions" TO "authenticated";

-- Message tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "message_rooms" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "message_room_members" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "messages" TO "authenticated";

-- Product tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "products" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "reviews" TO "authenticated";
GRANT SELECT, INSERT, DELETE ON TABLE "product_upvotes" TO "authenticated";

-- Payment tables
GRANT SELECT, INSERT, UPDATE ON TABLE "payments" TO "authenticated";
GRANT SELECT, INSERT, UPDATE ON TABLE "point_payments" TO "authenticated";

-- Clinic tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "clinics" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "clinic_photos" TO "authenticated";

-- Team tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "teams" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "programs" TO "authenticated";

-- Analytics tables
GRANT SELECT, INSERT ON TABLE "events" TO "authenticated";

-- Chat tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "bot_message_rooms" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "bot_message_room_members" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "bot_messages" TO "authenticated";

