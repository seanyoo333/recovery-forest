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
import { Input } from "~/core/components/ui/input";
import { Separator } from "~/core/components/ui/separator";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient from "~/core/lib/supa-client.server";
import type { Database } from "~/core/lib/supa-client.server";
import { supabase } from "~/core/lib/supabase.client";

import { MessageBubble } from "../components/message-bubble";
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
  const { userId, name, avatar } = useOutletContext<{
    userId: string;
    name: string;
    avatar: string;
  }>();

  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (actionData?.ok) {
      formRef.current?.reset();
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
          setMessages((prev) => [
            ...prev,
            payload.new as Database["public"]["Tables"]["messages"]["Row"],
          ]);
        },
      )
      .subscribe();
    return () => {
      changes.unsubscribe();
    };
  }, []);
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Card className="flex-shrink-0">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={loaderData.participant?.profile?.avatar ?? ""} />
            <AvatarFallback>
              {loaderData.participant?.profile?.name?.charAt(0) ?? ""}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0">
            <CardTitle className="text-xl">
              {loaderData.participant?.profile?.name ?? ""}
            </CardTitle>
          </div>
        </CardHeader>
      </Card>
      <div className="h-[calc(100vh-300px)] space-y-4 overflow-y-scroll px-4 py-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.message_id}
            avatarUrl={
              message.sender_id === userId
                ? avatar
                : (loaderData.participant?.profile?.avatar ?? "")
            }
            avatarFallback={
              message.sender_id === userId
                ? name.charAt(0)
                : (loaderData.participant?.profile.name.charAt(0) ?? "")
            }
            content={message.content}
            isCurrentUser={message.sender_id === userId}
          />
        ))}
      </div>
      <Card className="flex-shrink-0">
        <CardHeader>
          <Form
            ref={formRef}
            method="post"
            className="relative flex items-center justify-end"
          >
            <Textarea
              placeholder="Write a message..."
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
