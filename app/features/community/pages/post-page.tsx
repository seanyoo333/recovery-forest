import type { Route } from "./+types/post-page";

import {
  ChevronUpIcon,
  DotIcon,
  EditIcon,
  MessageSquareIcon,
  TrashIcon,
} from "lucide-react";
import { DateTime } from "luxon";
import { bundleMDX } from "mdx-bundler";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Form,
  Link,
  data,
  redirect,
  useFetcher,
  useOutletContext,
} from "react-router";
import { z } from "zod";

import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyList,
  TypographyOrderedList,
  TypographyP,
} from "~/core/components/mdx-typography1";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/core/components/ui/breadcrumb";
import { Button } from "~/core/components/ui/button";
import { buttonVariants } from "~/core/components/ui/button";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";
import { Reply } from "~/features/community/components/reply";
import { FollowButton } from "~/features/users/components/follow-button";
import { getLoggedInUserId } from "~/features/users/queries";

import { createReply, deletePost, deleteReply } from "../mutations";
import { getPostById, getPostCountByProfileId, getReplies } from "../queries";

export const meta: Route.MetaFunction = ({ data }) => {
  // loader에서 계산한 baseUrl 사용 (서버 사이드에서만 실행됨)
  const baseUrl = data.baseUrl || "http://localhost:5173";

  // MD 파일인 경우 OG 이미지 추가
  if (data.post.is_markdown && data.mdContent) {
    // 파일명에서 slug 추출 (예: 1.md -> 1)
    const slug = data.mdContent.match(/^---\s*\n(?:.*\n)*?---\s*\n/)?.[0]
      ? data.post.title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      : null;

    if (slug) {
      return [
        {
          title: `${data.post.title} on ${data.post.topic_name} | Evidence Base`,
        },
        {
          name: "og:image",
          content: `${baseUrl}/api/blog/og?slug=${slug}`,
        },
        {
          name: "og:image:width",
          content: "1200",
        },
        {
          name: "og:image:height",
          content: "630",
        },
        {
          name: "og:type",
          content: "article",
        },
      ];
    }
  }

  return [
    {
      title: `${data.post.title} on ${data.post.topic_name} | Evidence Base`,
    },
  ];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const post = await getPostById(client, {
    postId: params.postId,
  });
  const replies = await getReplies(client, { postId: params.postId });
  const postCount = await getPostCountByProfileId(client, {
    profileId: post.author_profile_id,
  });

  // MD 파일인 경우 실제 파일 내용을 읽어옴
  let mdContent = "";
  if (post.is_markdown) {
    const docsPath = path.join(
      process.cwd(),
      "app",
      "features",
      "community",
      "docs",
    );
    const files = await import("node:fs/promises").then((fs) =>
      fs.readdir(docsPath),
    );

    // frontmatter의 제목으로 파일 찾기
    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      try {
        const filePath = path.join(docsPath, file);
        const { frontmatter } = await bundleMDX({ file: filePath });

        if (frontmatter.title === post.title) {
          mdContent = await readFile(filePath, "utf-8");
          break;
        }
      } catch (error) {
        // 파일 읽기 실패 시 무시하고 계속 진행
      }
    }
  }

  // Calculate base URL from request (for OG image generation)
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  return { post, replies, mdContent, postCount, baseUrl };
};

const formSchema = z.object({
  reply: z.string().min(1),
  topLevelId: z.coerce.number().optional(),
});

const deleteSchema = z.object({
  replyId: z.coerce.number(),
});

const deletePostSchema = z.object({
  postId: z.string(),
});

export const action = async ({ request, params }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();

  // 삭제 요청인지 확인
  const intent = formData.get("intent");

  if (intent === "delete-reply") {
    const { success, error, data } = deleteSchema.safeParse(
      Object.fromEntries(formData),
    );
    if (!success) {
      return {
        formErrors: error?.flatten().fieldErrors,
      };
    }
    const { replyId } = data;
    await deleteReply(client, { replyId, userId });
    return {
      ok: true,
    };
  }

  if (intent === "delete-post") {
    const { success, error, data } = deletePostSchema.safeParse(
      Object.fromEntries(formData),
    );
    if (!success) {
      return {
        formErrors: error?.flatten().fieldErrors,
      };
    }
    await deletePost(client, { postId: data.postId, userId });
    return redirect("/community");
  }

  // 기존 댓글 작성 로직
  const { success, error, data } = formSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!success) {
    return {
      formErrors: error?.flatten().fieldErrors,
    };
  }
  const { reply, topLevelId } = data;
  await createReply(client, {
    postId: params.postId,
    reply,
    userId,
    topLevelId,
  });
  return {
    ok: true,
  };
};

export default function PostPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const fetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const { isLoggedIn, name, username, avatar } = useOutletContext<{
    isLoggedIn: boolean;
    name?: string;
    username?: string;
    avatar?: string;
  }>();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (actionData?.ok) {
      formRef.current?.reset();
    }
  }, [actionData?.ok]);

  // 마크다운 렌더링을 위한 컴포넌트 매핑
  const markdownComponents = {
    h1: ({ children, ...props }: any) => (
      <TypographyH1 children={children} props={props} />
    ),
    h2: ({ children, ...props }: any) => (
      <TypographyH2 children={children} props={props} />
    ),
    h3: ({ children, ...props }: any) => (
      <TypographyH3 children={children} props={props} />
    ),
    h4: ({ children, ...props }: any) => (
      <TypographyH4 children={children} props={props} />
    ),
    p: ({ children, ...props }: any) => (
      <TypographyP children={children} props={props} />
    ),
    blockquote: ({ children, ...props }: any) => (
      <TypographyBlockquote children={children} props={props} />
    ),
    ul: ({ children, ...props }: any) => (
      <TypographyList children={children} props={props} />
    ),
    ol: ({ children, ...props }: any) => (
      <TypographyOrderedList children={children} props={props} />
    ),
    code: ({ children, ...props }: any) => (
      <TypographyInlineCode children={children} props={props} />
    ),
  };

  // MD 파일인지 확인
  const isMDFile = Boolean(loaderData.post.is_markdown);
  const isAuthor = isLoggedIn && loaderData.post.author_username === username;

  // Optimistic 업데이트를 위한 계산
  const optimisticVotesCount =
    fetcher.state === "idle"
      ? loaderData.post.upvotes
      : loaderData.post.is_upvoted
        ? loaderData.post.upvotes - 1
        : loaderData.post.upvotes + 1;
  const optimisticIsUpvoted =
    fetcher.state === "idle"
      ? loaderData.post.is_upvoted
      : !loaderData.post.is_upvoted;

  return (
    <div className="grid grid-cols-1 space-y-10 md:block md:gap-0">
      <Breadcrumb className="w-full">
        <BreadcrumbList className="w-full">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/community">Community</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/community?topic=${loaderData.post.topic_slug}`}>
                {loaderData.post.topic_name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/community/${loaderData.post.post_id}`}>
                {loaderData.post.title}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-6 md:gap-40">
        <div className="space-y-10 md:col-span-4">
          <div className="flex w-full flex-col items-start gap-10 md:flex-row">
            <fetcher.Form
              method="post"
              className="w-full md:w-fit"
              action={`/community/${loaderData.post.post_id}/upvote`}
            >
              <Button
                variant="outline"
                className={cn(
                  "flex h-14 w-full flex-col md:w-fit",
                  optimisticIsUpvoted ? "border-primary text-primary" : "",
                )}
              >
                <ChevronUpIcon className="size-4 shrink-0" />
                <span>{optimisticVotesCount}</span>
              </Button>
            </fetcher.Form>
            <div className="w-full space-y-10 md:space-y-20">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-bold">
                    {loaderData.post.title}
                  </h2>
                  {isMDFile && <Badge variant="secondary">MD 파일</Badge>}
                </div>
                <div className="text-muted-foreground flex items-center gap-2.5 text-sm">
                  <Link
                    to={`/users/${loaderData.post.author_username}`}
                    className="hover:underline"
                  >
                    {loaderData.post.author_name}
                  </Link>
                  <DotIcon className="size-5" />
                  <span>
                    {" "}
                    {DateTime.fromISO(loaderData.post.created_at).toRelative()}
                  </span>
                  <DotIcon className="size-5" />
                  <span> {loaderData.post.replies} 댓글</span>
                </div>
                {isAuthor && (
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/community/${loaderData.post.post_id}/edit`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-2",
                      )}
                    >
                      <EditIcon className="size-4" />
                      수정
                    </Link>
                    <deleteFetcher.Form method="post" className="inline">
                      <input type="hidden" name="intent" value="delete-post" />
                      <input
                        type="hidden"
                        name="postId"
                        value={loaderData.post.post_id}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive gap-2"
                        onClick={(e) => {
                          if (!confirm("정말 이 글을 삭제하시겠습니까?")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <TrashIcon className="size-4" />
                        삭제
                      </Button>
                    </deleteFetcher.Form>
                  </div>
                )}

                {/* 마크다운 렌더링 또는 일반 텍스트 렌더링 */}
                <div className="text-muted-foreground w-full md:w-3/4">
                  {isMDFile ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown components={markdownComponents}>
                        {loaderData.mdContent || loaderData.post.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {loaderData.post.content}
                    </p>
                  )}
                </div>

                {/* 출처 링크 */}
                {loaderData.post.reference && (
                  <div className="w-full md:w-3/4">
                    <Link
                      to={loaderData.post.reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground text-sm underline"
                    >
                      출처: {loaderData.post.reference}
                    </Link>
                  </div>
                )}
              </div>

              {/* 댓글 기능 */}
              <Form
                ref={formRef}
                className="flex w-full items-start gap-5 md:w-3/4"
                method="post"
              >
                <Avatar className="size-14">
                  <AvatarFallback>{name?.[0]}</AvatarFallback>
                  <AvatarImage src={avatar} />
                </Avatar>
                <div className="flex w-full flex-col items-end gap-5">
                  <Textarea
                    name="reply"
                    placeholder="Write a reply"
                    className="w-full resize-none"
                    rows={5}
                  />
                  {isLoggedIn ? (
                    <Button className="font-bold"> 댓글 달기 </Button>
                  ) : (
                    <span
                      className={cn(
                        buttonVariants({ variant: "secondary" }),
                        "cursor-not-allowed",
                      )}
                    >
                      로그인하고 댓글 달기
                    </span>
                  )}
                </div>
              </Form>

              <div className="space-y-10">
                <h4 className="font-semibold">
                  {loaderData.post.replies} 개의 댓글
                </h4>
                <div className="flex flex-col gap-5">
                  {loaderData.replies.map((reply) => (
                    <Reply
                      key={reply.post_reply_id}
                      name={reply.user.name}
                      username={reply.user.username}
                      avatarUrl={reply.user.avatar}
                      content={reply.reply}
                      timestamp={reply.created_at}
                      topLevel={true}
                      topLevelId={reply.post_reply_id}
                      replyId={reply.post_reply_id}
                      replies={reply.post_replies}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5 rounded-lg border p-6 shadow-sm md:col-span-2">
          <div className="flex gap-5">
            <Link to={`/users/${loaderData.post.author_username}`}>
              <Avatar className="size-14">
                <AvatarFallback>
                  {loaderData.post.author_name[0]}
                </AvatarFallback>
                {loaderData.post.author_avatar ? (
                  <AvatarImage src={loaderData.post.author_avatar} />
                ) : null}
              </Avatar>
            </Link>
            <div className="flex flex-col items-start">
              <Link
                to={`/users/${loaderData.post.author_username}`}
                className="hover:underline"
              >
                <h4 className="text-lg font-medium">
                  {loaderData.post.author_name}
                </h4>
              </Link>
              <Badge variant="secondary" className="capitalize">
                {loaderData.post.author_role}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span>
              🎂{" "}
              {DateTime.fromISO(loaderData.post.author_created_at, {
                zone: "Asia/Seoul",
              }).toRelative()}{" "}
              가입
            </span>
            <span> 🚀 {loaderData.postCount}개의 글을 작성했습니다</span>
          </div>
          {loaderData.post.author_username !== username ? (
            <FollowButton
              username={loaderData.post.author_username}
              isFollowing={loaderData.post.author_is_following}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
