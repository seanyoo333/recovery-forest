/**
 * Stream Message API Endpoint
 *
 * FastAPI 챗봇 서버로의 스트리밍 요청을 프록시하여 CORS 문제를 해결합니다.
 * 서버 사이드에서 요청을 처리하고 스트리밍 응답을 클라이언트로 전달합니다.
 * conversationId는 데이터베이스에서 조회하여 항상 최신 값을 사용합니다.
 */
import type { Route } from "./+types/stream-message";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import {
  getBotMessageRoomConversationId,
} from "../queries";
import { updateBotMessageRoomConversationId } from "../mutations";
import { createConversationId } from "../utils/evibot-api";

const CHAT_API_BASE_URL =
  process.env.CHAT_API_BASE_URL || "https://lang-chatbot-production.up.railway.app";

interface ChatRequest {
  message: string;
  user_id: string;
  conversation_id: string;
  max_attempts?: number;
}

interface RequestBody {
  botMessageRoomId?: string;
  message?: string;
  userId?: string;
  maxAttempts?: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  return Response.json({ message: "Use POST method to stream messages" });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = (await request.json()) as RequestBody;
    const { botMessageRoomId, message, userId, maxAttempts } = body;

    if (!botMessageRoomId || !message || !userId) {
      return Response.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // 인증 확인
    const [client] = makeServerClient(request);
    const authenticatedUserId = await getLoggedInUserId(client);
    if (authenticatedUserId !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // conversationId 조회 또는 생성
    let conversationId =
      (await getBotMessageRoomConversationId(client, { botMessageRoomId })) ||
      null;

    if (!conversationId) {
      conversationId = createConversationId();
      await updateBotMessageRoomConversationId(client, {
        botMessageRoomId,
        conversationId,
      });
    }

    // FastAPI 서버로 스트리밍 요청
    const baseUrl = CHAT_API_BASE_URL.replace(/\/$/, "");
    const apiUrl = `${baseUrl}/conversations/${conversationId}/message-stream-all`;

    const requestBody: ChatRequest = {
      message,
      user_id: userId,
      conversation_id: conversationId,
      ...(maxAttempts && { max_attempts: Number.parseInt(maxAttempts, 10) }),
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return Response.json(
        {
          error: `Failed to send message: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    if (!response.body) {
      return Response.json(
        { error: "Response body is null" },
        { status: 500 },
      );
    }

    // 스트리밍 응답을 클라이언트로 전달
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream message error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

