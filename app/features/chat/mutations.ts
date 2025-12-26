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
