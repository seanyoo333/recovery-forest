import { useEffect, useState } from "react";

import { supabase } from "~/core/lib/supabase.client";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  userId: string;
  timestamp: Date;
  metadata?: any;
}

export function useChatMessages(
  initialMessages: ChatMessage[],
  userId: string,
  sessionId?: number | null,
) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(
    sessionId || null,
  );

  // Supabase 리얼타임 구독
  useEffect(() => {
    if (!currentSessionId) return;

    const channel = supabase
      .channel(`chat_messages_${currentSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${currentSessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          const chatMessage: ChatMessage = {
            id: newMessage.id.toString(),
            content: newMessage.content,
            role: newMessage.role,
            userId: newMessage.user_id,
            timestamp: new Date(newMessage.created_at),
            metadata: newMessage.metadata,
          };

          setMessages((prev) => [...prev, chatMessage]);
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSessionId]);

  // 메시지 전송 및 AI 응답 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 세션이 없으면 새 세션 생성
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      try {
        const { data: newSession, error } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            session_name: "New Chat",
          })
          .select()
          .single();

        if (error) throw error;
        activeSessionId = newSession.session_id;
        setCurrentSessionId(activeSessionId);
      } catch (error) {
        console.error("세션 생성 오류:", error);
        return;
      }
    }

    // activeSessionId가 여전히 null이면 오류 처리
    if (!activeSessionId) {
      console.error("세션 ID를 가져올 수 없습니다.");
      return;
    }

    setIsLoading(true);

    try {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: input,
        role: "user",
        userId,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // 사용자 메시지를 Supabase에 저장
      const { error: userError } = await supabase.from("chat_messages").insert({
        session_id: activeSessionId,
        user_id: userId,
        role: "user",
        content: input,
        metadata: {},
      });

      if (userError) throw userError;

      // AI 응답 요청
      const formData = new FormData();
      formData.append("message", input);
      formData.append("sessionId", activeSessionId.toString());
      formData.append("prescription", "No");
      formData.append("responseType", "text");

      const response = await fetch("/api/langchain", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("AI 응답 요청 실패");
      }

      const result = await response.json();

      if (result.success) {
        // AI 응답을 Supabase에 저장 (실시간으로 다른 클라이언트에 전파됨)
        const { error: aiError } = await supabase.from("chat_messages").insert({
          session_id: activeSessionId,
          user_id: userId,
          role: "assistant",
          content: result.response,
          metadata: {},
        });

        if (aiError) throw aiError;
      } else {
        throw new Error(result.error || "AI 응답 처리 실패");
      }

      setInput("");
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      // 오류 메시지를 UI에 표시
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: "메시지 전송 중 오류가 발생했습니다.",
        role: "assistant",
        userId: "system",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    isConnected,
    handleSubmit,
  };
}
