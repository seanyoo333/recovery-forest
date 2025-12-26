/**
 * Individual Message Screen
 *
 * This component displays a specific message conversation with a user.
 * Users can view the full conversation history and send new messages.
 */
import type { ShouldRevalidateFunctionArgs } from "react-router";

import type { Route } from "./+types/message";

import { SendIcon } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
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
import makeServerClient from "~/core/lib/supa-client.server";
import type { Database } from "~/core/lib/supa-client.server";
import { supabase } from "~/core/lib/supabase.client";

import {
  getLoggedInUserId,
  getMessagesByMessagesRoomId,
  sendMessageToRoom,
} from "../queries";
import { getRoomsParticipant } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: "Message | Evidence-Base",
    },
  ];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const messages = await getMessagesByMessagesRoomId(client, {
    messageRoomId: params.messageRoomId as string,
    userId,
  });
  const participant = await getRoomsParticipant(client, {
    messageRoomId: params.messageRoomId as string,
    userId,
  });

  return {
    messages,
    participant,
  };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const [client] = await makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const message = formData.get("message");
  await sendMessageToRoom(client, {
    messageRoomId: params.messageRoomId as string,
    message: message as string,
    userId,
  });
  return {
    ok: true,
  };
};

export default function MessagePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [messages, setMessages] = useState(loaderData.messages);
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
      // 메시지 전송 후 스크롤을 아래로 이동 (Realtime 메시지 도착 전)
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [actionData]);

  useEffect(() => {
    const changes = supabase
      .channel(`room:${userId}-${loaderData.participant?.profile?.profile_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prev) => {
            const newMessages = [
              ...prev,
              payload.new as Database["public"]["Tables"]["messages"]["Row"],
            ];
            // Realtime 메시지 추가 후 스크롤
            setTimeout(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop =
                  messagesContainerRef.current.scrollHeight;
              }
            }, 0);
            return newMessages;
          });
        },
      )
      .subscribe();
    return () => {
      changes.unsubscribe();
    };
  }, [userId, loaderData.participant?.profile?.profile_id]);

  // 초기 로드 시 스크롤을 맨 아래로 설정
  useEffect(() => {
    if (isInitialLoad && messagesContainerRef.current && messages.length > 0) {
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
    } else if (messages.length === 0) {
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, messages.length]);

  // 새 메시지가 추가될 때 스크롤을 아래로 이동
  useEffect(() => {
    if (!isInitialLoad && messagesContainerRef.current) {
      // 약간의 지연을 두어 DOM 업데이트 후 스크롤
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [messages, isInitialLoad]);
  return (
    <div className="flex h-full w-full flex-col overflow-hidden p-6">
      <Card className="flex-shrink-0">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-row items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage
                src={loaderData.participant?.profile?.avatar ?? ""}
              />
              <AvatarFallback>
                {loaderData.participant?.profile?.name?.charAt(0) ?? ""}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <CardTitle className="text-xl">
                {loaderData.participant?.profile?.name ?? ""}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div
        ref={messagesContainerRef}
        className="h-[calc(100vh-300px)] space-y-4 overflow-y-scroll px-4 py-4"
        style={{ scrollBehavior: isInitialLoad ? "auto" : "smooth" }}
      >
        {messages.map((message) => {
          const isUser = message.sender_id === userId;

          return (
            <div
              key={message.message_id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex max-w-xs gap-3 lg:max-w-md ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {!isUser && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage
                      src={loaderData.participant?.profile?.avatar ?? ""}
                    />
                    <AvatarFallback>
                      {loaderData.participant?.profile?.name?.charAt(0) ?? ""}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isUser
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      isUser ? "opacity-75" : "text-muted-foreground"
                    }`}
                  >
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
              placeholder="메시지를 입력하세요..."
              rows={2}
              required
              name="message"
              className="resize-none"
            />
            <Button type="submit" size="icon" className="absolute right-2">
              <SendIcon className="size-4" />
            </Button>
          </Form>
        </CardHeader>
      </Card>
    </div>
  );
}

export const shouldRevalidate = (args: ShouldRevalidateFunctionArgs) => {
  return args.currentUrl.pathname !== args.nextUrl.pathname;
};
