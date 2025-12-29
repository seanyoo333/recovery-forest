/**
 * Chat Schema
 *
 * This file defines the database schema for AI chat functionality.
 * Basic implementation for chat sessions and messages.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { messageRooms, profiles } from "../users/schema";

/**
 * Bot Message Rooms Table
 *
 * 챗봇과의 대화방을 관리하는 테이블
 * 여러 사용자가 하나의 챗봇 대화방에 참여할 수 있음
 */
export const botMessageRooms = pgTable(
  "bot_message_rooms",
  {
    bot_message_room_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    room_name: text().notNull().default("AI Chat Room"),
    room_description: text(),
    conversation_id: uuid(), // 챗봇 API의 conversation_id 저장 (UUID v4)
    created_by: uuid()
      .notNull()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      }),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    // SELECT: public에게 모든 접근 허용 (Realtime 작동을 위해)
    pgPolicy("bot-message-rooms select", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // INSERT: 생성자가 채팅방을 만들 수 있도록 허용
    pgPolicy("bot-message-rooms insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${table.created_by} = ${authUid}`,
    }),
    // UPDATE: authenticated에게 is_bot_user_member를 사용한 접근 제어
    pgPolicy("bot-message-rooms update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
      withCheck: sql`public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
    }),
    // DELETE: authenticated에게 is_bot_user_member를 사용한 접근 제어
    pgPolicy("bot-message-rooms delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
    }),
  ],
);

/**
 * Bot Message Room Members Table
 *
 * 챗봇 대화방의 멤버를 관리하는 테이블
 * 사용자와 챗봇 대화방의 관계를 정의
 */
export const botMessageRoomMembers = pgTable(
  "bot_message_room_members",
  {
    bot_message_room_id: bigint({ mode: "number" })
      .notNull()
      .references(() => botMessageRooms.bot_message_room_id, {
        onDelete: "cascade",
      }),
    profile_id: uuid()
      .notNull()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      }),
    is_hidden: boolean().notNull().default(false),
    joined_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    left_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    primaryKey({ columns: [table.bot_message_room_id, table.profile_id] }),
    // SELECT: public에게 모든 접근 허용 (Realtime 작동을 위해)
    pgPolicy("bot-message-room-members select", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // INSERT: 생성자가 자신을 멤버로 추가할 수 있도록 허용
    pgPolicy("bot-message-room-members insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${table.profile_id} = ${authUid} AND EXISTS (
        SELECT 1 FROM ${botMessageRooms}
        WHERE ${botMessageRooms.bot_message_room_id} = ${table.bot_message_room_id}
        AND ${botMessageRooms.created_by} = ${authUid}
      )`,
    }),
    // UPDATE: authenticated에게 is_bot_user_member를 사용한 접근 제어
    pgPolicy("bot-message-room-members update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
      withCheck: sql`public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
    }),
    // DELETE: authenticated에게 is_bot_user_member를 사용한 접근 제어
    pgPolicy("bot-message-room-members delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
    }),
  ],
);
/**
 * Bot Messages Table
 *
 * 챗봇 대화방의 메시지를 저장하는 테이블
 * 사용자 메시지와 챗봇 응답을 모두 저장
 */
export const botMessages = pgTable(
  "bot_messages",
  {
    bot_message_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    bot_message_room_id: bigint({ mode: "number" })
      .notNull()
      .references(() => botMessageRooms.bot_message_room_id, {
        onDelete: "cascade",
      }),
    sender_id: text().notNull(), // uuid 또는 "ai-assistant" 문자열 허용
    content: text().notNull(),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    updated_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    // SELECT: public에게 모든 접근 허용 (Realtime 작동을 위해)
    pgPolicy("bot-messages select", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // INSERT: AI 메시지 저장 허용 (sender_id가 "ai-assistant"이고 사용자가 멤버인 경우)
    pgPolicy("bot-messages insert ai", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${table.sender_id} = 'ai-assistant' AND public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
    }),
    // INSERT: 사용자 메시지 저장 허용 (사용자가 멤버인 경우)
    pgPolicy("bot-messages insert user", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${table.sender_id} = ${authUid}::text AND public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
    }),
    // UPDATE: authenticated에게 is_bot_user_member를 사용한 접근 제어
    pgPolicy("bot-messages update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
      withCheck: sql`public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
    }),
    // DELETE: authenticated에게 is_bot_user_member를 사용한 접근 제어
    pgPolicy("bot-messages delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_bot_user_member(${table.bot_message_room_id}, ${authUid})`,
    }),
  ],
);

/**
 * Health Bookmarks Table
 *
 * 건강 질문 답변을 북마크로 저장하는 테이블
 * 봇 메시지가 cron으로 삭제되어도 북마크는 유지됨
 * bot_message_id는 참조용이며 외래키 없음 (nullable)
 */
export const healthBookmarks = pgTable(
  "health_bookmarks",
  {
    bookmark_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    profile_id: uuid()
      .notNull()
      .references(() => profiles.profile_id, { onDelete: "cascade" }),
    // 봇 메시지 ID (참조용, 외래키 없음 - 봇 메시지 삭제되어도 북마크 유지)
    bot_message_id: bigint({ mode: "number" }),
    // 봇 메시지 방 ID (참조용, 채팅방 삭제되어도 북마크 유지)
    // cascade 제거: 채팅방이 삭제되어도 북마크는 유지되어야 함
    bot_message_room_id: bigint({ mode: "number" }),
    // 저장된 내용 (JSON 형태)
    content: jsonb().notNull().$type<{
      question: string;
      answer: {
        first_paragraph?: string;
        second_paragraph?: string;
        third_paragraph?: string;
        fourth_paragraph?: string;
        references?: Array<{
          source_type: string;
          title: string;
          url: string;
          pmid?: string;
          year?: number;
          authors?: string;
        }>;
        warning?: string;
      };
    }>(),
    // 북마크 제목 (사용자가 수정 가능)
    title: text(),
    // 메모
    notes: text(),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    updated_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    // SELECT: 사용자는 자신의 북마크만 조회 가능
    pgPolicy("health-bookmarks-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.profile_id} = ${authUid}`,
    }),
    // INSERT: 사용자는 자신의 북마크만 생성 가능
    pgPolicy("health-bookmarks-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${table.profile_id} = ${authUid}`,
    }),
    // UPDATE: 사용자는 자신의 북마크만 수정 가능
    pgPolicy("health-bookmarks-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.profile_id} = ${authUid}`,
      withCheck: sql`${table.profile_id} = ${authUid}`,
    }),
    // DELETE: 사용자는 자신의 북마크만 삭제 가능
    pgPolicy("health-bookmarks-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.profile_id} = ${authUid}`,
    }),
  ],
);

/* 챗봇 대화방 초대를 관리하는 테이블블
export const botMessageInvitations = pgTable(
  "bot_message_invitations",
  {
    invitation_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    bot_message_room_id: bigint({ mode: "number" })
      .notNull()
      .references(() => botMessageRooms.bot_message_room_id, {
        onDelete: "cascade",
      }),
    invited_by: uuid()
      .notNull()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      }),
    invited_user_id: uuid()
      .notNull()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      }),
    status: text().notNull().default("pending"), // "pending", "accepted", "declined", "expired"
    expires_at: timestamp(),
    message: text(), // 초대 메시지
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    responded_at: timestamp(),
  },
  (table) => [
    // RLS Policy: Users can view invitations they sent or received
    pgPolicy("bot-message-invitations-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.invited_by} OR ${authUid} = ${table.invited_user_id}`,
    }),
    // RLS Policy: Users can send invitations to rooms they are members of
    pgPolicy("bot-message-invitations-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.invited_by} AND EXISTS (
        SELECT 1 FROM bot_message_room_members
        WHERE bot_message_room_id = ${table.bot_message_room_id}
        AND profile_id = ${authUid}
        AND is_hidden = false
      )`,
    }),
    // RLS Policy: Invited users can update invitation status
    pgPolicy("bot-message-invitations-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.invited_user_id}`,
      using: sql`${authUid} = ${table.invited_user_id}`,
    }),
  ],
);
 */
