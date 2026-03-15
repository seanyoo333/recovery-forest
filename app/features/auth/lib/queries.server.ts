/**
 * Authentication Database Queries
 *
 * This file contains server-side database queries related to user authentication.
 * It provides utility functions to check user existence and other auth-related operations.
 */
import { count, eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import db from "~/core/db/drizzle-client.server";
import { profiles } from "~/features/users/schema";

/**
 * Check if a user with the given email already exists in the database
 *
 * This function is used during registration to prevent duplicate accounts.
 *
 * @param email - The email address to check
 * @returns A boolean indicating whether the user exists (true) or not (false)
 */
export async function doesUserExist(email: string) {
  const totalUsers = await db
    .select({
      count: count(),
    })
    .from(authUsers)
    .where(eq(authUsers.email, email));

  return totalUsers[0].count > 0;
}

/**
 * Check if a username is already taken in the profiles table
 *
 * This function is used during registration to prevent duplicate usernames.
 *
 * @param username - The username to check
 * @returns A boolean indicating whether the username exists (true) or not (false)
 */
export async function doesUsernameExist(username: string) {
  const result = await db
    .select({
      count: count(),
    })
    .from(profiles)
    .where(eq(profiles.username, username));

  return result[0].count > 0;
}
