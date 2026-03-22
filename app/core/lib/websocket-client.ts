export interface ChatMessage {
  id?: string;
  content: string;
  role: 'user' | 'assistant';
  userId: string;
  createdAt?: string;
  timestamp?: Date;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1초
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];

  constructor(private wsUrl: string) {}

  // WebSocket 연결
  connect(userId: string) {
    try {
      // WebSocket URL에 사용자 ID를 쿼리 파라미터로 추가
      const url = `${this.wsUrl}?userId=${userId}`;

      // Django WebSocket 연결 (헤더 없이)
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.connectionCallbacks.forEach(callback => callback(true));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Django Channels에서 오는 메시지 형식에 맞게 처리
          if (data.type === 'chat.message' || data.type === 'chat_message' || data.type === 'message') {
            const message: ChatMessage = {
              content: data.message || data.content || data.text,
              role: data.role || 'assistant',
              userId: data.user_id || data.userId || userId,
              timestamp: new Date(data.timestamp || Date.now()),
            };
            this.messageCallbacks.forEach(callback => callback(message));
          }
        } catch (error) {
          console.error('메시지 파싱 오류:', error);
        }
      };

      this.ws.onclose = (event) => {
        this.connectionCallbacks.forEach(callback => callback(false));

        // 자동 재연결 시도 (연결 실패 시에만)
        if (event.code === 1006 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(userId);
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket 연결 오류:', error);
        // 연결 실패 시에만 오류 콜백 호출
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          this.errorCallbacks.forEach(callback => callback(new Error('서버에 연결할 수 없습니다. Django 서버가 실행 중인지 확인해주세요.')));
        }
      };

    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      this.errorCallbacks.forEach(callback => callback(error as Error));
    }
  }

  // 메시지 전송
  sendMessage(message: string, userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Django Channels 형식에 맞는 메시지 전송
      const payload = {
        type: 'chat.message',
        message: message,
        user_id: userId,
        timestamp: new Date().toISOString(),
      };
      this.ws.send(JSON.stringify(payload));
      return true;
    } else {
      console.error('WebSocket이 연결되지 않았습니다.');
      return false;
    }
  }

  // 연결 종료
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // 메시지 수신 콜백 등록
  onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks.push(callback);
  }

  // 오류 콜백 등록
  onError(callback: (error: Error) => void) {
    this.errorCallbacks.push(callback);
  }

  // 연결 상태 콜백 등록
  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 환경 변수에서 WebSocket URL 가져오기
const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://15.165.10.33:8000/ws/chat';

// 싱글톤 인스턴스 생성
export const websocketClient = new WebSocketClient(WS_URL); 