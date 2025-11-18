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
  featured_image_url: string | null;
  updated_at: string;
}

/**
 * Get all published blog posts metadata
 *
 * This function queries the blog_posts_meta table to get metadata for all published posts.
 * It does not download MDX files, making it much faster for listing pages.
 *
 * @param client - Supabase client instance
 * @returns Array of blog post metadata, sorted by date (newest first)
 */
export async function getBlogPostsMeta(
  client: SupabaseClient<Database>,
): Promise<BlogPostMeta[]> {
  const { data, error } = await client
    .from("blog_posts_meta")
    .select(
      "post_id, slug, title, description, category, author, date, featured_image_url, updated_at",
    )
    .eq("is_published", true)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`블로그 포스트 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * Get blog post metadata by slug
 *
 * This function queries the blog_posts_meta table to get metadata for a specific post.
 *
 * @param client - Supabase client instance
 * @param slug - The slug of the blog post
 * @returns Blog post metadata or null if not found
 */
export async function getBlogPostMetaBySlug(
  client: SupabaseClient<Database>,
  slug: string,
): Promise<BlogPostMeta | null> {
  const { data, error } = await client
    .from("blog_posts_meta")
    .select(
      "post_id, slug, title, description, category, author, date, featured_image_url, updated_at",
    )
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

  return data;
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
    featured_image_url?: string | null;
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
        featured_image_url: meta.featured_image_url || null,
        profile_id: meta.profile_id,
        is_published: meta.is_published ?? true,
        mdx_file_path: `${meta.slug}.mdx`, // Storage 경로
      },
      {
        onConflict: "slug",
      },
    )
    .select(
      "post_id, slug, title, description, category, author, date, featured_image_url, updated_at",
    )
    .single();

  if (error) {
    throw new Error(
      `블로그 포스트 메타데이터 생성/업데이트 실패: ${error.message}`,
    );
  }

  return data;
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
    featured_image_url?: string | null;
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
      ...(meta.featured_image_url !== undefined && {
        featured_image_url: meta.featured_image_url,
      }),
      ...(meta.is_published !== undefined && {
        is_published: meta.is_published,
      }),
    })
    .eq("slug", slug)
    .select(
      "post_id, slug, title, description, category, author, date, featured_image_url, updated_at",
    )
    .single();

  if (error) {
    throw new Error(`블로그 포스트 메타데이터 업데이트 실패: ${error.message}`);
  }

  return data;
}
