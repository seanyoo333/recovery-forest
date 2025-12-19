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

import {
  getBotMessageRoomsByUserId,
  getMessageRoomsByUserId,
} from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Bot Messages | Evidence-Base" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    // AI 채팅방과 일반 채팅방을 병렬로 조회
    const [botMessageRooms, messageRooms] = await Promise.all([
      getBotMessageRoomsByUserId(client, { userId }).catch((err) => {
        console.error("Error fetching bot message rooms:", err);
        return [];
      }),
      getMessageRoomsByUserId(client, { userId }).catch((err) => {
        console.error("Error fetching message rooms:", err);
        return [];
      }),
    ]);

    // 두 종류의 채팅방을 합치고 생성일 기준으로 정렬
    const allRooms = [
      ...botMessageRooms.map((room) => ({
        ...room,
        id: room.bot_message_room_id,
        name: room.bot_message_rooms?.room_name || "AI Chat Room",
        description: room.bot_message_rooms?.room_description,
        created_at: room.bot_message_rooms?.created_at || room.created_at,
        creator: room.profiles,
        room_type: "bot" as const,
      })),
      ...messageRooms.map((room) => ({
        ...room,
        id: room.message_room_id,
        name: room.profiles?.name || "Unknown User",
        description: null,
        created_at: room.created_at,
        creator: room.profiles,
        room_type: "user" as const,
      })),
    ].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // 최신순
    });

    return {
      userId,
      rooms: allRooms,
    };
  } catch (error) {
    console.error("Bot messages loader error:", error);
    return {
      userId: null,
      rooms: [],
    };
  }
};

export default function BotMessagesPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { userId, rooms } = loaderData;

  const getRoomPath = (room: any) => {
    if (room.room_type === "bot") {
      return `/chat/botmessages/${room.id}`;
    }
    return `/my/messages/${room.id}`;
  };

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
            <Plus className="h-4 w-4" />새 AI 채팅방 만들기
          </Button>
        </Form>
      </div>

      <div className="flex-1">
        {rooms && rooms.length > 0 ? (
          <div className="grid gap-4">
            {rooms.map((room: any) => (
              <Card
                key={`${room.room_type}-${room.id}`}
                className="cursor-pointer transition-colors hover:bg-gray-50"
                onClick={() => navigate(getRoomPath(room))}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    {room.room_type === "bot" && (
                      <span className="text-muted-foreground bg-muted rounded px-2 py-0.5 text-xs">
                        AI
                      </span>
                    )}
                  </div>
                  {room.description && (
                    <p className="text-muted-foreground text-sm">
                      {room.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <span>
                      {room.room_type === "bot"
                        ? `생성자: ${room.creator?.name || "Unknown"}`
                        : `상대방: ${room.creator?.name || "Unknown"}`}
                    </span>
                    <span>
                      {new Date(room.created_at).toLocaleDateString()}
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
