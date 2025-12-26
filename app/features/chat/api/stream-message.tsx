/**
 * Stream Message API Endpoint
 *
 * 챗봇 API로의 스트리밍 요청을 프록시하여 CORS 문제를 해결합니다.
 * 서버 사이드에서 요청을 처리하고 스트리밍 응답을 클라이언트로 전달합니다.
 * conversationId는 데이터베이스에서 조회하여 항상 최신 값을 사용합니다.
 */
import type { Route } from "./+types/stream-message";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { updateBotMessageRoomConversationId } from "../mutations";
import { getBotMessageRoomConversationId } from "../queries";
import { createConversationId } from "../utils/evibot-api";

const CHAT_API_BASE_URL =
  process.env.CHAT_API_BASE_URL ||
  "https://lang-chatbot-production.up.railway.app";

interface ChatRequest {
  message: string;
  user_id: string;
  conversation_id: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const botMessageRoomId = url.searchParams.get("botMessageRoomId");
  const message = url.searchParams.get("message");
  const userId = url.searchParams.get("userId");

  if (!botMessageRoomId || !message || !userId) {
    return new Response(
      JSON.stringify({ error: "Missing required parameters" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // 인증 확인
  const [client] = makeServerClient(request);
  const authenticatedUserId = await getLoggedInUserId(client);
  if (authenticatedUserId !== userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 데이터베이스에서 conversationId 조회
  let conversationId: string | null = null;
  try {
    conversationId = await getBotMessageRoomConversationId(client, {
      botMessageRoomId,
    });
  } catch (error) {
    console.error("Failed to get conversationId:", error);
  }

  // conversationId가 없으면 새로 생성하고 저장
  if (!conversationId) {
    try {
      conversationId = createConversationId();
      if (conversationId) {
        await updateBotMessageRoomConversationId(client, {
          botMessageRoomId,
          conversationId,
        });
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create conversation" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  if (!conversationId) {
    return new Response(
      JSON.stringify({ error: "Failed to get or create conversationId" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const requestBody: ChatRequest = {
      message,
      user_id: userId,
      conversation_id: conversationId,
    };

    const apiUrl = `${CHAT_API_BASE_URL}/conversations/${conversationId}/message-stream`;

    // 챗봇 API로 스트리밍 요청
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {
        // 응답 본문 읽기 실패 시 무시
      }

      console.error("Chat API error:", {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        errorBody,
      });

      return new Response(
        JSON.stringify({
          error: `Failed to send message: ${response.status} ${response.statusText}`,
          details: errorBody || undefined,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!response.body) {
      return new Response(JSON.stringify({ error: "Response body is null" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 스트리밍 응답을 클라이언트로 전달
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Stream message error:", error);
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
