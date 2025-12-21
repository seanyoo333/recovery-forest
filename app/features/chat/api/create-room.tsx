/**
 * Create Bot Chat Room API
 *
 * This API endpoint creates a new bot chat room for the authenticated user.
 * It uses the sendBotMessage function to create the room and send an initial message.
 */
import type { Route } from "./+types/create-room";

import { redirect } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import {
  createBotMessageRoom,
  getBotMessageRoomCountByUserId,
} from "../queries";

export const loader = async ({ request }: Route.LoaderArgs) => {
  // GET 요청 시 기본 응답
  return Response.json({ message: "Use POST method to create a chat room" });
};

export const action = async ({ request }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자의 AI 채팅방 개수 확인 (최대 5개 제한)
    const roomCount = await getBotMessageRoomCountByUserId(client, { userId });
    if (roomCount >= 5) {
      return Response.json(
        { error: "AI 채팅방은 최대 5개까지 생성할 수 있습니다." },
        { status: 400 },
      );
    }

    const roomName = formData.get("roomName") as string;
    const roomDescription = formData.get("roomDescription") as string;

    // 새 채팅방 생성
    const room = await createBotMessageRoom(client, {
      userId,
      roomName: roomName || "AI Chat Room",
      roomDescription: roomDescription || undefined,
    });

    // 생성된 대화방으로 리다이렉트
    return redirect(`/chat/botmessages/${room.bot_message_room_id}`);
  } catch (error) {
    console.error("Failed to create chat room:", error);
    return Response.json(
      { error: "Failed to create chat room" },
      { status: 500 },
    );
  }
};
