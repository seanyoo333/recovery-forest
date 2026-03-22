/**
 * LangChain API Endpoint
 *
 * This endpoint handles communication with the Django LLM server.
 * Sends user messages to the AI and returns responses.
 */
import type { Route } from "./+types/langchain";

import makeServerClient from "~/core/lib/supa-client.server";

import { sendBotMessageToRoom } from "../queries";

export async function action({ request }: Route.ActionArgs) {
  try {
    const [client] = makeServerClient(request);
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const formData = await request.formData();
    const message = formData.get("message") as string;
    const botMessageRoomId = formData.get("botMessageRoomId") as string;

    if (!message || !botMessageRoomId) {
      return { error: "Message and botMessageRoomId are required" };
    }

    // 사용자 메시지를 Supabase에 저장
    await sendBotMessageToRoom(client, {
      botMessageRoomId,
      message,
      userId: user.id,
    });

    // AWS 챗봇 API 호출
    // 환경 변수에서 URL을 가져와서 올바른 형식으로 변환
    let LLM_SERVER_URL = process.env.LLM_SERVER_URL || "43.202.113.129";

    // 프로토콜이 없으면 http:// 추가
    if (
      !LLM_SERVER_URL.startsWith("http://") &&
      !LLM_SERVER_URL.startsWith("https://")
    ) {
      LLM_SERVER_URL = `http://${LLM_SERVER_URL}`;
    }

    // 포트가 없으면 8000 추가 (Django 기본 포트)
    if (!LLM_SERVER_URL.includes(":")) {
      LLM_SERVER_URL = `${LLM_SERVER_URL}:8000`;
    }

    const llmResponse = await fetch(`${LLM_SERVER_URL}/api/langchain/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message,
        user_id: user.id,
        room_id: botMessageRoomId,
        prescription: "No",
        response_type: "text",
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM server error: ${llmResponse.statusText}`);
    }

    const llmData = await llmResponse.json();

    if (llmData.status === "success" && llmData.message) {
      // AI 응답을 Supabase에 저장
      const aiResponseText =
        typeof llmData.message === "string"
          ? llmData.message
          : llmData.message.content || JSON.stringify(llmData.message);

      await sendBotMessageToRoom(client, {
        botMessageRoomId,
        message: aiResponseText,
        userId: "ai-assistant", // AI 응답임을 나타내는 특별한 ID
      });

      return {
        success: true,
        response: aiResponseText,
      };
    } else {
      throw new Error(llmData.error || "Unknown error from LLM server");
    }
  } catch (error) {
    console.error("LangChain API error:", error);
    return {
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
