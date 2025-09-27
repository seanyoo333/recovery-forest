import type { Route } from "./+types/community-page";

import { ChevronDownIcon } from "lucide-react";
import { Form, Link, data, useSearchParams } from "react-router";
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
import makeServerClient from "~/core/lib/supa-client.server";

import { PostCard } from "../components/post-card";
import { PERIOD_OPTIONS, SORT_OPTIONS } from "../constants";
import { getPosts, getTopics } from "../queries";

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
  const [topics, posts] = await Promise.all([
    getTopics(client),
    getPosts(client, {
      limit: 20,
      sorting: parsedData.sorting,
      period: parsedData.period,
      keyword: parsedData.keyword,
      topic: parsedData.topic,
    }),
  ]);
  return { topics, posts };
};

export default function CommunityPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sorting = searchParams.get("sorting") || "newest";
  const period = searchParams.get("period") || "all";
  const keyword = searchParams.get("keyword") || "";
  return (
    <div className="space-y-20">
      <Hero
        title="커뮤니티"
        subtitle="질문하고 정보를 공유하세요. 다른 사람을 도우는 길이 자신을 도우는 길입니다."
      />
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
              <Form className="w-full md:w-2/3">
                <Input
                  type="text"
                  name="keyword"
                  placeholder="Search for discussions"
                  defaultValue={keyword}
                />
              </Form>
            </div>
            <Button asChild>
              <Link to={`/community/submit`}>Create Discussion</Link>
            </Button>
          </div>
          <div className="space-y-5">
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
          </div>
        </div>
        <aside className="space-y-5 md:col-span-2">
          <span className="text-muted-foreground text-sm font-bold uppercase">
            Topics
          </span>
          <div className="flex flex-col items-start gap-2">
            {loaderData.topics.map((topic) => (
              <Button
                asChild
                variant={"link"}
                key={topic.slug}
                className="pl-0"
              >
                <Link to={`/community?topic=${topic.slug}`}>{topic.name}</Link>
              </Button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
