import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

export interface BlogPostMeta {
  post_id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  date: string;
  image_url: string | null;
  image_alt: string | null;
  upvotes: number;
  created_at: string;
  updated_at: string;
  is_upvoted?: boolean;
}

const BLOG_POST_META_SELECT =
  "post_id, slug, title, description, category, author, date, image_url, image_alt, created_at, updated_at";

/**
 * Get all published blog posts metadata
 *
 * This function queries the blog_posts_meta table to get metadata for all published posts.
 * It includes upvote information if userId is provided.
 *
 * @param client - Supabase client instance
 * @param userId - Optional user ID to check if posts are upvoted
 * @param sorting - Sort by "newest" or "popular" (default: "newest")
 * @returns Array of blog post metadata
 */
export async function getBlogPostsMeta(
  client: SupabaseClient<Database>,
  userId?: string,
  sorting: "newest" | "popular" = "newest",
): Promise<BlogPostMeta[]> {
  let query = client
    .from("blog_posts_meta")
    .select(BLOG_POST_META_SELECT)
    .eq("is_published", true);

  // Apply sorting
  if (sorting === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sorting === "popular") {
    // For popular sorting, we'll need to sort by upvotes
    // Since upvotes might not be in the select, we'll handle it after fetching
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`블로그 포스트 조회 실패: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Get upvotes count and status for each post
  const postIds = data.map((post) => post.post_id);

  // Get upvote counts
  const { data: upvoteCounts } = await (client as any)
    .from("blog_post_upvotes")
    .select("post_id")
    .in("post_id", postIds);

  // Count upvotes per post
  const upvoteCountMap = new Map<number, number>();
  upvoteCounts?.forEach((uv: any) => {
    upvoteCountMap.set(uv.post_id, (upvoteCountMap.get(uv.post_id) || 0) + 1);
  });

  // Get upvote status for each post if userId is provided
  let upvotedPostIds = new Set<number>();
  if (userId) {
    const { data: userUpvotes } = await (client as any)
      .from("blog_post_upvotes")
      .select("post_id")
      .in("post_id", postIds)
      .eq("profile_id", userId);

    upvotedPostIds = new Set(userUpvotes?.map((u: any) => u.post_id) || []);
  }

  // Map data with upvotes and sorting
  let result = data.map((post: any) => ({
    ...post,
    upvotes: upvoteCountMap.get(post.post_id) || 0,
    is_upvoted: upvotedPostIds.has(post.post_id),
  })) as BlogPostMeta[];

  // Apply popular sorting if needed
  if (sorting === "popular") {
    result.sort((a, b) => {
      if (b.upvotes !== a.upvotes) {
        return b.upvotes - a.upvotes;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }

  return result;
}

/**
 * Get blog post metadata by slug
 *
 * This function queries the blog_posts_meta table to get metadata for a specific post.
 * It includes upvote information if userId is provided.
 *
 * @param client - Supabase client instance
 * @param slug - The slug of the blog post
 * @param userId - Optional user ID to check if post is upvoted
 * @returns Blog post metadata or null if not found
 */
export async function getBlogPostMetaBySlug(
  client: SupabaseClient<Database>,
  slug: string,
  userId?: string,
): Promise<BlogPostMeta | null> {
  const { data, error } = await client
    .from("blog_posts_meta")
    .select(BLOG_POST_META_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(`블로그 포스트 조회 실패: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Get upvote count
  const { count: upvoteCount } = await (client as any)
    .from("blog_post_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", (data as any).post_id);

  // Check if user has upvoted this post
  let is_upvoted = false;
  if (userId) {
    const { count } = await (client as any)
      .from("blog_post_upvotes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", (data as any).post_id)
      .eq("profile_id", userId);
    is_upvoted = (count || 0) > 0;
  }

  return {
    ...data,
    upvotes: upvoteCount || 0,
    is_upvoted,
  } as BlogPostMeta;
}

/**
 * Create or update blog post metadata
 *
 * This function creates a new entry or updates an existing entry in the blog_posts_meta table.
 * It uses upsert to handle both cases, preventing duplicate key errors.
 * It should be called when uploading a new MDX file to Supabase Storage.
 *
 * @param client - Supabase client instance
 * @param meta - Blog post metadata
 * @returns Created or updated blog post metadata
 */
export async function createBlogPostMeta(
  client: SupabaseClient<Database>,
  meta: {
    slug: string;
    title: string;
    description: string;
    category: string;
    author: string;
    date: string;
    image_url?: string | null;
    image_alt?: string | null;
    profile_id: string;
    is_published?: boolean;
  },
): Promise<BlogPostMeta> {
  const { data, error } = await client
    .from("blog_posts_meta")
    .upsert(
      {
        slug: meta.slug,
        title: meta.title,
        description: meta.description,
        category: meta.category,
        author: meta.author,
        date: meta.date,
        image_url: meta.image_url ?? null,
        image_alt: meta.image_alt ?? null,
        profile_id: meta.profile_id,
        is_published: meta.is_published ?? true,
      },
      {
        onConflict: "slug",
      },
    )
    .select(BLOG_POST_META_SELECT)
    .single();

  if (error) {
    throw new Error(
      `블로그 포스트 메타데이터 생성/업데이트 실패: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error("블로그 포스트 메타데이터를 가져올 수 없습니다.");
  }

  // Get upvote count
  const { count: upvoteCount } = await (client as any)
    .from("blog_post_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", (data as any).post_id);

  return {
    ...(data as any),
    upvotes: upvoteCount || 0,
    is_upvoted: false,
  } as BlogPostMeta;
}

/**
 * Update blog post metadata
 *
 * This function updates an existing entry in the blog_posts_meta table.
 *
 * @param client - Supabase client instance
 * @param slug - The slug of the blog post to update
 * @param meta - Updated blog post metadata
 * @returns Updated blog post metadata
 */
export async function updateBlogPostMeta(
  client: SupabaseClient<Database>,
  slug: string,
  meta: {
    title?: string;
    description?: string;
    category?: string;
    author?: string;
    date?: string;
    image_url?: string | null;
    image_alt?: string | null;
    is_published?: boolean;
  },
): Promise<BlogPostMeta> {
  const { data, error } = await client
    .from("blog_posts_meta")
    .update({
      ...(meta.title && { title: meta.title }),
      ...(meta.description && { description: meta.description }),
      ...(meta.category && { category: meta.category }),
      ...(meta.author && { author: meta.author }),
      ...(meta.date && { date: meta.date }),
      ...(meta.image_url !== undefined && { image_url: meta.image_url }),
      ...(meta.image_alt !== undefined && { image_alt: meta.image_alt }),
      ...(meta.is_published !== undefined && {
        is_published: meta.is_published,
      }),
    })
    .eq("slug", slug)
    .select(BLOG_POST_META_SELECT)
    .single();

  if (error) {
    throw new Error(`블로그 포스트 메타데이터 업데이트 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error("블로그 포스트 메타데이터를 가져올 수 없습니다.");
  }

  // Get upvote count
  const { count: upvoteCount } = await (client as any)
    .from("blog_post_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", (data as any).post_id);

  return {
    ...(data as any),
    upvotes: upvoteCount || 0,
    is_upvoted: false,
  } as BlogPostMeta;
}
