/**
 * Bot Messages Page
 *
 * This component displays a list of bot chat rooms for the authenticated user.
 * Users can create new chat rooms and navigate to existing ones.
 */
import type { Route } from "./+types/bot-messages-page";

import { MessageCircleIcon, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/core/components/ui/dialog";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import {
  getBotMessageRoomCountByUserId,
  getBotMessageRoomsByUserId,
} from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Bot Messages | Evidence-Base" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    // AI 채팅방만 조회
    const botMessageRooms = await getBotMessageRoomsByUserId(client, {
      userId,
    }).catch((err) => {
      console.error("Error fetching bot message rooms:", err);
      return [];
    });

    // 채팅방 개수 확인
    const roomCount = await getBotMessageRoomCountByUserId(client, {
      userId,
    }).catch(() => 0);

    // AI 채팅방 목록을 생성일 기준으로 정렬
    const rooms = botMessageRooms
      .map((room) => ({
        id: room.bot_message_room_id,
        name: room.bot_message_rooms?.room_name || "AI Chat Room",
        description: room.bot_message_rooms?.room_description,
        created_at: room.bot_message_rooms?.created_at || room.created_at,
        creator: room.profiles,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // 최신순
      });

    return {
      userId,
      rooms,
      roomCount,
    };
  } catch (error) {
    console.error("Bot messages loader error:", error);
    return {
      userId: null,
      rooms: [],
      roomCount: 0,
    };
  }
};

export default function BotMessagesPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { userId, rooms, roomCount } = loaderData;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const MAX_ROOMS = 5;
  const canCreateRoom = roomCount < MAX_ROOMS;

  // 서버 응답 처리
  useEffect(() => {
    if (fetcher.data) {
      const data = fetcher.data as
        | { error?: string }
        | { success?: boolean; bot_message_room_id?: number };
      if ("error" in data && data.error) {
        toast.error(data.error);
        setIsDialogOpen(false);
      } else if (
        "success" in data &&
        data.success &&
        data.bot_message_room_id
      ) {
        navigate(`/chat/botmessages/${data.bot_message_room_id}`);
        setIsDialogOpen(false);
      }
    }
  }, [fetcher.data, navigate]);

  // 채팅방 생성 제한 체크 핸들러
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!canCreateRoom) {
      e.preventDefault();
      toast.error(`AI 채팅방은 최대 ${MAX_ROOMS}개까지 생성할 수 있습니다.`);
      setIsDialogOpen(false);
      return;
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">채팅방 목록</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="flex items-center gap-2"
              disabled={!canCreateRoom}
              title={
                !canCreateRoom
                  ? `AI 채팅방은 최대 ${MAX_ROOMS}개까지 생성할 수 있습니다.`
                  : undefined
              }
            >
              <Plus className="h-4 w-4" />새 AI 채팅방 만들기
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 AI 채팅방 만들기</DialogTitle>
              <DialogDescription>
                채팅방 이름과 설명을 입력하여 목적에 맞게 관리하세요.
                {!canCreateRoom && (
                  <span className="mt-2 block text-sm font-medium text-red-500">
                    AI 채팅방은 최대 {MAX_ROOMS}개까지 생성할 수 있습니다. (
                    {roomCount}/{MAX_ROOMS})
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <fetcher.Form
              method="post"
              action="/chat/api/create-room"
              encType="multipart/form-data"
              onSubmit={handleFormSubmit}
            >
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">채팅방 이름</Label>
                  <Input
                    id="roomName"
                    name="roomName"
                    placeholder="예: 혈액검사 결과 분석"
                    required
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomDescription">설명 (선택사항)</Label>
                  <Textarea
                    id="roomDescription"
                    name="roomDescription"
                    placeholder="이 채팅방의 목적이나 주제를 간단히 설명해주세요."
                    rows={3}
                    maxLength={200}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={!canCreateRoom || fetcher.state === "submitting"}
                >
                  {fetcher.state === "submitting" ? "생성 중..." : "생성하기"}
                </Button>
              </DialogFooter>
            </fetcher.Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1">
        {rooms && rooms.length > 0 ? (
          <div className="grid gap-4">
            {rooms.map((room: any) => (
              <Card
                key={room.id}
                className="hover:bg-card/50 cursor-pointer bg-transparent transition-colors"
                onClick={() => navigate(`/chat/botmessages/${room.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <span className="text-muted-foreground bg-muted rounded px-2 py-0.5 text-xs">
                      AI
                    </span>
                  </div>
                  {room.description && (
                    <p className="text-muted-foreground text-sm">
                      {room.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <span>생성자: {room.creator?.name || "Unknown"}</span>
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />첫 번째 채팅방 만들기
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 AI 채팅방 만들기</DialogTitle>
                  <DialogDescription>
                    채팅방 이름과 설명을 입력하여 목적에 맞게 관리하세요.
                  </DialogDescription>
                </DialogHeader>
                <fetcher.Form
                  method="post"
                  action="/chat/api/create-room"
                  encType="multipart/form-data"
                  onSubmit={handleFormSubmit}
                >
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="roomName-empty">채팅방 이름</Label>
                      <Input
                        id="roomName-empty"
                        name="roomName"
                        placeholder="예: 영양관리 상담"
                        required
                        maxLength={50}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomDescription-empty">
                        설명 (선택사항)
                      </Label>
                      <Textarea
                        id="roomDescription-empty"
                        name="roomDescription"
                        placeholder="이 채팅방의 목적이나 주제를 간단히 설명해주세요."
                        rows={3}
                        maxLength={200}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      취소
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        !canCreateRoom || fetcher.state === "submitting"
                      }
                    >
                      {fetcher.state === "submitting"
                        ? "생성 중..."
                        : "생성하기"}
                    </Button>
                  </DialogFooter>
                </fetcher.Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
