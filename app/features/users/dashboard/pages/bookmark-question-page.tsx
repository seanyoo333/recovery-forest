/**
 * Bookmark Question Page
 *
 * 저장된 북마크를 기반으로 새로운 질문을 하는 페이지
 */
import type { Route } from "./+types/bookmark-question-page";

import { ArrowLeft, Bookmark, FileText, Loader2, SendIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, Link, useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient from "~/core/lib/supa-client.server";
import { updateBotMessageRoomConversationId } from "~/features/chat/mutations";
import {
  getHealthBookmarkById,
  getHealthBookmarksByUserId,
} from "~/features/chat/queries";
import { getBotMessageRoomConversationId } from "~/features/chat/queries";
import { createConversationId } from "~/features/chat/utils/evibot-api";
import { getLoggedInUserId } from "~/features/users/queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "북마크 기반 질문 | Dashboard" }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const bookmark = await getHealthBookmarkById(client, {
    userId,
    bookmarkId: Number.parseInt(params.bookmarkId || "0", 10),
  });

  // 사용자의 모든 북마크 가져오기 (컨텍스트로 사용)
  const allBookmarks = await getHealthBookmarksByUserId(client, { userId });

  return {
    bookmark,
    allBookmarks,
    userId,
  };
};

export default function BookmarkQuestionPage({
  loaderData,
}: Route.ComponentProps) {
  const bookmark = loaderData.bookmark;
  const allBookmarks = loaderData.allBookmarks || [];
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);

  const [question, setQuestion] = useState("");

  if (!bookmark) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              북마크를 찾을 수 없습니다.
            </p>
            <Link to="/my/dashboard/bookmarks" className="mt-4">
              <Button variant="outline">북마크 목록으로</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const content = bookmark.content as {
    question: string;
    answer: {
      first_paragraph?: string;
      second_paragraph?: string;
      third_paragraph?: string;
      fourth_paragraph?: string;
      references?: Array<{
        source_type: string;
        title: string;
        url: string;
        pmid?: string;
        year?: number;
        authors?: string;
      }>;
    };
  };

  // 북마크 기반 컨텍스트 생성
  const bookmarkContext = allBookmarks
    .map((b) => {
      const c = b.content as {
        question: string;
        answer: {
          first_paragraph?: string;
          second_paragraph?: string;
          third_paragraph?: string;
          fourth_paragraph?: string;
        };
      };
      return `질문: ${c.question}\n답변: ${[
        c.answer.first_paragraph,
        c.answer.second_paragraph,
        c.answer.third_paragraph,
        c.answer.fourth_paragraph,
      ]
        .filter(Boolean)
        .join("\n\n")}`;
    })
    .join("\n\n---\n\n");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;

    // 북마크 컨텍스트를 포함한 질문 생성
    const enhancedQuestion = `다음은 내가 이전에 저장한 건강 관련 질문과 답변들입니다:\n\n${bookmarkContext}\n\n---\n\n위 내용들을 참고하여 다음 질문에 답변해주세요:\n\n${question}`;

    // 새 채팅방 생성 또는 기존 방 사용
    // 여기서는 간단하게 새 채팅방을 생성하는 것으로 처리
    // 실제로는 북마크 기반 질문용 특별한 채팅방을 만들 수도 있습니다
    window.location.href = `/chat/botmessages?question=${encodeURIComponent(enhancedQuestion)}`;
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link to="/my/dashboard/bookmarks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">북마크 기반 질문하기</h1>
          <p className="text-muted-foreground mt-2">
            저장한 북마크 내용을 참고하여 새로운 질문을 하세요
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 북마크 정보 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              <CardTitle className="text-lg">참고 북마크</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-semibold">
                원본 질문
              </p>
              <p className="text-foreground text-sm">{content.question}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-semibold">
                답변 요약
              </p>
              <p className="text-foreground line-clamp-4 text-sm">
                {content.answer.first_paragraph || "내용 없음"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-semibold">
                저장된 북마크 수
              </p>
              <p className="text-foreground text-sm">{allBookmarks.length}개</p>
            </div>
          </CardContent>
        </Card>

        {/* 질문 입력 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>새 질문하기</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">
              저장한 북마크 내용을 참고하여 AI에게 질문하세요. AI가 이전 대화
              내용을 고려하여 더 정확한 답변을 제공합니다.
            </p>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="예: 위 내용들을 바탕으로 내 상황에 맞는 구체적인 조언을 해주세요..."
                rows={6}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Link to="/my/dashboard/bookmarks">
                  <Button type="button" variant="outline">
                    취소
                  </Button>
                </Link>
                <Button type="submit" disabled={!question.trim()}>
                  {fetcher.state === "submitting" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <SendIcon className="mr-2 h-4 w-4" />
                      질문하기
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
