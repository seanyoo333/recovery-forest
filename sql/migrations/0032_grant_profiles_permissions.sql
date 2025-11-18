-- Grant UPDATE permission to authenticated role on profiles table
-- This is required even when RLS is disabled
GRANT UPDATE ON TABLE "profiles" TO "authenticated";

