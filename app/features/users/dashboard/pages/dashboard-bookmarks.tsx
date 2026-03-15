/**
 * Dashboard Bookmarks Page
 *
 * 사용자가 저장한 건강 북마크 목록을 보여주는 페이지
 */
import type { Route } from "./+types/dashboard-bookmarks";

import {
  BookOpen,
  Bookmark,
  ExternalLink,
  Loader2,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Form, Link, useNavigation, useRevalidator } from "react-router";

import { FEATURES } from "~/core/config/features";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";
import { deleteHealthBookmark } from "~/features/chat/mutations";
import { getHealthBookmarksByUserId } from "~/features/chat/queries";
import type { OutputPayload } from "~/features/chat/utils/evibot-api";
import { getLoggedInUserId } from "~/features/users/queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "근거자료 북마크 | Dashboard" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const bookmarks = await getHealthBookmarksByUserId(client, { userId });

  return {
    bookmarks,
    userId,
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const actionType = formData.get("action") as string;
  const bookmarkId = formData.get("bookmarkId") as string;

  if (actionType === "delete" && bookmarkId) {
    const parsedBookmarkId = Number.parseInt(bookmarkId, 10);

    try {
      await deleteHealthBookmark(client, {
        userId,
        bookmarkId: parsedBookmarkId,
      });
      return {
        success: true,
        deletedBookmarkId: parsedBookmarkId,
      };
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "북마크 삭제에 실패했습니다.",
        },
        { status: 500 },
      );
    }
  }

  return { success: false };
};

export default function DashboardBookmarksPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const revalidator = useRevalidator();
  const navigation = useNavigation();

  // actionData가 있으면 데이터 재검증
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      revalidator.revalidate();
      setDeletingId(null);
    }

    // 에러 처리
    if (actionData && "error" in actionData && actionData.error) {
      console.error("Bookmark deletion error:", actionData.error);
      setDeletingId(null);
    }
  }, [actionData, revalidator]);

  const bookmarks = loaderData.bookmarks || [];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">근거자료 북마크</h1>
          <p className="text-muted-foreground mt-2">
            저장한 건강 관련 질문과 답변을 관리하세요
          </p>
        </div>
        {/* AI 챗봇 링크 (MVP: 숨김) */}
        {FEATURES.aiChat && (
          <Link to="/chat/botmessages">
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />새 질문하기
            </Button>
          </Link>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bookmark className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground text-center">
              저장한 북마크가 없습니다.
              <br />
              {FEATURES.aiChat
                ? "챗봇에서 건강 관련 질문을 하고 북마크로 저장해보세요."
                : "AI 챗봇 기능이 준비되면 여기서 관리하실 수 있습니다."}
            </p>
            {FEATURES.aiChat && (
              <Link to="/chat/botmessages" className="mt-4">
                <Button variant="outline">챗봇으로 이동</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => {
            const content = bookmark.content as unknown as {
              question: string;
              answer: OutputPayload;
            };
            const answer = content.answer;

            const paragraphs = [
              answer.first_paragraph,
              answer.second_paragraph,
              answer.third_paragraph,
              answer.fourth_paragraph,
            ].filter(Boolean);

            return (
              <Card key={bookmark.bookmark_id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-2 text-lg">
                      {bookmark.title || content.question.substring(0, 50)}
                    </CardTitle>
                    <Form
                      method="post"
                      className="ml-2"
                      onSubmit={() => {
                        setDeletingId(bookmark.bookmark_id);
                      }}
                    >
                      <input type="hidden" name="action" value="delete" />
                      <input
                        type="hidden"
                        name="bookmarkId"
                        value={bookmark.bookmark_id}
                      />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          if (!confirm("이 북마크를 삭제하시겠습니까?")) {
                            e.preventDefault();
                            return;
                          }
                        }}
                        disabled={
                          deletingId === bookmark.bookmark_id ||
                          navigation.state === "submitting"
                        }
                      >
                        {deletingId === bookmark.bookmark_id ||
                        navigation.state === "submitting" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </Form>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {new Date(bookmark.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-4 flex-1">
                    <p className="text-muted-foreground mb-3 text-sm font-semibold">
                      질문
                    </p>
                    <p className="text-foreground mb-4 line-clamp-2 text-sm">
                      {content.question}
                    </p>

                    {paragraphs.length > 0 && (
                      <>
                        <p className="text-muted-foreground mb-2 text-sm font-semibold">
                          답변 요약
                        </p>
                        <p className="text-foreground line-clamp-3 text-sm">
                          {paragraphs[0]}
                        </p>
                      </>
                    )}

                    {answer.references && answer.references.length > 0 && (
                      <div className="mt-4">
                        <p className="text-muted-foreground mb-2 text-sm font-semibold">
                          참고 문헌 ({answer.references.length}개)
                        </p>
                        <div className="space-y-1">
                          {answer.references.slice(0, 3).map((ref, i) => (
                            <div
                              key={i}
                              className="text-muted-foreground flex items-start gap-2 text-xs"
                            >
                              <BookOpen className="mt-0.5 h-3 w-3 flex-shrink-0" />
                              <span className="line-clamp-1">{ref.title}</span>
                            </div>
                          ))}
                          {answer.references.length > 3 && (
                            <p className="text-muted-foreground text-xs">
                              +{answer.references.length - 3}개 더
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {FEATURES.aiChat && (
                    <div className="flex gap-2">
                      <Link
                        to={`/chat/botmessages/${bookmark.bot_message_room_id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full" size="sm">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          대화 보기
                        </Button>
                      </Link>
                      <Link
                        to={`/my/dashboard/bookmarks/${bookmark.bookmark_id}/question`}
                        className="flex-1"
                      >
                        <Button className="w-full" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          기반 질문하기
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
