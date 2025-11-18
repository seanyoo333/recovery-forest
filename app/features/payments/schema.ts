/**
 * Payment System Schema
 *
 * This file defines the database schema for payment records and sets up
 * Supabase Row Level Security (RLS) policies to control data access.
 * The schema is designed to work with payment processors like Toss Payments
 * (as indicated by the imports in package.json).
 */
import { sql } from "drizzle-orm";
import {
  doublePrecision,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { makeIdentityColumn, timestamps } from "~/core/db/helpers.server";

import { profiles } from "../users/schema";

/**
 * Payments Table
 *
 * Stores payment transaction records with details from the payment processor.
 * Links to Supabase auth.users table via user_id foreign key.
 *
 * Includes Row Level Security (RLS) policy to ensure users can only
 * view their own payment records.
 */
export const payments = pgTable(
  "payments",
  {
    // Auto-incrementing primary key for payment records
    ...makeIdentityColumn("payment_id"),
    // Payment processor's unique identifier for the transaction
    payment_key: text().notNull(),
    // Unique identifier for the order in your system
    order_id: text().notNull(),
    // Human-readable name for the order
    order_name: text().notNull(),
    // Total amount of the payment transaction
    total_amount: doublePrecision().notNull(),
    // Custom metadata about the payment (product details, etc.)
    metadata: jsonb().notNull(),
    // Complete raw response from the payment processor
    raw_data: jsonb().notNull(),
    // URL to the payment receipt provided by the processor
    receipt_url: text().notNull(),
    // Current status of the payment (e.g., "approved", "failed")
    status: text().notNull(),
    // Foreign key to the user who made the payment
    // Using CASCADE ensures payment records are deleted when user is deleted
    profile_id: uuid()
      .references(() => profiles.profile_id, { onDelete: "cascade" })
      .notNull(),
    // When the payment was approved by the processor
    approved_at: timestamp().notNull(),
    // When the payment was initially requested
    requested_at: timestamp().notNull(),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only view their own payment records
    pgPolicy("payments-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
    // RLS Policy: Users can only create their own payment records
    pgPolicy("payments-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // RLS Policy: Users can only update their own payment records (for status updates, etc.)
    pgPolicy("payments-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // RLS Policy: Users cannot delete payment records (audit trail)
    // DELETE 정책은 추가하지 않음 (결제 내역은 감사 목적으로 삭제 불가)
  ],
);

// 포인트 거래 내역 테이블
export const pointPayments = pgTable(
  "point_payments",
  {
    ...makeIdentityColumn("payment_id"),
    payment_key: text().notNull(),
    order_id: text().notNull(),
    order_name: text().notNull(),
    total_amount: doublePrecision().notNull(),
    metadata: jsonb().notNull(),
    raw_data: jsonb().notNull(),
    receipt_url: text().notNull(),
    status: text().notNull(),
    profile_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    approved_at: timestamp().notNull(),
    requested_at: timestamp().notNull(),
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only view their own payment records
    pgPolicy("point-payments-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
    // RLS Policy: Users can only create their own payment records
    pgPolicy("point-payments-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // RLS Policy: Users can only update their own payment records (for status updates, etc.)
    pgPolicy("point-payments-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // RLS Policy: Users cannot delete payment records (audit trail)
    // DELETE 정책은 추가하지 않음 (결제 내역은 감사 목적으로 삭제 불가)
  ],
);
