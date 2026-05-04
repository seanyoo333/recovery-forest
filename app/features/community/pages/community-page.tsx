import type { Route } from "./+types/community-page";

import { ChevronDownIcon } from "lucide-react";
import { Form, Link, data, redirect, useSearchParams } from "react-router";
import { z } from "zod";

import { Hero } from "~/core/components/hero";
import { Button } from "~/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { Input } from "~/core/components/ui/input";
import { cn } from "~/core/lib/utils";
import makeServerClient from "~/core/lib/supa-client.server";

import { CommunityPagination } from "../components/community-pagination";
import { PostCard } from "../components/post-card";
import {
  COMMUNITY_POSTS_PAGE_SIZE,
  PERIOD_OPTIONS,
  SORT_OPTIONS,
} from "../constants";
import { getPostsPage, getTopics, isAdminUser } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Community | Evidence Base" }];
};

const searchParamsSchema = z.object({
  sorting: z.enum(["newest", "popular"]).optional().default("newest"),
  period: z
    .enum(["all", "today", "week", "month", "year"])
    .optional()
    .default("all"),
  keyword: z.string().optional(),
  topic: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const { success, data: parsedData } = searchParamsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );

  if (!success) {
    throw data(
      {
        error_code: "Invalid search params",
        message: "Invalid search params",
      },
      {
        status: 400,
      },
    );
  }

  const [client, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const isAdmin = await isAdminUser(client, user?.id);

  const requestedPage = parsedData.page ?? 1;

  const [topics, pageResult] = await Promise.all([
    getTopics(client),
    getPostsPage(client, {
      page: requestedPage,
      pageSize: COMMUNITY_POSTS_PAGE_SIZE,
      sorting: parsedData.sorting,
      period: parsedData.period,
      keyword: parsedData.keyword,
      topic: parsedData.topic,
    }),
  ]);

  const { posts, totalCount } = pageResult;
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / COMMUNITY_POSTS_PAGE_SIZE),
  );

  if (requestedPage > totalPages) {
    const u = new URL(request.url);
    if (totalPages <= 1) {
      u.searchParams.delete("page");
    } else {
      u.searchParams.set("page", String(totalPages));
    }
    throw redirect(u.pathname + u.search);
  }

  const filteredTopics = isAdmin
    ? topics
    : topics.filter((topic) => !topic.is_admin_only);

  return {
    topics: filteredTopics,
    posts,
    totalPages,
    currentPage: Math.min(requestedPage, totalPages),
  };
};

export default function CommunityPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sorting = searchParams.get("sorting") || "newest";
  const period = searchParams.get("period") || "all";
  const keyword = searchParams.get("keyword") || "";
  const activeTopicSlug = searchParams.get("topic");

  const chipClass = (active: boolean) =>
    cn(
      "border-muted-foreground/25 text-muted-foreground hover:bg-muted/80 active:bg-muted/60",
      "flex min-h-9 w-full items-center justify-center rounded-lg border px-2 py-1.5 text-center text-xs font-normal leading-tight transition-colors",
      active && "border-primary bg-primary/10 text-primary font-medium",
    );

  const buildTopicHref = (slug: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (slug) {
      next.set("topic", slug);
    } else {
      next.delete("topic");
    }
    next.delete("page");
    const qs = next.toString();
    return qs ? `/community?${qs}` : "/community";
  };

  return (
    <div className="space-y-10 md:space-y-20">
      <Hero
        title="커뮤니티"
        subtitle="질문하고 정보를 공유하세요. 다른 사람을 돕는 길이 자신을 돕는 길입니다."
      />
      <section
        aria-label="토픽 선택"
        className="md:hidden space-y-3 px-1"
      >
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
          Topics
        </p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-3 sm:gap-x-2.5 sm:gap-y-2">
          <Link to={buildTopicHref(null)} className={chipClass(!activeTopicSlug)}>
            전체
          </Link>
          {loaderData.topics.map((topic) => {
            const isActive = activeTopicSlug === topic.slug;
            return (
              <Link
                key={topic.slug}
                to={buildTopicHref(topic.slug)}
                className={chipClass(isActive)}
              >
                {topic.name}
              </Link>
            );
          })}
        </div>
      </section>
      <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-6 md:gap-40">
        <div className="space-y-10 md:col-span-4">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:gap-0">
            <div className="w-full space-y-5">
              <div className="flex items-center gap-5">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1">
                    <span className="text-sm capitalize">{sorting}</span>
                    <ChevronDownIcon className="size-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {SORT_OPTIONS.map((option) => (
                      <DropdownMenuCheckboxItem
                        className="cursor-pointer capitalize"
                        key={option}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            searchParams.set("sorting", option);
                            searchParams.delete("page");
                            setSearchParams(searchParams);
                          }
                        }}
                      >
                        {option}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {sorting === "popular" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                      <span className="text-sm capitalize">{period}</span>
                      <ChevronDownIcon className="size-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {PERIOD_OPTIONS.map((option) => (
                        <DropdownMenuCheckboxItem
                          className="cursor-pointer capitalize"
                          key={option}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              searchParams.set("period", option);
                              searchParams.delete("page");
                              setSearchParams(searchParams);
                            }
                          }}
                        >
                          {option}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <Form
                method="get"
                action="/community"
                className="w-full md:w-2/3"
              >
                {sorting !== "newest" ? (
                  <input type="hidden" name="sorting" value={sorting} />
                ) : null}
                {sorting === "popular" && period !== "all" ? (
                  <input type="hidden" name="period" value={period} />
                ) : null}
                {activeTopicSlug ? (
                  <input type="hidden" name="topic" value={activeTopicSlug} />
                ) : null}
                <Input
                  type="text"
                  name="keyword"
                  placeholder="Search for discussions"
                  defaultValue={keyword}
                />
              </Form>
            </div>
            <Button asChild className="font-bold">
              <Link to={`/community/submit`}>글쓰기</Link>
            </Button>
          </div>
          <div className="space-y-6 md:space-y-5">
            {loaderData.posts.map((post) => (
              <PostCard
                key={post.post_id}
                id={post.post_id}
                title={post.title}
                author={post.author_name}
                authorUsername={post.author_username}
                authorAvatarUrl={post.author_avatar}
                category={post.topic}
                postedAt={post.created_at}
                isMarkdown={post.is_markdown}
                votesCount={post.upvotes}
                isUpvoted={post.is_upvoted}
                expanded
              />
            ))}
            {loaderData.posts.length === 0 && (
              <div className="col-span-full">
                <p className="text-muted-foreground text-lg font-semibold">
                  No posts found, modify or{" "}
                  <Button variant={"link"} asChild className="p-0 text-lg">
                    <Link to="/community">reset</Link>
                  </Button>{" "}
                  search.
                </p>
              </div>
            )}
            <CommunityPagination totalPages={loaderData.totalPages} />
          </div>
        </div>
        <aside
          className={cn(
            "hidden md:col-span-2 md:block",
            "md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:self-start md:pr-1",
          )}
        >
          <span className="text-muted-foreground text-sm font-bold uppercase">
            Topics
          </span>
          <nav className="mt-3 flex flex-col items-start gap-1">
            <Button
              asChild
              variant="link"
              className={cn(
                "h-auto justify-start p-0 font-normal",
                !activeTopicSlug && "text-primary font-semibold",
              )}
            >
              <Link to={buildTopicHref(null)}>전체</Link>
            </Button>
            {loaderData.topics.map((topic) => (
              <Button
                asChild
                variant="link"
                key={topic.slug}
                className={cn(
                  "h-auto justify-start p-0 font-normal",
                  activeTopicSlug === topic.slug && "text-primary font-semibold",
                )}
              >
                <Link to={buildTopicHref(topic.slug)}>{topic.name}</Link>
              </Button>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
