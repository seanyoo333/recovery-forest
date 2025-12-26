/**
 * Bot Message Page
 *
 * This component displays a specific bot chat conversation.
 * Users can view the conversation history and send new messages to the AI.
 */
import type { ShouldRevalidateFunctionArgs } from "react-router";

import type { Route } from "./+types/bot-message-page";

import { Bot, LogOut, SendIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { Form } from "react-router";
import { redirect, useParams } from "react-router";

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
  hideBotMessage,
  updateBotMessageRoomConversationId,
} from "../mutations";
import {
  getBotMessageRoomConversationId,
  getBotMessagesByBotMessageRoomId,
  sendBotMessageToRoom,
} from "../queries";
import { createConversationId, sendStreamMessage } from "../utils/evibot-api";

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

  // 기존 conversation_id 조회
  let conversationId: string | null = null;
  try {
    conversationId = await getBotMessageRoomConversationId(client, {
      botMessageRoomId: params.botMessageRoomId,
    });

    // conversation_id가 없으면 새로 생성하고 저장
    if (!conversationId) {
      conversationId = createConversationId();
      if (conversationId) {
        await updateBotMessageRoomConversationId(client, {
          botMessageRoomId: params.botMessageRoomId,
          conversationId,
        });
      }
    }
  } catch (error) {
    console.error("Failed to get or create conversation:", error);
    // conversationId 생성 실패해도 페이지는 로드되도록 함
  }

  return {
    botMessages,
    userId,
    conversationId,
  };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const message = formData.get("message") as string;
  const actionType = formData.get("action") as string;

  // 채팅방 나가기 처리
  if (actionType === "leave") {
    await hideBotMessage(client, {
      userId,
      botMessageRoomId: params.botMessageRoomId,
    });
    // conversationId 삭제 (채팅방 나가면 대화 기록도 함께 삭제)
    await updateBotMessageRoomConversationId(client, {
      botMessageRoomId: params.botMessageRoomId,
      conversationId: null,
    });
    throw redirect("/chat/botmessages");
  }

  if (!message) {
    return { ok: false, error: "Message is required" };
  }

  // 사용자 메시지를 Supabase에 저장
  await sendBotMessageToRoom(client, {
    botMessageRoomId: params.botMessageRoomId,
    message,
    userId,
  });

  // 데이터베이스에서 conversationId 조회 (formData 무시, 항상 DB에서 가져옴)
  let conversationId: string | null = null;
  try {
    conversationId = await getBotMessageRoomConversationId(client, {
      botMessageRoomId: params.botMessageRoomId,
    });
  } catch (error) {
    console.error("Failed to get conversationId:", error);
  }

  // conversationId가 없으면 새로 생성하고 저장
  if (!conversationId) {
    try {
      conversationId = createConversationId();
      if (conversationId) {
        await updateBotMessageRoomConversationId(client, {
          botMessageRoomId: params.botMessageRoomId,
          conversationId,
        });
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
      return { ok: false, error: "Failed to create conversation", message };
    }
  }

  return {
    ok: true,
    conversationId,
    message,
  };
};

type BotMessage = Database["public"]["Tables"]["bot_messages"]["Row"] & {
  is_temp?: boolean;
};

export default function BotMessagePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const params = useParams();
  const [botMessages, setBotMessages] = useState<BotMessage[]>(
    loaderData.botMessages,
  );
  const [isAILoading, setIsAILoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { userId, name, avatar } = useOutletContext<{
    userId: string;
    name: string;
    avatar: string;
  }>();
  const formRef = useRef<HTMLFormElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<string>("");
  const streamingMessageIdRef = useRef<string | null>(null);

  // actionData에서 스트리밍 시작
  useEffect(() => {
    if (!actionData?.ok || !actionData.message) {
      return;
    }

    const botMessageRoomId = params.botMessageRoomId;
    if (!botMessageRoomId) {
      console.error("No botMessageRoomId available for streaming");
      return;
    }

    // 폼 리셋 및 로딩 상태 설정
    formRef.current?.reset();
    setIsAILoading(true);

    // AI 응답 대기 중임을 나타내는 임시 메시지 표시
    const tempMessageId = `temp_${Date.now()}`;
    streamingMessageIdRef.current = tempMessageId;
    streamingMessageRef.current = "";

    const tempMessage: BotMessage = {
      bot_message_id: tempMessageId as unknown as number,
      bot_message_room_id: loaderData.botMessages[0]?.bot_message_room_id || 0,
      sender_id: "ai-assistant",
      content: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_temp: true,
    };

    setBotMessages((prev) => [...prev, tempMessage]);

    // 스트리밍 메시지 전송
    // conversationId는 서버에서 데이터베이스에서 조회
    sendStreamMessage(
      botMessageRoomId,
      actionData.message,
      userId,
      (chunk) => {
        streamingMessageRef.current += chunk;
        setBotMessages((prev) =>
          prev.map((msg) =>
            String(msg.bot_message_id) === tempMessageId
              ? { ...msg, content: streamingMessageRef.current }
              : msg,
          ),
        );
      },
      async () => {
        // 스트리밍 완료 후 서버 사이드 API를 통해 저장
        const finalContent = streamingMessageRef.current;
        if (finalContent && tempMessageId) {
          try {
            const roomId = loaderData.botMessages[0]?.bot_message_room_id;
            if (roomId) {
              const formData = new FormData();
              formData.append(
                "botMessageRoomId",
                params.botMessageRoomId || "",
              );
              formData.append("content", finalContent);

              const response = await fetch("/chat/api/save-ai-message", {
                method: "POST",
                body: formData,
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Failed to save AI response:", errorData);
              }
              // Supabase real-time을 통해 실제 메시지가 추가되면
              // 임시 메시지는 자동으로 제거됨
            }
          } catch (error) {
            console.error("Failed to save AI response:", error);
          }
        }

        setIsAILoading(false);
        streamingMessageIdRef.current = null;
        streamingMessageRef.current = "";
      },
      (error) => {
        console.error("Streaming error:", error);
        setBotMessages((prev) =>
          prev.map((msg) =>
            String(msg.bot_message_id) === tempMessageId
              ? {
                  ...msg,
                  content:
                    "응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
                }
              : msg,
          ),
        );
        setIsAILoading(false);
        streamingMessageIdRef.current = null;
        streamingMessageRef.current = "";
      },
    );
  }, [actionData, params.botMessageRoomId, userId]);

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
    <div className="flex h-full w-full flex-col overflow-hidden p-6">
      <Card className="flex-shrink-0">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-row items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                EVI
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <CardTitle className="text-xl">Evidence Base AI</CardTitle>
              <p className="text-muted-foreground text-sm">
                AI Research Assistant
              </p>
            </div>
          </div>
          <Form method="post">
            <input type="hidden" name="action" value="leave" />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={(e) => {
                if (
                  !confirm(
                    "이 방이 종료되면, 기존에 대화가 모두 사라집니다. 종료하시겠습니까?",
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <LogOut className="h-4 w-4" />
              채팅방 종료
            </Button>
          </Form>
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
          const isTemp = message.is_temp || false;

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
                      className={`text-white ${
                        isAI
                          ? "bg-gradient-to-br from-blue-500 to-purple-600"
                          : "bg-gray-500"
                      }`}
                    >
                      {isAI ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">U</span>
                      )}
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
                      <>
                        <span className="font-medium text-blue-600">
                          AI Assistant
                        </span>{" "}
                      </>
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
