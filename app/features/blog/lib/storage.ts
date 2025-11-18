/**
 * Blog Storage Utilities
 *
 * Helper functions for managing blog posts and images in Supabase Storage.
 * Follows the same pattern as other storage utilities in the codebase.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const BLOG_POSTS_BUCKET = "blog-posts";
const BLOG_IMAGES_BUCKET = "blog-images";

/**
 * Upload MDX blog post to Supabase Storage
 */
export async function uploadBlogPost(
  client: SupabaseClient,
  slug: string,
  content: string,
): Promise<{ path: string; publicUrl: string }> {
  const fileName = `${slug}.mdx`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await client.storage
    .from(BLOG_POSTS_BUCKET)
    .upload(fileName, content, {
      contentType: "text/markdown",
      upsert: true, // Allow overwriting existing files
    });

  if (uploadError) {
    throw new Error(`MDX 업로드 실패: ${uploadError.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = await client.storage
    .from(BLOG_POSTS_BUCKET)
    .getPublicUrl(uploadData.path);

  return {
    path: uploadData.path,
    publicUrl,
  };
}

/**
 * Download MDX blog post from Supabase Storage
 */
export async function downloadBlogPost(
  client: SupabaseClient,
  slug: string,
): Promise<string> {
  const fileName = `${slug}.mdx`;

  const { data, error } = await client.storage
    .from(BLOG_POSTS_BUCKET)
    .download(fileName);

  if (error) {
    throw new Error(`MDX 다운로드 실패: ${error.message}`);
  }

  return await data.text();
}

/**
 * List all blog post slugs from Supabase Storage
 */
export async function listBlogPosts(client: SupabaseClient): Promise<string[]> {
  const { data, error } = await client.storage
    .from(BLOG_POSTS_BUCKET)
    .list("", {
      limit: 1000,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    throw new Error(`블로그 목록 조회 실패: ${error.message}`);
  }

  return (data || [])
    .filter((file) => file.name.endsWith(".mdx"))
    .map((file) => file.name.replace(".mdx", ""));
}

/**
 * Upload blog post featured image to Supabase Storage
 */
export async function uploadBlogImage(
  client: SupabaseClient,
  slug: string,
  image: File,
): Promise<{ path: string; publicUrl: string }> {
  // Determine file extension from MIME type
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  const ext = mimeToExt[image.type] || ".jpg";
  const fileName = `${slug}${ext}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await client.storage
    .from(BLOG_IMAGES_BUCKET)
    .upload(fileName, image, {
      contentType: image.type,
      upsert: true, // Allow overwriting existing images
    });

  if (uploadError) {
    throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = await client.storage
    .from(BLOG_IMAGES_BUCKET)
    .getPublicUrl(uploadData.path);

  return {
    path: uploadData.path,
    publicUrl,
  };
}

/**
 * Get blog post featured image public URL
 * Returns URL for .jpg extension (most common)
 * Client-side can handle fallback to other extensions if needed
 */
export function getBlogImageUrl(client: SupabaseClient, slug: string): string {
  const {
    data: { publicUrl },
  } = client.storage.from(BLOG_IMAGES_BUCKET).getPublicUrl(`${slug}.jpg`);
  return publicUrl;
}
