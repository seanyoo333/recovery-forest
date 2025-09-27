import type { Route } from "./+types/profile-posts-page";

import makeServerClient from "~/core/lib/supa-client.server";
import { PostCard } from "~/features/community/components/post-card";

import { getUserPosts } from "../queries";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client, headers] = makeServerClient(request);
  const posts = await getUserPosts(client, {
    username: params.username,
  });
  return { posts };
};

export default function ProfilePostsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-5">
      {loaderData.posts.map((post: any) => (
        <PostCard
          key={post.post_id}
          id={post.post_id || 0}
          title={post.title || ""}
          author={post.author_name || post.author || ""}
          authorUsername={post.author_username || ""}
          authorAvatarUrl={post.author_avatar}
          category={post.topic || ""}
          postedAt={post.created_at || ""}
          isUpvoted={post.is_upvoted || false}
          votesCount={post.upvotes || 0}
          expanded
        />
      ))}
    </div>
  );
}
