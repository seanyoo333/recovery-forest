/**
 * Evibot Chat API Integration
 *
 * Railway에 배포된 Evibot 챗봇 API와의 연동을 위한 유틸리티 함수들
 * OpenAI SDK를 사용하여 대화 히스토리를 관리합니다.
 */

// 클라이언트와 서버 모두에서 사용 가능하도록 환경 변수 처리
function getEvibotBaseUrl(): string {
  // 서버 사이드 (Node.js 환경)
  if (typeof process !== "undefined" && process.env) {
    return process.env.EVIBOT_API_URL || "https://evibot-production.up.railway.app";
  }
  // 클라이언트 사이드 (브라우저 환경)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.VITE_EVIBOT_API_URL || "https://evibot-production.up.railway.app";
  }
  // 기본값
  return "https://evibot-production.up.railway.app";
}

const EVIBOT_BASE_URL = getEvibotBaseUrl();

interface CreateConversationResponse {
  conversation_id: string;
}

interface CreateMessageInput {
  question: string;
  user_id: string;
  category?: string;
}

interface StatusEvent {
  phase: string;
  message: string;
}

/**
 * 새로운 대화(conversation) 생성
 */
export async function createConversation(): Promise<string> {
  try {
    const response = await fetch(`${EVIBOT_BASE_URL}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create conversation: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as CreateConversationResponse;
    return data.conversation_id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
}

/**
 * 스트리밍 메시지 전송 및 응답 처리
 *
 * Server-Sent Events (SSE) 형식으로 응답을 받아 처리합니다.
 * CORS 문제를 피하기 위해 서버 사이드 프록시 API를 통해 요청합니다.
 * - `event: status` - 상태 업데이트 (phase, message)
 * - `data: {text}` - 텍스트 델타 (일반 텍스트)
 * - `event: done` - 스트리밍 완료
 */
export async function sendStreamMessage(
  botMessageRoomId: string,
  question: string,
  user_id: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void,
  category?: string,
): Promise<void> {
  try {
    // 서버 사이드 프록시 API를 통해 요청 (CORS 문제 해결)
    // conversationId는 서버에서 데이터베이스에서 조회
    const params = new URLSearchParams({
      botMessageRoomId,
      question,
      userId: user_id,
    });
    if (category) {
      params.append("category", category);
    }

    const response = await fetch(
      `/chat/api/stream-message?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to send message: ${response.status} ${response.statusText}`,
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent: string | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          // 빈 라인은 이벤트 구분자
          if (line.trim() === "") {
            currentEvent = null;
            continue;
          }

          // event: 타입 라인
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
            continue;
          }

          // data: 라인 처리
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            // done 이벤트 처리
            if (currentEvent === "done") {
              onComplete?.();
              return;
            }

            // status 이벤트 처리 (로깅용, 콜백은 호출하지 않음)
            if (currentEvent === "status") {
              try {
                const status = JSON.parse(data) as StatusEvent;
                console.debug("Stream status:", status.phase, status.message);
              } catch {
                // 파싱 실패는 무시
              }
              continue;
            }

            // 일반 data 라인 (텍스트 델타)
            // JSON이 아닌 일반 텍스트일 수 있으므로 직접 전달
            if (data.trim()) {
              onChunk(data);
            }
          }
        }
      }

      // 남은 버퍼 처리
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data: ")) {
          onChunk(trimmed.slice(6));
        } else if (trimmed && !trimmed.startsWith("event: ")) {
          onChunk(trimmed);
        }
      }

      onComplete?.();
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error : new Error("Unknown error");
    onError?.(errorMessage);
    throw errorMessage;
  }
}

/**
 * 비스트리밍 메시지 전송 (간단한 응답용)
 *
 * @deprecated 스트리밍을 사용하는 것을 권장합니다.
 */
export async function sendMessage(
  conversationId: string,
  question: string,
  user_id: string,
  category?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let fullResponse = "";

    sendStreamMessage(
      conversationId,
      question,
      user_id,
      (chunk) => {
        fullResponse += chunk;
      },
      () => {
        resolve(fullResponse);
      },
      (error) => {
        reject(error);
      },
      category,
    );
  });
}

