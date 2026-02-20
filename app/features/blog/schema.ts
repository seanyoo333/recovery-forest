/**
 * Blog Schema
 *
 * blog_posts_meta: 목록/검색/필터용 공용 인덱스 (MDX 홈페이지 + 네이버 등 외부)
 * blog_post_sources: 외부 글 원문/캐시 (네이버 블로그 등)
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

import { profiles } from "../users/schema";

/**
 * Blog Post Sources - 외부 글 원문/캐시
 * 네이버 블로그 등 URL이 원본인 콘텐츠 저장
 */
export const blogPostSources = pgTable(
  "blog_post_sources",
  {
    id: uuid().primaryKey().defaultRandom(),
    source: text().notNull().default("naver").$type<"naver" | "other">(),
    source_url: text().notNull(),
    title: text().notNull(),
    published_at: timestamp(),
    raw_html: text(),
    raw_text: text(),
    clean_text: text(),
    checksum: text(),
    fetched_at: timestamp().notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("blog_post_sources_source_url_unique").on(table.source_url),
    pgPolicy("blog-post-sources-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("blog-post-sources-insert-policy", {
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
    pgPolicy("blog-post-sources-update-policy", {
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
    pgPolicy("blog-post-sources-delete-policy", {
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
    upvotes: bigint({ mode: "number" }).default(0),
    source: text().$type<"mdx" | "naver" | "other">().default("mdx"),
    canonical_url: text(),
    content_ref_id: uuid().references(() => blogPostSources.id, {
      onDelete: "set null",
    }),
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
    // Allow upvotes to be updated (via trigger)
    pgPolicy("blog-posts-meta-update-upvotes-policy", {
      for: "update",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const blogPostUpvotes = pgTable(
  "blog_post_upvotes",
  {
    post_id: bigint({ mode: "number" }).references(
      () => blogPostsMeta.post_id,
      {
        onDelete: "cascade",
      },
    ),
    profile_id: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    primaryKey({ columns: [table.post_id, table.profile_id] }),
    // All users can read upvote information
    pgPolicy("blog-post-upvotes-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // Authenticated users can create upvotes
    pgPolicy("blog-post-upvotes-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // Authenticated users can delete their own upvotes
    pgPolicy("blog-post-upvotes-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
  ],
);
