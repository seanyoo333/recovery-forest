/**
 * Chat Mutations
 *
 * This file contains database mutations for AI chat functionality.
 * Uses Supabase Client for consistency with other features.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

/**
 * 챗봇 대화방 숨기기
 */
export const hideBotMessage = async (
  client: SupabaseClient<Database>,
  { userId, botMessageRoomId }: { userId: string; botMessageRoomId: string },
) => {
  const { error } = await client
    .from("bot_message_room_members")
    .update({ is_hidden: true })
    .eq("bot_message_room_id", Number(botMessageRoomId))
    .eq("profile_id", userId);

  if (error) {
    throw error;
  }
};

/**
 * 챗봇 대화방의 conversation_id 업데이트
 */
export const updateBotMessageRoomConversationId = async (
  client: SupabaseClient<Database>,
  {
    botMessageRoomId,
    conversationId,
  }: { botMessageRoomId: string; conversationId: string | null },
) => {
  const { error } = await client
    .from("bot_message_rooms")
    .update({ conversation_id: conversationId })
    .eq("bot_message_room_id", Number(botMessageRoomId));

  if (error) {
    throw error;
  }
};

/**
 * 건강 북마크 생성
 */
export const createHealthBookmark = async (
  client: SupabaseClient<Database>,
  {
    userId,
    botMessageId,
    botMessageRoomId,
    question,
    answer,
    title,
  }: {
    userId: string;
    botMessageId?: number;
    botMessageRoomId: string;
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
    title?: string;
  },
) => {
  const { error } = await client.from("health_bookmarks").insert({
    profile_id: userId,
    bot_message_id: botMessageId,
    bot_message_room_id: Number(botMessageRoomId),
    content: {
      question,
      answer,
    },
    title: title || question.substring(0, 100), // 제목이 없으면 질문의 처음 100자 사용
  });

  if (error) {
    throw error;
  }
};

/**
 * 건강 북마크 삭제
 */
export const deleteHealthBookmark = async (
  client: SupabaseClient<Database>,
  {
    userId,
    bookmarkId,
  }: {
    userId: string;
    bookmarkId: number;
  },
) => {
  // 북마크 작성자만 삭제할 수 있도록 확인
  const { data: bookmark, error: fetchError } = await client
    .from("health_bookmarks")
    .select("profile_id")
    .eq("bookmark_id", bookmarkId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (!bookmark) {
    throw new Error("북마크를 찾을 수 없습니다.");
  }

  if (bookmark.profile_id !== userId) {
    throw new Error("북마크를 삭제할 권한이 없습니다.");
  }

  const { error } = await client
    .from("health_bookmarks")
    .delete()
    .eq("bookmark_id", bookmarkId)
    .eq("profile_id", userId);

  if (error) {
    throw error;
  }
};

/**
 * 건강 북마크 업데이트 (제목, 메모)
 */
export const updateHealthBookmark = async (
  client: SupabaseClient<Database>,
  {
    userId,
    bookmarkId,
    title,
    notes,
  }: {
    userId: string;
    bookmarkId: number;
    title?: string;
    notes?: string;
  },
) => {
  const updateData: {
    title?: string;
    notes?: string;
    updated_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) {
    updateData.title = title;
  }
  if (notes !== undefined) {
    updateData.notes = notes;
  }

  const { error } = await client
    .from("health_bookmarks")
    .update(updateData)
    .eq("bookmark_id", bookmarkId)
    .eq("profile_id", userId);

  if (error) {
    throw error;
  }
};
