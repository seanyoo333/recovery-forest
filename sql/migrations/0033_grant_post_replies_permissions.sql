-- Grant INSERT, UPDATE, DELETE permissions to authenticated role on post_replies table
-- This is required even when RLS is enabled
GRANT INSERT, UPDATE, DELETE ON TABLE "post_replies" TO "authenticated";

