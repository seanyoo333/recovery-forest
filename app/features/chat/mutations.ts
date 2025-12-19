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
 * 챗봇 메시지 전송 (채팅방 생성 포함)
 */
export const sendBotMessage = async (
  client: SupabaseClient<Database>,
  { userId, content }: { userId: string; content: string },
) => {
  // 먼저 사용자의 기존 채팅방이 있는지 확인
  const { data: existingRoom, error: roomError } = await client
    .from("bot_message_room_members")
    .select("bot_message_room_id")
    .eq("profile_id", userId)
    .eq("is_hidden", false)
    .limit(1)
    .single();

  let botMessageRoomId: number;

  if (existingRoom?.bot_message_room_id) {
    // 기존 채팅방이 있으면 사용
    botMessageRoomId = existingRoom.bot_message_room_id;
  } else {
    // 새 채팅방 생성
    const { data: roomData, error: createError } = await client
      .from("bot_message_rooms")
      .insert({
        room_name: "AI Chat Room",
        room_description: "AI와의 대화방",
        created_by: userId,
      })
      .select("bot_message_room_id")
      .single();

    if (createError) {
      throw createError;
    }

    botMessageRoomId = roomData.bot_message_room_id;

    // 생성자를 채팅방 멤버로 추가
    const { error: memberError } = await client
      .from("bot_message_room_members")
      .insert({
        bot_message_room_id: botMessageRoomId,
        profile_id: userId,
      });

    if (memberError) {
      throw memberError;
    }
  }

  // 메시지 저장
  const { error: messageError } = await client.from("bot_messages").insert({
    bot_message_room_id: botMessageRoomId,
    sender_id: userId,
    content,
  });

  if (messageError) {
    throw messageError;
  }

  return botMessageRoomId;
};
