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
    console.error("Error fetching bot message rooms:", error);
    throw error;
  }

  return data;
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
 * 챗봇 대화방에 메시지 전송
 */
export const sendBotMessageToRoom = async (
  client: SupabaseClient<Database>,
  {
    botMessageRoomId,
    message,
    userId,
  }: { botMessageRoomId: string; message: string; userId: string },
) => {
  // 사용자가 해당 채팅방의 멤버인지 확인 (AI 메시지가 아닌 경우에만)
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
    console.error("메시지 저장 오류:", error);
    throw error;
  }
};

// 챗봇 대화방 멤버 조회
export const getBotMessageRoomMembers = async (
  client: SupabaseClient,
  { botMessageRoomId }: { botMessageRoomId: number },
) => {
  const { data, error } = await client
    .from("bot_message_room_members")
    .select(
      `
      *,
      profiles!bot_message_room_members_profile_id_fkey(
        profile_id,
        name,
        avatar,
        username
      )
    `,
    )
    .eq("bot_message_room_id", botMessageRoomId)
    .eq("is_hidden", false);

  if (error) {
    console.error("Error fetching bot message room members:", error);
    throw error;
  }

  return data;
};

// 챗봇 대화방 초대 생성
export const createBotMessageInvitation = async (
  client: SupabaseClient,
  {
    botMessageRoomId,
    invitedBy,
    invitedUserId,
    message,
    expiresAt,
  }: {
    botMessageRoomId: number;
    invitedBy: string;
    invitedUserId: string;
    message?: string;
    expiresAt?: string;
  },
) => {
  const { data, error } = await client
    .from("bot_message_invitations")
    .insert({
      bot_message_room_id: botMessageRoomId,
      invited_by: invitedBy,
      invited_user_id: invitedUserId,
      message,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating bot message invitation:", error);
    throw error;
  }

  return data;
};

// 사용자의 초대 목록 조회
export const getBotMessageInvitationsByUserId = async (
  client: SupabaseClient,
  { userId }: { userId: string },
) => {
  const { data, error } = await client
    .from("bot_message_invitations")
    .select(
      `
      *,
      bot_message_rooms!bot_message_invitations_bot_message_room_id_fkey(
        bot_message_room_id,
        room_name,
        room_description
      ),
      profiles!bot_message_invitations_invited_by_fkey(
        profile_id,
        name,
        avatar,
        username
      )
    `,
    )
    .eq("invited_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data;
};

// 초대 응답 (수락/거절)
export const respondToBotMessageInvitation = async (
  client: SupabaseClient,
  {
    invitationId,
    userId,
    status,
  }: {
    invitationId: number;
    userId: string;
    status: "accepted" | "declined";
  },
) => {
  const { data, error } = await client
    .from("bot_message_invitations")
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq("invitation_id", invitationId)
    .eq("invited_user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 수락한 경우 멤버로 추가
  if (status === "accepted") {
    await addBotMessageRoomMember(client, {
      botMessageRoomId: data.bot_message_room_id,
      profileId: userId,
    });
  }

  return data;
};

// 메시지 읽음 처리
export const markBotMessageAsRead = async (
  client: SupabaseClient,
  { botMessageRoomId, userId }: { botMessageRoomId: number; userId: string },
) => {
  const { data, error } = await client
    .from("bot_message_room_members")
    .update({
      is_read: true,
      last_read_at: new Date().toISOString(),
    })
    .eq("bot_message_room_id", botMessageRoomId)
    .eq("profile_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// 챗봇 대화방 나가기
export const leaveBotMessageRoom = async (
  client: SupabaseClient,
  { botMessageRoomId, userId }: { botMessageRoomId: number; userId: string },
) => {
  const { data, error } = await client
    .from("bot_message_room_members")
    .update({
      is_hidden: true,
      left_at: new Date().toISOString(),
    })
    .eq("bot_message_room_id", botMessageRoomId)
    .eq("profile_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
