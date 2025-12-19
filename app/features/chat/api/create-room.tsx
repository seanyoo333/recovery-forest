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

import { sendBotMessage } from "../mutations";

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

    const roomName = formData.get("roomName") as string;
    const roomDescription = formData.get("roomDescription") as string;

    // sendBotMessage 함수를 사용하여 채팅방 생성 및 초기 메시지 전송
    const botMessageRoomId = await sendBotMessage(client, {
      userId,
      content: `새로운 AI 채팅방 "${roomName}"이 생성되었습니다. ${roomDescription}`,
    });

    // 생성된 대화방으로 리다이렉트
    return redirect(`/chat/botmessages/${botMessageRoomId}`);
  } catch (error) {
    return Response.json(
      { error: "Failed to create chat room" },
      { status: 500 },
    );
  }
};
