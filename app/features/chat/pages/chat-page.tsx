/**
 * Chat Page
 *
 * This component displays the main AI chat interface.
 * Users can see their points and start a new chat conversation.
 */
import type { Route } from "./+types/chat-page";

import { Bot, Brain, Coins, MessageSquare, Plus } from "lucide-react";
import { Link } from "react-router";
import { useOutletContext } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "AI Chat | Evidence-Base" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    return {
      userId,
    };
  } catch (error) {
    console.error("Chat loader error:", error);
    return {
      userId: null,
    };
  }
};

export default function ChatPage({ loaderData }: Route.ComponentProps) {
  const { userId } = loaderData;
  const { userPoints } = useOutletContext<{
    userId: string;
    name: string;
    avatar: string;
    userPoints: any;
  }>();

  const points =
    typeof userPoints === "object" ? userPoints.points : userPoints || 0;

  // user가 null이면 로그인 페이지로 리다이렉트
  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground">
            Please log in to access the chat.
          </p>
        </div>
      </div>
    );
  }

  // AI 챗봇 정보
  const aiBot = {
    name: "Evidence Base AI",
    avatar: "",
    description: "AI-powered research assistant",
    capabilities: [
      "Research analysis",
      "Data interpretation",
      "Evidence synthesis",
      "Literature review",
    ],
    status: "Online",
  };

  // 포인트 소모량 (1메시지당 1포인트)
  const pointsPerMessage = 1;

  return (
    <div className="h-full p-6">
      <Card className="flex h-full flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{aiBot.name}</CardTitle>
                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                  <MessageSquare className="h-3 w-3" />
                  AI Research Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 포인트 표시 */}
              <Badge variant="outline" className="flex items-center gap-1">
                <Coins className="h-3 w-3" />
                {points} 포인트
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <div className="flex h-full flex-col">
            {/* Welcome Message */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="mb-2 text-lg font-medium">
                  Welcome to Evidence Base AI
                </h3>
                <p className="text-muted-foreground max-w-md">
                  EB AI 챗봇입니다.
                  <br />
                  암 경험자의 건강관리를 돕기 위해 좋은습관 님이 만들었어요.
                  <br />
                  근거 기반 정보와 당신의 건강정보를 기반으로 답변해드릴게요.
                </p>

                {/* 포인트 정보 */}
                <div className="mt-4 rounded-lg bg-blue-50 p-4">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <Coins className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      현재 포인트: {points}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">
                    메시지 1개당 {pointsPerMessage}포인트가 소모됩니다.
                  </p>
                </div>

                {/* 채팅 시작하기 버튼 */}
                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                    asChild
                  >
                    <Link to="/chat/botmessages">
                      <Plus className="h-4 w-4" />
                      채팅 시작하기
                    </Link>
                  </Button>
                </div>

                {/* AI 기능 소개 */}
                <div className="mt-6 grid w-full max-w-sm grid-cols-1 gap-2">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        항암 중 면역력을 높이는 방법은?
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      항암 중 면역력을 높이기 위해서는 충분한 수면, 균형 잡힌
                      식단, 운동 등이 필요합니다. 추가적으로 베타글루칸을 포함한
                      버섯 제품이나 AHCC 등의 제품이 도움이 된다는 내용이
                      있습니다.
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        암 경험자가 꼭 알아야 할 혈액 지표는?
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      암 경험자가 건강관리를 위해 꼭 알고 있어야 하는 혈액
                      지표는 혈액 검사 결과를 통해 확인할 수 있습니다.
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        암 경험자가 반드시 피해야할 음식은?
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      음식을 균형적으로 섭취하는 것은 중요하지만, 연구에 따르면
                      과도한 붉은 육류섭취는 유방암 발생 리스크를 높인다는
                      내용이 있습니다.
                    </p>
                  </div>
                </div>

                {/* 포인트 부족 시 안내 */}
                {points < pointsPerMessage && (
                  <div className="mt-4 rounded-lg bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                      포인트가 부족합니다. 제품 구매, 리뷰 작성, 일일 로그인을
                      통해 포인트를 획득하세요!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
