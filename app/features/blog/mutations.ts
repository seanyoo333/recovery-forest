import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

/**
 * Toggle upvote for a blog post
 *
 * This function adds or removes an upvote for a blog post.
 * If the user has already upvoted, it removes the upvote.
 * If not, it adds an upvote.
 *
 * @param client - Supabase client instance
 * @param postId - The post ID to upvote
 * @param userId - The user ID who is upvoting
 */
export async function toggleBlogPostUpvote(
  client: SupabaseClient<Database>,
  { postId, userId }: { postId: number; userId: string },
) {
  const { count } = await (client as any)
    .from("blog_post_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("profile_id", userId);

  if (count === 0) {
    await (client as any).from("blog_post_upvotes").insert({
      post_id: postId,
      profile_id: userId,
    });
  } else {
    await (client as any)
      .from("blog_post_upvotes")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", userId);
  }
}

