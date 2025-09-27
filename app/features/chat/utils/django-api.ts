/**
 * Django Chat API Integration
 *
 * Django 챗봇 서버와의 연동을 위한 유틸리티 함수들
 */

interface DjangoChatRequest {
  message: string;
  user_id: string;
  room_id: string;
  timestamp: string;
}

interface DjangoChatResponse {
  response: string;
  model?: string;
  tokens_used?: number;
  response_time?: number;
  points_spent?: number;
  error?: string;
}

/**
 * Django 챗봇 API에 메시지 전송
 */
export async function sendMessageToDjangoAPI(
  message: string,
  userId: string,
  roomId: string,
): Promise<DjangoChatResponse> {
  const apiUrl =
    process.env.DJANGO_CHAT_API_URL || "https://your-django-api.com/chat";
  const apiKey = process.env.DJANGO_API_KEY;

  if (!apiKey) {
    throw new Error("Django API key is not configured");
  }

  const requestBody: DjangoChatRequest = {
    message,
    user_id: userId,
    room_id: roomId,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Django API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data as DjangoChatResponse;
  } catch (error) {
    console.error("Error calling Django chat API:", error);
    throw error;
  }
}

/**
 * Django API 응답을 sendBotMessage 함수 형식으로 변환
 */
export function formatDjangoResponse(
  response: DjangoChatResponse,
  roomId: number,
) {
  return {
    botMessageRoomId: roomId,
    senderId: undefined, // 챗봇 메시지는 sender_id가 undefined
    content: response.response,
    role: "assistant" as const,
    metadata: {
      ai_model: response.model,
      tokens_used: response.tokens_used,
      response_time: response.response_time,
      points_spent: response.points_spent || 1,
      source: "django_api",
    },
  };
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(roomId: number, errorMessage?: string) {
  return {
    botMessageRoomId: roomId,
    senderId: undefined,
    content:
      errorMessage ||
      "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    role: "assistant" as const,
    metadata: {
      error: true,
      points_spent: 0,
      source: "error_handler",
    },
  };
}
