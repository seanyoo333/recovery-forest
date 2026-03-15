/**
 * Payment System Database Queries
 *
 * This file contains functions for interacting with the payment records
 * in the database. It provides a clean interface for fetching payment data
 * while handling errors appropriately.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * Retrieve all payment records for a specific user
 *
 * This function fetches the complete payment history for a user,
 * including all payment details like amount, status, and timestamps.
 * The RLS policies ensure users can only access their own payment records.
 *
 * @param client - Authenticated Supabase client instance
 * @param profileId - The profile ID of the user whose payments to retrieve
 * @returns An array of payment records for the specified user
 * @throws Will throw an error if the database query fails
 */
export async function getPayments(
  client: SupabaseClient<Database>,
  { profileId }: { profileId: string },
) {
  const { data, error } = await client
    .from("payments")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data ?? [];
}

/**
 * Retrieve all point payment records for a specific user
 *
 * @param client - Authenticated Supabase client instance
 * @param profileId - The profile ID of the user
 * @returns An array of point payment records
 */
export async function getPointPayments(
  client: SupabaseClient<Database>,
  { profileId }: { profileId: string },
) {
  const { data, error } = await client
    .from("point_payments")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data ?? [];
}
