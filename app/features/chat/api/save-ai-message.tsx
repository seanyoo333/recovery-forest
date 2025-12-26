/**
 * Save AI Message API Endpoint
 *
 * AI 응답을 데이터베이스에 저장하는 서버 사이드 API
 * RLS 정책을 우회하기 위해 서버 사이드에서 실행됩니다.
 */
import type { Route } from "./+types/save-ai-message";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { sendBotMessageToRoom } from "../queries";

export async function action({ request }: Route.ActionArgs) {
  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const botMessageRoomId = formData.get("botMessageRoomId") as string;
    const content = formData.get("content") as string;

    if (!botMessageRoomId || !content) {
      return new Response(
        JSON.stringify({ error: "botMessageRoomId and content are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 사용자가 해당 채팅방의 멤버인지 확인
    const { count, error: countError } = await client
      .from("bot_message_room_members")
      .select("*", { count: "exact", head: true })
      .eq("bot_message_room_id", Number(botMessageRoomId))
      .eq("profile_id", userId)
      .eq("is_hidden", false);

    if (countError) {
      return new Response(
        JSON.stringify({ error: "Failed to verify room membership" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (count === 0) {
      return new Response(
        JSON.stringify({
          error: "Bot message room not found or access denied",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // AI 응답을 데이터베이스에 저장
    // 서버 사이드에서 실행되며, 사용자가 멤버이므로 RLS 정책을 통과할 수 있습니다
    await sendBotMessageToRoom(client, {
      botMessageRoomId,
      message: content,
      userId: "ai-assistant",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Save AI message error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
