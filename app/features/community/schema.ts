import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  jsonb,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

import { profiles } from "../users/schema";

export const topics = pgTable(
  "topics",
  {
    topic_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    name: text().notNull(),
    slug: text().notNull(),
    ...timestamps,
  },
  (table) => [
    // 모든 사용자가 토픽을 조회할 수 있음
    pgPolicy("topics-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 인증된 사용자만 토픽을 생성할 수 있음 (관리자만)
    pgPolicy("topics-insert-policy", {
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
    // 인증된 사용자만 토픽을 수정할 수 있음 (관리자만)
    pgPolicy("topics-update-policy", {
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
    // 인증된 사용자만 토픽을 삭제할 수 있음 (관리자만)
    pgPolicy("topics-delete-policy", {
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

export const posts = pgTable(
  "posts",
  {
    post_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    title: text().notNull(),
    content: text().notNull(),
    upvotes: bigint({ mode: "number" }).default(0),
    is_markdown: boolean().default(false), // MD 파일 여부
    is_notice: boolean().default(false),
    topic_id: bigint({ mode: "number" })
      .references(() => topics.topic_id, {
        onDelete: "cascade",
      })
      .notNull(),
    references: jsonb().$type<
      Array<{
        label: string;
        url: string;
        note?: string;
      }>
    >().default([]),
    profile_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    ...timestamps,
  },
  (table) => [
    // 일반 게시물은 모든 사용자가 조회 가능, 공지글은 인증된 사용자만 조회 가능
    pgPolicy("posts-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`NOT ${table.is_notice}`,
    }),
    // 공지글은 인증된 사용자만 조회 가능
    pgPolicy("posts-select-notice-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.is_notice}`,
    }),
    // 인증된 사용자만 게시물을 작성할 수 있음
    pgPolicy("posts-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`
        ${authUid} = ${table.profile_id}
        AND (
          NOT ${table.is_notice} OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = ${authUid}
            AND admin_role IN ('super_admin', 'content_admin')
            AND is_active = true
          )
        )
      `,
    }),
    // 작성자만 자신의 게시물을 수정할 수 있음
    // 단, 트리거에 의한 upvotes 업데이트를 허용하기 위해 UPDATE 정책을 완화
    // (products 테이블과 동일한 방식)
    pgPolicy("posts-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`true`,
      withCheck: sql`
        (
          NOT ${table.is_notice} OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = ${authUid}
            AND admin_role IN ('super_admin', 'content_admin')
            AND is_active = true
          )
        )
      `,
    }),
    // 작성자만 자신의 게시물을 삭제할 수 있음
    pgPolicy("posts-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        (${authUid} = ${table.profile_id} AND NOT ${table.is_notice})
        OR EXISTS (
          SELECT 1 FROM admin_permissions
          WHERE admin_id = ${authUid}
          AND admin_role IN ('super_admin', 'content_admin')
          AND is_active = true
        )
      `,
    }),
  ],
);

export const postUpvotes = pgTable(
  "post_upvotes",
  {
    post_id: bigint({ mode: "number" }).references(() => posts.post_id, {
      onDelete: "cascade",
    }),
    profile_id: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    primaryKey({ columns: [table.post_id, table.profile_id] }),
    // 모든 사용자가 업보트 정보를 조회할 수 있음
    pgPolicy("post-upvotes-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 인증된 사용자만 업보트를 생성할 수 있음
    pgPolicy("post-upvotes-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // 인증된 사용자만 자신의 업보트를 수정할 수 있음
    pgPolicy("post-upvotes-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // 인증된 사용자만 자신의 업보트를 삭제할 수 있음
    pgPolicy("post-upvotes-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
  ],
);

export const postReplies = pgTable(
  "post_replies",
  {
    post_reply_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    post_id: bigint({ mode: "number" }).references(() => posts.post_id, {
      onDelete: "cascade",
    }),
    parent_id: bigint({ mode: "number" }).references(
      (): AnyPgColumn => postReplies.post_reply_id,
      {
        onDelete: "cascade",
      },
    ),
    profile_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    reply: text().notNull(),
    ...timestamps,
  },
  (table) => [
    // 모든 사용자가 댓글을 조회할 수 있음
    pgPolicy("post-replies-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 인증된 사용자만 댓글을 작성할 수 있음
    pgPolicy("post-replies-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // 작성자만 자신의 댓글을 수정할 수 있음
    pgPolicy("post-replies-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // 작성자만 자신의 댓글을 삭제할 수 있음
    pgPolicy("post-replies-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
  ],
);

export const postReplyUpvotes = pgTable(
  "post_reply_upvotes",
  {
    post_reply_id: bigint({ mode: "number" }).references(
      () => postReplies.post_reply_id,
      {
        onDelete: "cascade",
      },
    ),
    profile_id: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.post_reply_id, table.profile_id] }),
    // 모든 사용자가 댓글 업보트 정보를 조회할 수 있음
    pgPolicy("post-reply-upvotes-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 인증된 사용자만 댓글 업보트를 생성할 수 있음
    pgPolicy("post-reply-upvotes-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // 인증된 사용자만 자신의 댓글 업보트를 삭제할 수 있음
    pgPolicy("post-reply-upvotes-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
  ],
);
