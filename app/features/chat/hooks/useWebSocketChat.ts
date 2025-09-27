import { useEffect, useRef, useState } from "react";

import { ChatWebSocketClient } from "../lib/websocket-client";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

export function useWebSocketChat(userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsClientRef = useRef<ChatWebSocketClient | null>(null);

  // WebSocket 메시지 핸들러
  const handleMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
    setIsLoading(false);
    setError(null);
  };

  // WebSocket 에러 핸들러
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  // WebSocket 연결 상태 핸들러
  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      setError("서버와의 연결이 끊어졌습니다.");
    }
  };

  // WebSocket 클라이언트 초기화 및 연결
  useEffect(() => {
    // AWS EC2 서버의 WebSocket 연결 (절대 URL 사용)
    const wsUrl = "ws://15.165.10.33:8001/ws/chat";

    console.log("Connecting to WebSocket:", wsUrl);

    wsClientRef.current = new ChatWebSocketClient(
      wsUrl,
      handleMessage,
      handleError,
      handleConnectionChange,
    );

    wsClientRef.current.connect();

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, []);

  // 메시지 전송
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isConnected) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text: input,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const success = wsClientRef.current?.sendMessage(input, userId);

    if (success) {
      setInput("");
    } else {
      setIsLoading(false);
    }
  };

  // 에러 메시지 표시
  const showError = (errorMessage: string) => {
    const errorMsg: ChatMessage = {
      id: `error_${Date.now()}`,
      text: errorMessage,
      sender: "bot",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, errorMsg]);
    setIsLoading(false);
  };

  // 에러 상태가 변경되면 메시지로 표시
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    isConnected,
    error,
    handleSubmit,
  };
}
