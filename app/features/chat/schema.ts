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
export const botMessageRooms = pgTable("bot_message_rooms", {
  bot_message_room_id: bigint({ mode: "number" })
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  room_name: text().notNull().default("AI Chat Room"),
  room_description: text(),
  created_by: uuid()
    .notNull()
    .references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
  created_at: timestamp().notNull().defaultNow(),
});

/**
 * Bot Message Room Members Table
 *
 * 챗봇 대화방의 멤버를 관리하는 테이블
 * 사용자와 챗봇 대화방의 관계를 정의
 */
export const botMessageRoomMembers = pgTable("bot_message_room_members", {
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
  joined_at: timestamp().notNull().defaultNow(),
  left_at: timestamp().notNull().defaultNow(),
  created_at: timestamp().notNull().defaultNow(),
});
/**
 * Bot Messages Table
 *
 * 챗봇 대화방의 메시지를 저장하는 테이블
 * 사용자 메시지와 챗봇 응답을 모두 저장
 */
export const botMessages = pgTable("bot_messages", {
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
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

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
    created_at: timestamp().notNull().defaultNow(),
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
