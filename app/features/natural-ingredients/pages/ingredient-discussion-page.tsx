import type { Route } from "./+types/ingredient-discussion-page";

import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import { PostCard } from "~/features/community/components/post-card";
import { getPosts } from "~/features/community/queries";

import { getIngredientBySlug } from "../queries";

export const loader = async ({
  request,
  params,
}: Route.LoaderArgs & { params: { slug: string } }) => {
  const [client] = makeServerClient(request);
  const ingredient = await getIngredientBySlug(client, { slug: params.slug });
  if (!ingredient) throw new Response("Not Found", { status: 404 });

  const posts = await getPosts(client, {
    limit: 10,
    sorting: "newest",
    keyword: ingredient.display_name,
  });

  return {
    ingredientName: ingredient.display_name,
    posts,
  };
};

export default function IngredientDiscussionPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div className="mx-auto max-w-screen-lg space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">관련 토론</h2>
          <p className="text-muted-foreground text-sm">
            "{loaderData.ingredientName}" 키워드로 검색된 커뮤니티 최신 글입니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link
              to={`/community?keyword=${encodeURIComponent(loaderData.ingredientName)}`}
            >
              커뮤니티에서 더 보기
            </Link>
          </Button>
          <Button asChild>
            <Link to="/community/submit">글쓰기</Link>
          </Button>
        </div>
      </div>

      {loaderData.posts.length === 0 ? (
        <div className="rounded-xl border p-6">
          <p className="text-muted-foreground">
            아직 관련 토론이 없습니다. 커뮤니티에서 첫 경험과 질문을 공유해 보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
        </div>
      )}
    </div>
  );
}
