/**
 * Blog Schema
 *
 * Defines the blog_posts_meta table and associated RLS policies using
 * the same Drizzle pattern as other feature schemas.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

import { profiles } from "../users/schema";

export const blogPostsMeta = pgTable(
  "blog_posts_meta",
  {
    post_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    slug: text().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    category: text().notNull(),
    author: text().notNull(),
    date: timestamp().notNull(),
    featured_image_url: text(),
    mdx_file_path: text().notNull(),
    naver_blog_url: text(),
    naver_post_id: text(),
    imported_at: timestamp(),
    is_curated: boolean().default(false),
    curation_notes: text(),
    published_at: timestamp(),
    is_published: boolean().default(false),
    email_sent: boolean().default(false),
    profile_id: uuid()
      .references(() => profiles.profile_id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps,
  },
  (table) => [
    // Unique slug constraint
    uniqueIndex("blog_posts_meta_slug_unique").on(table.slug),
    // Allow anyone to read published posts
    pgPolicy("blog-posts-meta-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // Only admins can insert
    pgPolicy("blog-posts-meta-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    // Only admins can update
    pgPolicy("blog-posts-meta-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    // Only admins can delete
    pgPolicy("blog-posts-meta-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
  ],
);
