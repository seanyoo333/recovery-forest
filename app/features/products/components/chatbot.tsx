import { useEffect, useRef, useState } from "react";
import { Settings, Send } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

interface ChatBotProps {
  websocketUrl: string;
  userId: string;
  onUserInfoSubmit?: (userInfo: any) => Promise<void>;
  onFileUpload?: (file: File) => Promise<void>;
  LoadingIcon?: React.ComponentType;
  UserInfoForm?: React.ComponentType<{
    onSubmit: (userInfo: any) => void;
    onClose: () => void;
  }>;
  FileUpload?: React.ComponentType<{
    onUpload: (file: File) => void;
    onClose: () => void;
  }>;
}

export function ChatBot({
  websocketUrl,
  userId,
  onUserInfoSubmit,
  onFileUpload,
  LoadingIcon,
  UserInfoForm,
  FileUpload,
}: ChatBotProps) {
  // State management
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const messageEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    try {
      if (!websocketUrl) {
        throw new Error("WebSocket URL is not configured");
      }
      ws.current = new WebSocket(websocketUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };

      ws.current.onclose = () => {
        setIsConnected(false);
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    if (data.type === "chat.message") {
      setIsLoading(false);
      const response = data.message;

      const mainContent = [
        response.mechanism,
        response.evidence1,
        response.evidence2,
        response.lab_analysis,
        response.final_advice,
      ]
        .filter(Boolean)
        .join("\n\n");

      const references = response.references
        ?.map(
          (ref: any, index: number) =>
            `[${index + 1}] ${ref.authors} (${ref.year}). ${ref.title}. ${
              ref.journal
            }`
        )
        .join("\n");

      const formattedText = references
        ? `${mainContent}\n\n참고문헌:\n${references}`
        : mainContent;

      streamResponse(formattedText);
    }
  };

  const streamResponse = (text: string) => {
    setIsStreaming(true);
    let currentText = "";
    const textArray = text.split("");
    let currentIndex = 0;

    const botMessageId = `bot_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: botMessageId,
        text: "",
        sender: "bot",
        timestamp: new Date().toISOString(),
      },
    ]);

    const streamText = () => {
      if (currentIndex < textArray.length) {
        currentText += textArray[currentIndex];
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: currentText } : msg
          )
        );
        currentIndex++;
        streamTimeoutRef.current = setTimeout(streamText, 20);
      } else {
        setIsStreaming(false);
      }
    };

    streamText();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;

    if (!ws.current || !isConnected) {
      alert("서버와 연결 중입니다. 잠시만 기다려주세요.");
      return;
    }

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    ws.current.send(
      JSON.stringify({
        message: inputMessage,
        user_id: userId,
        type: "chat.message",
      })
    );

    setInputMessage("");
  };

  // Effects
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [websocketUrl]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
    };
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative">
          <button
            onClick={() => setShowCards(!showCards)}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100"
          >
            <Settings />
          </button>


          {showCards && (
            <div className="absolute right-4 top-16 bg-white shadow-lg rounded-lg p-4">
              <button
                onClick={() => setShowUserInfoModal(true)}
                className="block w-full text-left p-2 hover:bg-gray-100 rounded"
              >
                사용자 정보 입력
              </button>
              <button
                onClick={() => setShowFileUploadModal(true)}
                className="block w-full text-left p-2 hover:bg-gray-100 rounded"
              >
                혈액 검사 파일 업로드
              </button>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          {isLoading && LoadingIcon && (
            <div className="text-center my-4">
              <LoadingIcon />
              <p className="mt-2">로딩 중...</p>
            </div>
          )}  

          {showUserInfoModal && UserInfoForm && (
            <UserInfoForm
              onSubmit={async (userInfo) => {
                await onUserInfoSubmit?.(userInfo);
                setShowUserInfoModal(false);
              }}
              onClose={() => setShowUserInfoModal(false)}
            />
          )}

          {showFileUploadModal && FileUpload && (
            <FileUpload
              onUpload={async (file) => {
                await onFileUpload?.(file);
                setShowFileUploadModal(false);
              }}
              onClose={() => setShowFileUploadModal(false)}
            />
          )}
        </div>
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2"
            placeholder="메시지를 입력하세요..."
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            <Send />
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-2">
          본 챗봇은 일반적인 영양 정보를 제공하며, 의료 전문가의 조언을 대체할 수
          없습니다.
        </p>
      </div>
    </div>
  );
} 