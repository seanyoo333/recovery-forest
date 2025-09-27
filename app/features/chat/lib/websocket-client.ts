/**
 * WebSocket Client for Chat
 *
 * LLM 서버와의 WebSocket 연결을 관리합니다.
 */

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

interface WebSocketMessage {
  type: "chat.message" | "chat.error" | "send.error";
  message: any;
  user_id?: string;
}

export class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private url: string,
    private onMessage: (message: ChatMessage) => void,
    private onError: (error: string) => void,
    private onConnectionChange: (connected: boolean) => void,
  ) {}

  connect() {
    try {
      console.log("Attempting to connect to WebSocket...");

      if (!this.url) {
        throw new Error("WebSocket URL is not configured");
      }

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("Successfully connected to WebSocket");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionChange(true);
      };

      this.ws.onmessage = (event) => {
        try {
          // 서버 에러 메시지 처리
          if (typeof event.data === "string" && event.data.startsWith("서버")) {
            this.onMessage({
              id: `error_${Date.now()}`,
              text: event.data,
              sender: "bot",
              timestamp: new Date().toISOString(),
            });
            return;
          }

          // JSON 메시지 처리
          const data: WebSocketMessage = JSON.parse(event.data);

          if (data.type === "chat.message") {
            const response = data.message;

            // 응답 데이터 포맷팅
            const mainContent = [
              response.mechanism,
              response.evidence1,
              response.evidence2,
              response.lab_analysis,
              response.final_advice,
            ]
              .filter(Boolean)
              .join("\n\n");

            // 참고문헌 정보 포맷팅
            const references = response.references
              ?.map((ref: any) => {
                const linkText = ref.url
                  ? `[${ref.id}] <a href="${ref.url}" target="_blank">${ref.url}</a>`
                  : `[${ref.id}] ${ref.title}`;
                return linkText;
              })
              .join("\n");

            const formattedText = references
              ? `${mainContent}\n\n참고문헌:\n${references}`
              : mainContent;

            this.onMessage({
              id: `bot_${Date.now()}`,
              text: formattedText,
              sender: "bot",
              timestamp: new Date().toISOString(),
            });
          } else if (data.type === "chat.error" || data.type === "send.error") {
            this.onMessage({
              id: `error_${Date.now()}`,
              text: data.message,
              sender: "bot",
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
          this.onMessage({
            id: `error_${Date.now()}`,
            text: event.data || "서버 처리 중 오류가 발생했습니다",
            sender: "bot",
            timestamp: new Date().toISOString(),
          });
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
        this.onError("WebSocket 연결 오류가 발생했습니다.");
      };

      this.ws.onclose = () => {
        console.log("WebSocket connection closed");
        this.isConnected = false;
        this.onConnectionChange(false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.onError("WebSocket 연결을 설정할 수 없습니다.");
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
      this.onError("서버와의 연결이 끊어졌습니다. 페이지를 새로고침해주세요.");
    }
  }

  sendMessage(message: string, userId: string) {
    if (!this.ws || !this.isConnected) {
      this.onError("서버와 연결 중입니다. 잠시만 기다려주세요.");
      return false;
    }

    try {
      this.ws.send(
        JSON.stringify({
          message,
          user_id: userId,
          type: "chat.message",
        }),
      );
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      this.onError("메시지 전송에 실패했습니다.");
      return false;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.onConnectionChange(false);
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}
