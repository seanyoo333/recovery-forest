/**
 * Chat API Integration
 *
 * Railway에 배포된 챗봇 API와의 연동을 위한 유틸리티 함수들
 */

// 클라이언트와 서버 모두에서 사용 가능하도록 환경 변수 처리
function getChatApiBaseUrl(): string {
  // 서버 사이드 (Node.js 환경)
  if (typeof process !== "undefined" && process.env) {
    return (
      process.env.CHAT_API_BASE_URL ||
      "https://lang-chatbot-production.up.railway.app"
    );
  }
  // 클라이언트 사이드 (브라우저 환경)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return (
      import.meta.env.VITE_CHAT_API_BASE_URL ||
      "https://lang-chatbot-production.up.railway.app"
    );
  }
  // 기본값
  return "https://lang-chatbot-production.up.railway.app";
}

const CHAT_API_BASE_URL = getChatApiBaseUrl();

/**
 * UUID v4 생성 함수
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type Section = "p1" | "p2" | "p3" | "p4";

export interface OutputPayload {
  first_paragraph: string;
  second_paragraph: string;
  third_paragraph: string;
  fourth_paragraph: string;
  references: Array<{
    source_type: string;
    title: string;
    url: string;
    pmid?: string;
    year?: number;
    authors?: string;
  }>;
  warning?: string;
}

type ServerEvent =
  | { type: "start"; data: { conversation_id: string } }
  | { type: "status"; data: { node: string; text: string } }
  | { type: "section_start"; data: { section: Section } }
  | { type: "delta"; data: { section: Section; text: string } }
  | { type: "section_done"; data: { section: Section } }
  | { type: "complete"; data: { output: OutputPayload } }
  | { type: "saved"; data: {} }
  | { type: "error"; data: { message: string } };

/**
 * 새로운 대화(conversation) ID 생성 (UUID v4)
 */
export function createConversationId(): string {
  return generateUUID();
}

/**
 * 스트리밍 메시지 전송 및 응답 처리
 *
 * 서버는 줄바꿈으로 구분된 JSON 문자열을 스트리밍합니다.
 * CORS 문제를 피하기 위해 서버 사이드 프록시 API를 통해 요청합니다.
 *
 * 이벤트 타입:
 * - `start`: 대화 시작 (conversation_id)
 * - `status`: 상태 업데이트 (node, text)
 * - `section_start`: 섹션 시작 (section)
 * - `delta`: 텍스트 델타 (section, text)
 * - `section_done`: 섹션 완료 (section)
 * - `complete`: 최종 출력 (output)
 * - `saved`: 저장 완료
 */
export async function streamChat(
  botMessageRoomId: string,
  message: string,
  user_id: string,
  callbacks: {
    onStart?: (conversationId: string) => void;
    onStatus: (text: string) => void;
    onSectionStart?: (section: Section) => void;
    onDelta: (section: Section, text: string) => void;
    onSectionDone?: (section: Section) => void;
    onComplete: (output: OutputPayload) => void;
    onSaved: () => void;
    onError?: (error: Error) => void;
  },
): Promise<void> {
  try {
    const response = await fetch(`/chat/api/stream-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        botMessageRoomId,
        message,
        userId: user_id,
      }),
    });

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

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // 서버는 줄바꿈(\n)으로 구분된 JSON 문자열을 보냄
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // 마지막 불완전한 줄은 버퍼에 보관

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          try {
            const msg = JSON.parse(trimmedLine) as ServerEvent;
            console.log("[SSE Event]", msg.type, msg);

            if (msg.type === "start") {
              callbacks.onStart?.(msg.data.conversation_id);
            } else if (msg.type === "status") {
              callbacks.onStatus(msg.data.text);
            } else if (msg.type === "section_start") {
              callbacks.onSectionStart?.(msg.data.section);
            } else if (msg.type === "delta") {
              callbacks.onDelta(msg.data.section, msg.data.text);
            } else if (msg.type === "section_done") {
              callbacks.onSectionDone?.(msg.data.section);
            } else if (msg.type === "complete") {
              callbacks.onComplete(msg.data.output);
            } else if (msg.type === "saved") {
              callbacks.onSaved();
            } else if (msg.type === "error") {
              callbacks.onError?.(new Error(msg.data.message));
            }
          } catch (parseError) {
            console.warn("[SSE] Parse error:", trimmedLine, parseError);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error : new Error("Unknown error");
    callbacks.onError?.(errorMessage);
    throw errorMessage;
  }
}

/**
 * @deprecated streamChat을 사용하세요.
 */
export async function sendStreamMessage(
  botMessageRoomId: string,
  message: string,
  user_id: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void,
): Promise<void> {
  return streamChat(
    botMessageRoomId,
    message,
    user_id,
    {
      onStatus: () => {},
      onDelta: (_section, text) => onChunk(text),
      onComplete: () => onComplete?.(),
      onSaved: () => {},
      onError,
    },
  );
}
