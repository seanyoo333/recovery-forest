/**
 * Database Helper Functions
 *
 * This file provides utility functions and objects for database schema definitions.
 * These helpers ensure consistent patterns across all database tables.
 */
import { sql } from "drizzle-orm";
import { bigint, timestamp } from "drizzle-orm/pg-core";

/**
 * Standard timestamp columns for database tables
 *
 * Adds created_at and updated_at columns to any table where this object is spread.
 * Both columns are automatically set to the current Korean time (KST, UTC+9) when records are created,
 * and updated_at is refreshed when records are updated.
 */
export const timestamps = {
  updated_at: timestamp()
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  created_at: timestamp()
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
};

/**
 * Creates an auto-incrementing primary key column
 *
 * @param name - The name of the primary key column (e.g., "user_id", "payment_id")
 * @returns An object with the named column configured as a bigint primary key with IDENTITY
 *
 * This function creates a PostgreSQL IDENTITY column that auto-increments,
 * which is ideal for primary keys that don't need to be UUIDs.
 */
export function makeIdentityColumn(name: string) {
  return {
    [name]: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  };
}
