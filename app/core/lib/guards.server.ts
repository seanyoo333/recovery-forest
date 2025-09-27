/**
 * Authentication and Request Guards Module
 *
 * This module provides utility functions for protecting routes and API endpoints
 * by enforcing authentication and HTTP method requirements. These guards are designed
 * to be used in React Router loaders and actions to ensure proper access control
 * and request validation.
 *
 * The module includes:
 * - Authentication guard to ensure a user is logged in
 * - HTTP method guard to ensure requests use the correct HTTP method
 * - Admin role guard to ensure only administrators can access certain routes
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { data } from "react-router";

/**
 * Require user authentication for a route or action
 *
 * This function checks if a user is currently authenticated by querying the Supabase
 * client. If no user is found, it throws a 401 Unauthorized response, which will be
 * handled by React Router's error boundary system.
 *
 * @example
 * // In a loader or action function
 * export async function loader({ request }: LoaderArgs) {
 *   const [client] = makeServerClient(request);
 *   await requireAuthentication(client);
 *
 *   // Continue with authenticated logic...
 *   return json({ ... });
 * }
 *
 * @param client - The Supabase client instance to use for authentication check
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
 * This function returns a middleware that checks if the incoming request uses
 * the specified HTTP method. If not, it throws a 405 Method Not Allowed response.
 * This is useful for ensuring that endpoints only accept the intended HTTP methods.
 *
 * @example
 * // In an action function
 * export async function action({ request }: ActionArgs) {
 *   requireMethod('POST')(request);
 *
 *   // Continue with POST-specific logic...
 *   return json({ ... });
 * }
 *
 * @param method - The required HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE')
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
 * Require admin role for a route or action (Legacy - for backward compatibility)
 *
 * This function checks if the authenticated user has admin privileges by querying
 * the user's role from the profiles table. If the user is not an admin, it throws
 * a 403 Forbidden response.
 *
 * @deprecated Use requireAdminPermission instead
 * @param client - The Supabase client instance to use for role check
 * @throws {Response} 403 Forbidden if user is not an admin
 */
export async function requireAdminRole(client: SupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw data(null, { status: 401 });
  }

  // Check user role from profiles table
  const { data: profile, error } = await client
    .from("profiles")
    .select("role")
    .eq("profile_id", user.id)
    .single();

  if (error || !profile) {
    throw data(null, { status: 403 });
  }

  // Check if user has admin role
  if (profile.role !== "admin") {
    throw data(null, { status: 403 });
  }
}

/**
 * Check if user has admin role (non-throwing version) - Legacy
 *
 * @deprecated Use checkAdminPermission instead
 * @param client - The Supabase client instance to use for role check
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export async function checkAdminRole(client: SupabaseClient): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return false;
    }

    // Check user role from profiles table
    const { data: profile, error } = await client
      .from("profiles")
      .select("role")
      .eq("profile_id", user.id)
      .single();

    if (error || !profile) {
      return false;
    }

    return profile.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Require specific admin permission for a route or action
 *
 * This function checks if the authenticated user has the specified admin permission
 * by querying the admin_permissions table. If the user doesn't have the required
 * permission, it throws a 403 Forbidden response.
 *
 * @example
 * // In a loader or action function
 * export async function loader({ request }: LoaderArgs) {
 *   const [client] = makeServerClient(request);
 *   await requireAuthentication(client);
 *   await requireAdminPermission(client, "can_manage_products");
 *
 *   // Continue with admin-only logic...
 *   return json({ ... });
 * }
 *
 * @param client - The Supabase client instance to use for permission check
 * @param permission - The specific permission to check (e.g., "can_manage_products")
 * @throws {Response} 403 Forbidden if user doesn't have the required permission
 */
export async function requireAdminPermission(
  client: SupabaseClient,
  permission: string,
) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw data(null, { status: 401 });
  }

  // First check if user has legacy admin role
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("profile_id", user.id)
    .single();

  if (!profileError && profile && profile.role === "admin") {
    // Legacy admin has all permissions
    return;
  }

  // Check admin permission from admin_permissions table
  const { data: adminPermission, error } = await client
    .from("admin_permissions")
    .select("permissions, admin_role")
    .eq("admin_id", user.id)
    .eq("is_active", true)
    .single();

  if (error || !adminPermission) {
    throw data(null, { status: 403 });
  }

  // Super admin has all permissions
  if (adminPermission.admin_role === "super_admin") {
    return;
  }

  // Check specific permission
  const permissions = adminPermission.permissions as Record<string, boolean>;
  if (!permissions[permission]) {
    throw data(null, { status: 403 });
  }
}

/**
 * Check if user has specific admin permission (non-throwing version)
 *
 * This function checks if the authenticated user has the specified admin permission
 * without throwing an error. It returns a boolean indicating whether the user has
 * the required permission.
 *
 * @example
 * // In a component or utility function
 * const canManageProducts = await checkAdminPermission(client, "can_manage_products");
 * if (canManageProducts) {
 *   // Show product management features
 * }
 *
 * @param client - The Supabase client instance to use for permission check
 * @param permission - The specific permission to check
 * @returns Promise<boolean> - True if user has the permission, false otherwise
 */
export async function checkAdminPermission(
  client: SupabaseClient,
  permission: string,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return false;
    }

    // First check if user has legacy admin role
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role")
      .eq("profile_id", user.id)
      .single();

    if (!profileError && profile && profile.role === "admin") {
      // Legacy admin has all permissions
      return true;
    }

    // Check admin permission from admin_permissions table
    const { data: adminPermission, error } = await client
      .from("admin_permissions")
      .select("permissions, admin_role")
      .eq("admin_id", user.id)
      .eq("is_active", true)
      .single();

    if (error || !adminPermission) {
      return false;
    }

    // Super admin has all permissions
    if (adminPermission.admin_role === "super_admin") {
      return true;
    }

    // Check specific permission
    const permissions = adminPermission.permissions as Record<string, boolean>;
    return permissions[permission] || false;
  } catch {
    return false;
  }
}

/**
 * Log admin activity for audit trail
 *
 * This function logs admin activities for security and audit purposes.
 * It should be called after successful admin actions.
 *
 * @param client - The Supabase client instance
 * @param action - The action performed (e.g., "create_product", "update_user")
 * @param targetType - The type of target (e.g., "product", "user", "clinic")
 * @param targetId - The ID of the target (optional)
 * @param details - Additional details about the action (optional)
 * @param request - The request object for IP and user agent (optional)
 */
export async function logAdminActivity(
  client: SupabaseClient,
  action: string,
  targetType: string,
  targetId?: string,
  details?: Record<string, any>,
  request?: Request,
) {
  try {
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return;
    }

    const logData: any = {
      admin_id: user.id,
      action,
      target_type: targetType,
      details,
    };

    if (targetId) {
      logData.target_id = targetId;
    }

    if (request) {
      const forwarded = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      logData.ip_address = forwarded || realIp || "unknown";
      logData.user_agent = request.headers.get("user-agent") || "unknown";
    }

    await client.from("admin_activity_logs").insert(logData);
  } catch (error) {
    // Log error but don't throw - admin activity logging shouldn't break the main flow
    console.error("Failed to log admin activity:", error);
  }
}
