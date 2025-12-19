/**
 * Bot Message Page
 *
 * This component displays a specific bot chat conversation.
 * Users can view the conversation history and send new messages to the AI.
 */
import type { ShouldRevalidateFunctionArgs } from "react-router";

import type { Route } from "./+types/bot-message-page";

import { SendIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { Form } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import { Card, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient, { type Database } from "~/core/lib/supa-client.server";
import { supabase } from "~/core/lib/supabase.client";
import { getLoggedInUserId } from "~/features/users/queries";

import {
  getBotMessagesByBotMessageRoomId,
  sendBotMessageToRoom,
} from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Bot Message | Evidence-Base" }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const botMessages = await getBotMessagesByBotMessageRoomId(client, {
    botMessageRoomId: params.botMessageRoomId,
    userId,
  });

  return {
    botMessages,
    userId,
  };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const message = formData.get("message") as string;

  // 사용자 메시지를 Supabase에 저장
  await sendBotMessageToRoom(client, {
    botMessageRoomId: params.botMessageRoomId,
    message,
    userId,
  });

  // 직접 AWS 챗봇 API 호출
  try {
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

    const aiResponse = await fetch(`${LLM_SERVER_URL}/api/langchain/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message,
        user_id: userId,
        room_id: params.botMessageRoomId,
        prescription: "No",
        response_type: "text",
      }),
    });

    if (!aiResponse.ok) {
      return { ok: true }; // 사용자 메시지는 저장되었으므로 성공으로 처리
    }

    const aiData = await aiResponse.json();

    if (aiData.status === "success" && aiData.message) {
      // AI 응답을 Supabase에 저장
      const aiResponseText =
        typeof aiData.message === "string"
          ? aiData.message
          : aiData.message.content || JSON.stringify(aiData.message);

      try {
        await sendBotMessageToRoom(client, {
          botMessageRoomId: params.botMessageRoomId,
          message: aiResponseText,
          userId: "ai-assistant",
        });
      } catch (dbError) {
        throw new Error("AI 응답을 저장하는 중 오류가 발생했습니다.");
      }
    }
  } catch (error) {
    // 에러는 조용히 처리 (사용자 메시지는 이미 저장됨)
  }

  return { ok: true };
};

export default function BotMessagePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [botMessages, setBotMessages] = useState(loaderData.botMessages);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { userId, name, avatar } = useOutletContext<{
    userId: string;
    name: string;
    avatar: string;
  }>();
  const formRef = useRef<HTMLFormElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (actionData?.ok) {
      formRef.current?.reset();
      setIsAILoading(true);

      // AI 응답 대기 중임을 나타내는 임시 메시지 표시
      const tempMessage = {
        bot_message_id: `temp_${Date.now()}`,
        bot_message_room_id: loaderData.botMessages[0]?.bot_message_room_id,
        sender_id: "ai-assistant",
        content: "AI가 응답을 생성하고 있습니다...",
        created_at: new Date().toISOString(),
        is_temp: true,
      };

      setBotMessages((prev) => [...prev, tempMessage]);
    }
  }, [actionData, loaderData.botMessages]);

  // Supabase real-time 구독
  useEffect(() => {
    const roomId = loaderData.botMessages[0]?.bot_message_room_id;
    if (!roomId) return;

    const changes = supabase
      .channel(`bot-messages:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bot_messages",
          filter: `bot_message_room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage =
            payload.new as Database["public"]["Tables"]["bot_messages"]["Row"];

          // 실제 AI 응답이 오면 임시 메시지 제거
          if (newMessage.sender_id === "ai-assistant") {
            setBotMessages((prev) => {
              const filtered = prev.filter((msg) => !msg.is_temp);
              return [...filtered, newMessage];
            });
            setIsAILoading(false);
          } else {
            setBotMessages((prev) => [...prev, newMessage]);
          }
        },
      )
      .subscribe();

    return () => {
      changes.unsubscribe();
    };
  }, [loaderData.botMessages[0]?.bot_message_room_id]); // roomId만 의존성으로 변경

  // 초기 로드 시 스크롤을 맨 아래로 설정
  useEffect(() => {
    if (isInitialLoad && messagesContainerRef.current) {
      // scroll-behavior를 auto로 설정하여 애니메이션 없이 즉시 스크롤
      messagesContainerRef.current.style.scrollBehavior = "auto";
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;

      // 스크롤 후 다시 smooth로 변경
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.style.scrollBehavior = "smooth";
        }
        setIsInitialLoad(false);
      }, 0);
    }
  }, [isInitialLoad]);

  // 새 메시지가 추가될 때 스크롤을 아래로 이동
  useEffect(() => {
    if (!isInitialLoad && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [botMessages, isInitialLoad]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Card className="flex-shrink-0">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              AI
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0">
            <CardTitle className="text-xl">Evidence Base AI</CardTitle>
            <p className="text-muted-foreground text-sm">
              AI Research Assistant
            </p>
          </div>
        </CardHeader>
      </Card>

      <div
        ref={messagesContainerRef}
        className="h-[calc(100vh-300px)] space-y-4 overflow-y-scroll px-4 py-4"
        style={{ scrollBehavior: isInitialLoad ? "auto" : "smooth" }}
      >
        {botMessages.map((message) => {
          const isAI = message.sender_id === "ai-assistant";
          const isUser = message.sender_id === userId;
          const isTemp = message.is_temp;

          return (
            <div
              key={message.bot_message_id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex max-w-xs gap-3 lg:max-w-md ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {!isUser && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback
                      className={`text-xs text-white ${
                        isAI
                          ? "bg-gradient-to-br from-blue-500 to-purple-600"
                          : "bg-gray-500"
                      }`}
                    >
                      {isAI ? "AI" : "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isUser
                      ? "bg-blue-500 text-white"
                      : isAI
                        ? isTemp
                          ? "border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 text-gray-700"
                          : "border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900"
                        : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {isTemp && (
                      <span className="mr-2 inline-block animate-pulse">
                        ⏳
                      </span>
                    )}
                    {message.content}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      isUser ? "opacity-75" : "text-muted-foreground"
                    }`}
                  >
                    {isAI && !isTemp && (
                      <span className="font-medium text-blue-600">
                        AI Assistant
                      </span>
                    )}
                    {isTemp && (
                      <span className="font-medium text-yellow-600">
                        응답 생성 중...
                      </span>
                    )}
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="flex-shrink-0">
        <CardHeader>
          <Form
            ref={formRef}
            method="post"
            className="relative flex items-center justify-end"
          >
            <Textarea
              placeholder="AI에게 질문하세요..."
              rows={2}
              required
              name="message"
              className="resize-none"
              disabled={isAILoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2"
              disabled={isAILoading}
            >
              {isAILoading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <SendIcon className="size-4" />
              )}
            </Button>
          </Form>
        </CardHeader>
      </Card>
    </div>
  );
}

// 성능 최적화: 같은 페이지 내에서는 데이터 재검증 비활성화
// 리얼타임과 폴링으로 이미 최신 데이터가 유지되므로 불필요한 서버 요청 방지
export const shouldRevalidate = (args: ShouldRevalidateFunctionArgs) => {
  return args.currentUrl.pathname !== args.nextUrl.pathname;
};
