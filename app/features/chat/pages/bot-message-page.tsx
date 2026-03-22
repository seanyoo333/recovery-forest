/**
 * Bot Message Page
 *
 * This component displays a specific bot chat conversation.
 * Users can view the conversation history and send new messages to the AI.
 */
import type { ShouldRevalidateFunctionArgs } from "react-router";

import type { Route } from "./+types/bot-message-page";

import {
  BookOpen,
  Bookmark,
  FileSearch,
  FileText,
  Globe,
  Loader2,
  LogOut,
  Search,
  SendIcon,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, Link, useOutletContext } from "react-router";
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
import {
  type OutputPayload,
  createConversationId,
  streamChat,
} from "../utils/evibot-api";

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

  // 데이터베이스에서 conversationId 조회
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
  const isWriterStreamingRef = useRef(false);

  // 스트리밍 상태
  const [streamingText, setStreamingText] = useState("");
  const [isWriterStreaming, setIsWriterStreaming] = useState(false);
  const [output, setOutput] = useState<OutputPayload | null>(null);
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [bookmarkingMessageId, setBookmarkingMessageId] = useState<
    number | null
  >(null);

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

    // 폼 리셋 및 상태 초기화
    formRef.current?.reset();
    setIsAILoading(true);
    setIsStreaming(true);
    setStatus("시작...");
    setSaved(false);
    setOutput(null);
    setStreamingText("");
    setIsWriterStreaming(false);
    isWriterStreamingRef.current = false;

    streamChat(botMessageRoomId, actionData.message, userId, {
      onStart: () => {},
      onStatus: (text) => {
        setStatus(text);
      },
      onSectionStart: (section) => {
        // writer 스트리밍 시작 감지
        if (!isWriterStreamingRef.current) {
          isWriterStreamingRef.current = true;
          setIsWriterStreaming(true);
          setStreamingText("");
        }
      },
      onDelta: (section, text) => {
        // 새 텍스트 추가 후 전체 텍스트를 정리하는 함수
        setStreamingText((prev) => {
          // 새 텍스트를 추가
          const newText = prev + text;

          // 누적된 전체 텍스트에서 태그 및 불필요한 내용 제거
          let cleanedText = newText
            // JSON 태그와 그 사이의 모든 내용 제거 (가장 먼저 처리)
            .replace(/\[\[JSON\]\][\s\S]*?\[\[\/JSON\]\]/g, "")
            // JSON 블록 전체 제거 (중괄호 포함, 여러 줄, 더 포괄적으로)
            .replace(
              /\{[\s\S]*?"(first_paragraph|second_paragraph|third_paragraph|fourth_paragraph|references|source_type|title|url|pmid|year|authors)"[\s\S]*?\}/g,
              "",
            )
            .replace(
              /\{[\s\S]*?"first_paragraph"[\s\S]*?"fourth_paragraph"[\s\S]*?\}/g,
              "",
            )
            .replace(/\{[\s\S]*?"first_paragraph"[\s\S]*?\}/g, "")
            .replace(/\{[\s\S]*?"second_paragraph"[\s\S]*?\}/g, "")
            .replace(/\{[\s\S]*?"third_paragraph"[\s\S]*?\}/g, "")
            .replace(/\{[\s\S]*?"fourth_paragraph"[\s\S]*?\}/g, "")
            .replace(/\{[\s\S]*?"source_type"[\s\S]*?\}/g, "")
            .replace(/\{[\s\S]*?"references"[\s\S]*?\}/g, "")
            // JSON 객체 시작 부분 제거 (불완전한 JSON 블록)
            .replace(/\{[^}]*"source_type"[^}]*/g, "")
            .replace(/\{[^}]*"first_paragraph"[^}]*/g, "")
            .replace(/\{[^}]*"second_paragraph"[^}]*/g, "")
            .replace(/\{[^}]*"third_paragraph"[^}]*/g, "")
            .replace(/\{[^}]*"fourth_paragraph"[^}]*/g, "")
            // JSON 필드명 문자열 제거 (따옴표 포함)
            .replace(/"first_paragraph"\s*:/g, "")
            .replace(/"second_paragraph"\s*:/g, "")
            .replace(/"third_paragraph"\s*:/g, "")
            .replace(/"fourth_paragraph"\s*:/g, "")
            .replace(/"references"\s*:/g, "")
            .replace(/"source_type"\s*:/g, "")
            .replace(/"title"\s*:/g, "")
            .replace(/"url"\s*:/g, "")
            .replace(/"pmid"\s*:/g, "")
            .replace(/"year"\s*:/g, "")
            .replace(/"authors"\s*:/g, "")
            // 모든 태그 패턴 제거 (완전한 태그)
            .replace(/\[\[P[1-4]\]\]/g, "")
            .replace(/\[\[\/P[1-4]\]\]/g, "")
            .replace(/\[\[JSON\]\]/g, "")
            .replace(/\[\[\/JSON\]\]/g, "")
            // 불완전한 태그 패턴 제거
            .replace(/\[\[[PJ][1-4]?\/?\]?\]?/g, "")
            .replace(/\[\[[^\]]*\]\]/g, "") // [[...]] 형태의 모든 태그
            // 단독으로 나타나는 태그 문자들 제거 (P1, P2, P3, P4, /P1, /P2, /P3, /P4)
            .replace(/\bP[1-4]\b/g, "")
            .replace(/\b\/P[1-4]\b/g, "")
            .replace(/\bJSON\b/g, "")
            .replace(/\b\/JSON\b/g, "")
            // 슬래시 제거 (단독으로 나타나는 경우)
            .replace(/\s*\/\s*/g, " ")
            .replace(/\/+/g, "")
            // 남은 태그 괄호 제거
            .replace(/\[\[/g, "")
            .replace(/\]\]/g, "")
            // 섹션 헤더 제거 (공백 허용, 여러 줄 모드)
            .replace(/\(1\)\s*기전\s*:/g, "")
            .replace(/\(2\)\s*근거\s*:/g, "")
            .replace(/\(3\)\s*환자\s*관련\s*해석\s*:/g, "")
            .replace(/\(4\)\s*실천적\s*조언\s*:/g, "")
            // 숫자 패턴의 섹션 헤더 제거 (예: (1) , (2) 등, 여러 줄 모드)
            .replace(/^\(\d+\)\s*[가-힣\s]*:\s*/gm, "")
            // 줄 시작의 섹션 헤더 제거 (예: 줄바꿈 후 (1) 기전:)
            .replace(/\n\s*\(\d+\)\s*[가-힣\s]*:\s*/g, "\n")
            // 연속된 공백 정리
            .replace(/\n{3,}/g, "\n\n")
            .replace(/\s{2,}/g, " ") // 연속된 공백을 하나로
            .trim();

          return cleanedText;
        });
      },
      onSectionDone: () => {
        // 섹션 완료 시 줄바꿈 추가하고 전체 텍스트 정리
        setStreamingText((prev) => {
          const newText = prev + "\n\n";
          // 태그 및 불필요한 내용 제거 (혹시 섹션 완료 시점에 남아있을 수 있는 태그)
          return (
            newText
              // JSON 태그와 그 사이의 모든 내용 제거
              .replace(/\[\[JSON\]\][\s\S]*?\[\[\/JSON\]\]/g, "")
              // JSON 블록 전체 제거
              .replace(
                /\{[\s\S]*?"(first_paragraph|second_paragraph|third_paragraph|fourth_paragraph|references|source_type|title|url|pmid|year|authors)"[\s\S]*?\}/g,
                "",
              )
              .replace(/\{[^}]*"source_type"[^}]*/g, "")
              // JSON 필드명 문자열 제거 (따옴표 포함)
              .replace(/"first_paragraph"\s*:/g, "")
              .replace(/"second_paragraph"\s*:/g, "")
              .replace(/"third_paragraph"\s*:/g, "")
              .replace(/"fourth_paragraph"\s*:/g, "")
              .replace(/"references"\s*:/g, "")
              .replace(/"source_type"\s*:/g, "")
              .replace(/"title"\s*:/g, "")
              .replace(/"url"\s*:/g, "")
              .replace(/"pmid"\s*:/g, "")
              .replace(/"year"\s*:/g, "")
              .replace(/"authors"\s*:/g, "")
              // 모든 태그 패턴 제거
              .replace(/\[\[P[1-4]\]\]/g, "")
              .replace(/\[\[\/P[1-4]\]\]/g, "")
              .replace(/\[\[JSON\]\]/g, "")
              .replace(/\[\[\/JSON\]\]/g, "")
              .replace(/\[\[[PJ][1-4]?\/?\]?\]?/g, "")
              .replace(/\[\[[^\]]*\]\]/g, "")
              // 단독으로 나타나는 태그 문자들 제거
              .replace(/\bP[1-4]\b/g, "")
              .replace(/\b\/P[1-4]\b/g, "")
              .replace(/\bJSON\b/g, "")
              .replace(/\b\/JSON\b/g, "")
              // 슬래시 제거 (단독으로 나타나는 경우)
              .replace(/\s*\/\s*/g, " ")
              .replace(/\/+/g, "")
              // 남은 태그 괄호 제거
              .replace(/\[\[/g, "")
              .replace(/\]\]/g, "")
              // 연속된 공백 정리
              .replace(/\n{3,}/g, "\n\n")
              .replace(/\s{2,}/g, " ") // 연속된 공백을 하나로
              .trim()
          );
        });
      },
      onComplete: (outputPayload) => {
        setOutput(outputPayload);
        setStatus("완료!");
        // 최종 결과를 하나의 텍스트로 합치기
        const finalText = [
          outputPayload.first_paragraph,
          outputPayload.second_paragraph,
          outputPayload.third_paragraph,
          outputPayload.fourth_paragraph,
        ]
          .filter(Boolean)
          .join("\n\n");
        setStreamingText(finalText);
        setIsAILoading(false);
      },
      onSaved: () => {
        setSaved(true);
        setIsStreaming(false);
        setIsWriterStreaming(false);
        isWriterStreamingRef.current = false;
      },
      onError: (error) => {
        console.error("[SSE] Error:", error);
        setStatus(`오류: ${error.message}`);
        setIsAILoading(false);
        setIsStreaming(false);
        setIsWriterStreaming(false);
        isWriterStreamingRef.current = false;
      },
    });
  }, [actionData, params.botMessageRoomId, userId]);

  // Supabase real-time 구독 (사용자 메시지 + AI 메시지)
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

          // 사용자 메시지 추가
          if (newMessage.sender_id === userId) {
            setBotMessages((prev) => [...prev, newMessage]);
          }

          // AI 메시지 도착 시 상태 메시지 숨기고 메시지 추가
          if (newMessage.sender_id === "ai-assistant") {
            // 상태 메시지 숨기기
            setStatus("");
            setSaved(false);
            setOutput(null);
            setStreamingText("");
            setIsStreaming(false);
            setIsWriterStreaming(false);
            isWriterStreamingRef.current = false;

            // AI 메시지를 botMessages에 추가
            setBotMessages((prev) => {
              // 중복 방지: 이미 존재하는 메시지는 추가하지 않음
              const exists = prev.some(
                (msg) => msg.bot_message_id === newMessage.bot_message_id,
              );
              if (exists) return prev;
              return [...prev, newMessage];
            });
          }
        },
      )
      .subscribe();

    return () => {
      changes.unsubscribe();
    };
  }, [loaderData.botMessages[0]?.bot_message_room_id, userId]);

  // 스크롤 자동 이동 (초기 로드, 새 메시지, AI 응답 완료 시)
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    if (isInitialLoad) {
      // 초기 로드 시: 애니메이션 없이 즉시 스크롤
      messagesContainerRef.current.style.scrollBehavior = "auto";
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;

      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.style.scrollBehavior = "smooth";
        }
        setIsInitialLoad(false);
      }, 0);
    } else {
      // 새 메시지 또는 AI 응답 완료 시: 부드럽게 스크롤
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [
    isInitialLoad,
    botMessages,
    streamingText,
    isWriterStreaming,
    output,
    saved,
  ]);

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
          <div className="flex items-center gap-2">
            <Link to="/my/dashboard/bookmarks">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Bookmark className="h-4 w-4" />
                북마크 보러가기
              </Button>
            </Link>
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
          </div>
        </CardHeader>
      </Card>

      <div
        ref={messagesContainerRef}
        className="flex h-[calc(100vh-300px)] flex-col space-y-4 overflow-y-scroll px-4 py-4"
        style={{ scrollBehavior: isInitialLoad ? "auto" : "smooth" }}
      >
        {/* 메시지 목록 (사용자 + AI) */}
        <div className="space-y-4">
          {botMessages.map((message) => {
            const isUser = message.sender_id === userId;
            const isAI = message.sender_id === "ai-assistant";

            // 사용자 메시지
            if (isUser) {
              return (
                <div key={message.bot_message_id} className="flex justify-end">
                  <div className="flex max-w-xs flex-row-reverse gap-3 lg:max-w-md">
                    <div className="rounded-lg bg-blue-500 px-4 py-2 text-white">
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className="mt-1 text-xs opacity-75">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // AI 메시지 (항상 표시)
            if (isAI) {
              let aiContent: OutputPayload | null = null;
              try {
                aiContent = JSON.parse(message.content) as OutputPayload;
              } catch {
                // JSON 파싱 실패 시 원본 텍스트 표시
                aiContent = null;
              }

              const paragraphs = aiContent
                ? [
                    aiContent.first_paragraph,
                    aiContent.second_paragraph,
                    aiContent.third_paragraph,
                    aiContent.fourth_paragraph,
                  ].filter(Boolean)
                : [];

              return (
                <div
                  key={message.bot_message_id}
                  className="flex justify-start"
                >
                  <div className="flex max-w-3xl flex-row gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        EVI
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-card w-full space-y-6 rounded-xl border p-6 shadow-sm">
                      {aiContent ? (
                        <>
                          {/* 문단들 */}
                          <div className="space-y-5">
                            {paragraphs.map((paragraph, index) => (
                              <p
                                key={index}
                                className="text-foreground text-base leading-7"
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>

                          {/* 참고 문헌 */}
                          {aiContent.references &&
                            aiContent.references.length > 0 && (
                              <div className="border-t pt-6">
                                <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
                                  참고 문헌
                                </h3>
                                <ol className="space-y-3">
                                  {aiContent.references.map((ref, i) => {
                                    const hasValidUrl =
                                      ref.url &&
                                      ref.url.trim() !== "" &&
                                      ref.url !== "#";

                                    return (
                                      <li
                                        key={i}
                                        className="text-muted-foreground text-sm leading-relaxed"
                                      >
                                        <span className="font-medium">
                                          {i + 1}.{" "}
                                        </span>
                                        {hasValidUrl ? (
                                          <a
                                            href={ref.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline"
                                          >
                                            {ref.title}
                                          </a>
                                        ) : (
                                          <span className="text-foreground font-medium">
                                            {ref.title}
                                          </span>
                                        )}
                                        {ref.source_type && (
                                          <>
                                            .{" "}
                                            <span className="font-medium">
                                              {ref.source_type}
                                            </span>
                                          </>
                                        )}
                                        {ref.year && (
                                          <>
                                            . <span>{ref.year}</span>
                                          </>
                                        )}
                                        {ref.authors && (
                                          <>
                                            . <span>{ref.authors}</span>
                                          </>
                                        )}
                                        {ref.pmid && (
                                          <span className="ml-2 text-xs">
                                            (PMID: {ref.pmid})
                                          </span>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ol>
                              </div>
                            )}
                        </>
                      ) : (
                        <p className="text-foreground text-base leading-7 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-muted-foreground text-xs">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                        {/* 건강 질문인 경우에만 북마크 버튼 표시 */}
                        {aiContent && aiContent.is_health_question === true && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={async () => {
                              if (
                                bookmarkingMessageId === message.bot_message_id
                              ) {
                                return;
                              }

                              // 해당 AI 메시지 이전의 사용자 질문 찾기
                              const messageIndex = botMessages.findIndex(
                                (m) =>
                                  m.bot_message_id === message.bot_message_id,
                              );
                              const userQuestion =
                                messageIndex > 0
                                  ? botMessages
                                      .slice(0, messageIndex)
                                      .reverse()
                                      .find((m) => m.sender_id === userId)
                                      ?.content
                                  : "";

                              if (!userQuestion) {
                                alert("질문을 찾을 수 없습니다.");
                                return;
                              }

                              setBookmarkingMessageId(message.bot_message_id);

                              try {
                                const response = await fetch(
                                  "/chat/api/save-health-bookmark",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      botMessageId: String(
                                        message.bot_message_id,
                                      ),
                                      botMessageRoomId: params.botMessageRoomId,
                                      question: userQuestion,
                                      answer: {
                                        first_paragraph:
                                          aiContent.first_paragraph,
                                        second_paragraph:
                                          aiContent.second_paragraph,
                                        third_paragraph:
                                          aiContent.third_paragraph,
                                        fourth_paragraph:
                                          aiContent.fourth_paragraph,
                                        references: aiContent.references,
                                        warning: aiContent.warning,
                                      },
                                      title: userQuestion.substring(0, 100),
                                    }),
                                  },
                                );

                                if (!response.ok) {
                                  const errorData = await response
                                    .json()
                                    .catch(() => ({}));
                                  throw new Error(
                                    errorData.error ||
                                      "북마크 저장에 실패했습니다.",
                                  );
                                }

                                alert("북마크에 저장되었습니다!");
                              } catch (error) {
                                console.error(
                                  "Failed to save bookmark:",
                                  error,
                                );
                                alert(
                                  error instanceof Error
                                    ? error.message
                                    : "북마크 저장에 실패했습니다.",
                                );
                              } finally {
                                setBookmarkingMessageId(null);
                              }
                            }}
                            disabled={
                              bookmarkingMessageId === message.bot_message_id
                            }
                          >
                            {bookmarkingMessageId === message.bot_message_id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                저장 중...
                              </>
                            ) : (
                              <>
                                <Bookmark className="h-4 w-4" />
                                북마크로 저장하기
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* AI 응답 */}
        {(isStreaming || saved) && (
          <div className="space-y-4">
            {/* 검색 중 상태 표시 (writer 스트리밍이 아닐 때만) */}
            {!isWriterStreaming && status && (
              <div className="animate-in fade-in flex items-center gap-2 transition-opacity duration-300">
                <Loader2 className="text-primary size-4 animate-spin" />
                {getStatusIcon(status)}
                <span className="text-muted-foreground text-sm">{status}</span>
              </div>
            )}

            {saved && (
              <div className="animate-in fade-in flex items-center gap-2 transition-opacity duration-300">
                <div className="size-4 rounded-full bg-green-500" />
                <span className="text-sm text-green-600">✅ 저장 완료</span>
              </div>
            )}

            {output?.warning && (
              <div className="animate-in fade-in rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 transition-opacity duration-300">
                ⚠ {output.warning}
              </div>
            )}

            {/* Writer 스트리밍이 시작되면 하나의 텍스트 영역에 표시 */}
            {(isWriterStreaming || output) && (
              <div className="flex justify-start">
                <div className="flex max-w-3xl flex-row gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      EVI
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-card w-full space-y-6 rounded-xl border p-6 shadow-sm">
                    <div className="space-y-5">
                      <div className="text-foreground text-base leading-7 whitespace-pre-wrap">
                        {streamingText ||
                          (isWriterStreaming ? "작성 중..." : "")}
                      </div>
                    </div>

                    {/* 참고 문헌 (완료 후에만 표시) */}
                    {output?.references && output.references.length > 0 && (
                      <div className="border-t pt-6">
                        <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
                          참고 문헌
                        </h3>
                        <ol className="space-y-3">
                          {output.references.map((ref, i) => {
                            const hasValidUrl =
                              ref.url &&
                              ref.url.trim() !== "" &&
                              ref.url !== "#";

                            return (
                              <li
                                key={i}
                                className="text-muted-foreground text-sm leading-relaxed"
                              >
                                <span className="font-medium">{i + 1}. </span>
                                {hasValidUrl ? (
                                  <a
                                    href={ref.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline"
                                  >
                                    {ref.title}
                                  </a>
                                ) : (
                                  <span className="text-foreground font-medium">
                                    {ref.title}
                                  </span>
                                )}
                                {ref.source_type && (
                                  <>
                                    .{" "}
                                    <span className="font-medium">
                                      {ref.source_type}
                                    </span>
                                  </>
                                )}
                                {ref.year && (
                                  <>
                                    . <span>{ref.year}</span>
                                  </>
                                )}
                                {ref.authors && (
                                  <>
                                    . <span>{ref.authors}</span>
                                  </>
                                )}
                                {ref.pmid && (
                                  <span className="ml-2 text-xs">
                                    (PMID: {ref.pmid})
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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

// 상태 메시지에 따른 아이콘 반환
function getStatusIcon(status: string) {
  if (status.includes("분석")) {
    return <Search className="text-primary size-4" />;
  }
  if (status.includes("RAG") || status.includes("검색")) {
    return <FileSearch className="text-primary size-4" />;
  }
  if (status.includes("웹")) {
    return <Globe className="text-primary size-4" />;
  }
  if (status.includes("PubMed") || status.includes("논문")) {
    return <BookOpen className="text-primary size-4" />;
  }
  if (status.includes("Scholar")) {
    return <BookOpen className="text-primary size-4" />;
  }
  if (status.includes("환자")) {
    return <User className="text-primary size-4" />;
  }
  if (status.includes("작성") || status.includes("문서")) {
    return <FileText className="text-primary size-4" />;
  }
  return null;
}
