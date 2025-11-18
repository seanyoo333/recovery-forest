/**
 * Authentication and Request Guards Module
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { data } from "react-router";

/**
 * Require user authentication for a route or action
 *
 * @param client - The Supabase client instance
 * @throws {Response} 401 Unauthorized if no user is authenticated
 */
export async function requireAuthentication(client: SupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw data(null, { status: 401 });
  }
}

/**
 * Require a specific HTTP method for a route action
 *
 * @param method - The required HTTP method
 * @returns A function that validates the request method
 * @throws {Response} 405 Method Not Allowed if the request uses an incorrect method
 */
export function requireMethod(method: string) {
  return (request: Request) => {
    if (request.method !== method) {
      throw data(null, { status: 405 });
    }
  };
}

/**
 * Require admin role for a route or action
 *
 * @param client - The Supabase client instance
 * @throws {Response} 401 Unauthorized if user is not authenticated
 * @throws {Response} 403 Forbidden if user doesn't have an active admin role
 */
export async function requireAdminRole(client: SupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw data(null, { status: 401 });
  }

  const { data: adminPermission, error } = await client
    .from("admin_permissions")
    .select("admin_role")
    .eq("admin_id", user.id)
    .eq("is_active", true)
    .single();

  if (error || !adminPermission) {
    throw data(null, { status: 403 });
  }
}

/**
 * Check if user has admin role (non-throwing version)
 *
 * @param client - The Supabase client instance
 * @returns Promise<boolean> - True if user has an active admin role
 */
export async function checkAdminRole(client: SupabaseClient): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: adminPermission, error } = await client
      .from("admin_permissions")
      .select("admin_role")
      .eq("admin_id", user.id)
      .eq("is_active", true)
      .single();

    return !error && !!adminPermission;
  } catch {
    return false;
  }
}
