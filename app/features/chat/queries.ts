/**
 * Chat Queries
 *
 * This file contains database queries for AI chat functionality.
 * Uses Supabase Client for consistency with other features.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

/**
 * 사용자의 챗봇 대화방 목록 조회
 */
export const getBotMessageRoomsByUserId = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  const { data, error } = await client
    .from("bot_message_room_members")
    .select(
      `
      *,
      bot_message_rooms(
        bot_message_room_id,
        room_name,
        room_description,
        created_at,
        created_by
      ),
      profiles(
        profile_id,
        name,
        avatar,
        username
      )
    `,
    )
    .eq("profile_id", userId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 사용자의 AI 채팅방 개수 조회
 */
export const getBotMessageRoomCountByUserId = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
): Promise<number> => {
  const { count, error } = await client
    .from("bot_message_room_members")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId)
    .eq("is_hidden", false);

  if (error) {
    throw error;
  }

  return count || 0;
};

/**
 * 특정 챗봇 대화방의 메시지 조회
 */
export const getBotMessagesByBotMessageRoomId = async (
  client: SupabaseClient<Database>,
  { botMessageRoomId, userId }: { botMessageRoomId: string; userId: string },
) => {
  // 사용자가 해당 채팅방의 멤버인지 확인
  const { count, error: countError } = await client
    .from("bot_message_room_members")
    .select("*", { count: "exact", head: true })
    .eq("bot_message_room_id", Number(botMessageRoomId))
    .eq("profile_id", userId)
    .eq("is_hidden", false);

  if (countError) {
    throw countError;
  }

  if (count === 0) {
    throw new Error("Bot message room not found or access denied");
  }

  // 메시지 조회
  const { data, error } = await client
    .from("bot_messages")
    .select("*")
    .eq("bot_message_room_id", Number(botMessageRoomId))
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 챗봇 대화방 생성
 */
export const createBotMessageRoom = async (
  client: SupabaseClient<Database>,
  {
    userId,
    roomName,
    roomDescription,
  }: {
    userId: string;
    roomName?: string;
    roomDescription?: string;
  },
) => {
  const { data, error } = await client
    .from("bot_message_rooms")
    .insert({
      room_name: roomName || "AI Chat Room",
      room_description: roomDescription,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 생성자를 채팅방 멤버로 추가
  await addBotMessageRoomMember(client, {
    botMessageRoomId: data.bot_message_room_id,
    profileId: userId,
  });

  return data;
};

/**
 * 챗봇 대화방 멤버 추가
 */
export const addBotMessageRoomMember = async (
  client: SupabaseClient<Database>,
  {
    botMessageRoomId,
    profileId,
  }: {
    botMessageRoomId: number;
    profileId: string;
  },
) => {
  const { data, error } = await client
    .from("bot_message_room_members")
    .insert({
      bot_message_room_id: botMessageRoomId,
      profile_id: profileId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 챗봇 대화방의 conversation_id 조회
 */
export const getBotMessageRoomConversationId = async (
  client: SupabaseClient<Database>,
  { botMessageRoomId }: { botMessageRoomId: string },
): Promise<string | null> => {
  const { data, error } = await client
    .from("bot_message_rooms")
    .select("conversation_id")
    .eq("bot_message_room_id", Number(botMessageRoomId))
    .single();

  if (error) {
    throw error;
  }

  return data?.conversation_id || null;
};
/* 메세지 저장 */
export const sendBotMessageToRoom = async (
  client: SupabaseClient<Database>,
  {
    botMessageRoomId,
    message,
    userId,
  }: { botMessageRoomId: string; message: string; userId: string },
) => {
  // 사용자가 해당 채팅방의 멤버인지 확인 (AI 메시지가 아닌 경우에만)
  // is_hidden : 사용자가 채팅방 종료시 방 숨김, 데이터 보존
  if (userId !== "ai-assistant") {
    const { count, error: countError } = await client
      .from("bot_message_room_members")
      .select("*", { count: "exact", head: true })
      .eq("bot_message_room_id", Number(botMessageRoomId))
      .eq("profile_id", userId)
      .eq("is_hidden", false);

    if (countError) {
      throw countError;
    }

    if (count === 0) {
      throw new Error("Bot message room not found or access denied");
    }
  }

  // 메시지 저장
  const { error } = await client.from("bot_messages").insert({
    bot_message_room_id: Number(botMessageRoomId),
    sender_id: userId,
    content: message,
  });

  if (error) {
    throw error;
  }
};
