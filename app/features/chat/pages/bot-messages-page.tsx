/**
 * Bot Messages Page
 *
 * This component displays a list of bot chat rooms for the authenticated user.
 * Users can create new chat rooms and navigate to existing ones.
 */
import type { Route } from "./+types/bot-messages-page";

import { MessageCircleIcon, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { Form } from "react-router";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { getBotMessageRoomsByUserId } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Bot Messages | Evidence-Base" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);
    const botMessageRooms = await getBotMessageRoomsByUserId(client, {
      userId,
    });

    return {
      userId,
      botMessageRooms,
    };
  } catch (error) {
    console.error("Bot messages loader error:", error);
    return {
      userId: null,
      botMessageRooms: [],
    };
  }
};

export default function BotMessagesPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { userId, botMessageRooms } = loaderData;

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">채팅방 목록</h1>
        <Form
          method="post"
          action="/chat/api/create-room"
          encType="multipart/form-data"
        >
          <input type="hidden" name="roomName" value="새로운 AI 채팅방" />
          <input
            type="hidden"
            name="roomDescription"
            value="AI와의 새로운 대화를 시작합니다."
          />
          <Button type="submit" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />새 채팅방 만들기
          </Button>
        </Form>
      </div>

      <div className="flex-1">
        {botMessageRooms && botMessageRooms.length > 0 ? (
          <div className="grid gap-4">
            {botMessageRooms.map((room: any) => (
              <Card
                key={room.bot_message_room_id}
                className="cursor-pointer transition-colors hover:bg-gray-50"
                onClick={() =>
                  navigate(`/chat/botmessages/${room.bot_message_room_id}`)
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    {room.bot_message_rooms?.room_name || "AI Chat Room"}
                  </CardTitle>
                  {room.bot_message_rooms?.room_description && (
                    <p className="text-muted-foreground text-sm">
                      {room.bot_message_rooms.room_description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <span>생성자: {room.profiles?.name || "Unknown"}</span>
                    <span>
                      {new Date(
                        room.bot_message_rooms?.created_at || room.created_at,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <MessageCircleIcon className="text-muted-foreground size-12" />
            <h2 className="text-muted-foreground text-xl font-semibold">
              아직 채팅방이 없습니다
            </h2>
            <p className="text-muted-foreground text-center">
              새로운 채팅방을 만들어 AI와 대화를 시작해보세요.
            </p>
            <Form
              method="post"
              action="/chat/api/create-room"
              encType="multipart/form-data"
            >
              <input type="hidden" name="roomName" value="첫 번째 AI 채팅방" />
              <input
                type="hidden"
                name="roomDescription"
                value="AI와의 첫 번째 대화를 시작합니다."
              />
              <Button type="submit" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />첫 번째 채팅방 만들기
              </Button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
