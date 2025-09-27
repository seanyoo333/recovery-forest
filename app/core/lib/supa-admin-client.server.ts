/**
 * Supabase Admin Client Module
 *
 * This module creates and exports a Supabase client with admin privileges using the service role key.
 * The admin client has elevated permissions and can bypass Row Level Security (RLS) policies,
 * allowing it to perform administrative operations that regular user clients cannot.
 *
 * SECURITY WARNING: This client should only be used in server-side code and never exposed to the client.
 * The service role key has full access to the database and can bypass all security rules.
 *
 * Use cases for the admin client include:
 * - User management operations (creating, updating, deleting users)
 * - Data migrations and seeding
 * - Administrative operations that need to bypass RLS
 * - Background jobs and scheduled tasks
 * - Server-side operations that need elevated permissions
 */
import type { Database as SupabaseDatabase } from "database.types";
import type { MergeDeep, SetFieldType, SetNonNullable } from "type-fest";

import { createClient } from "@supabase/supabase-js";

export type Database = MergeDeep<
  SupabaseDatabase,
  {
    public: {
      Views: {
        messages_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["messages_view"]["Row"]
          >;
        };
        product_list_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["product_list_view"]["Row"]
          >;
        };
        community_post_list_view: {
          Row: SetFieldType<
            SetNonNullable<
              SupabaseDatabase["public"]["Views"]["community_post_list_view"]["Row"]
            >,
            "author_avatar",
            string | null
          >;
        };
        product_overview_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["product_overview_view"]["Row"]
          >;
        };
        community_post_detail: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["community_post_detail"]["Row"]
          >;
        };
        gpt_ideas_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["gpt_ideas_view"]["Row"]
          >;
        };
        profiles_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["profiles_view"]["Row"]
          >;
        };
      };
    };
  }
>;

/**
 * Supabase admin client with service role privileges
 *
 * This client uses the SUPABASE_SERVICE_ROLE_KEY which gives it admin privileges,
 * allowing it to bypass Row Level Security (RLS) policies and perform administrative
 * operations on the database.
 *
 * IMPORTANT: This client should only be used in server-side code and for operations
 * that specifically require admin privileges. For regular operations, use the
 * makeServerClient function instead.
 */
const adminClient = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default adminClient;

export const makeAdminClient = () => {
  createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
};
