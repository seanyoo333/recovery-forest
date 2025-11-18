/**
 * Open Graph Image Generator API
 *
 * This module dynamically generates Open Graph (OG) images for blog posts
 * based on their frontmatter metadata. These images are used when blog posts
 * are shared on social media platforms to provide rich, visual previews.
 *
 * The generator:
 * - Extracts the blog post slug from the request URL
 * - Loads and parses the corresponding MDX file to get frontmatter metadata
 * - Creates a visually appealing image with the blog post title and description
 * - Uses the blog post's featured image as a background
 * - Returns the generated image with appropriate dimensions for social sharing
 *
 * This enhances social sharing of blog content by providing consistent,
 * branded preview images across platforms like Twitter, Facebook, and LinkedIn.
 */
import type { Route } from "./+types/og";

import { ImageResponse } from "@vercel/og";
import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";
import { getBlogImageUrl } from "~/features/blog/lib/storage";
import { getBlogPostMetaBySlug } from "~/features/blog/queries";

/**
 * Validation schema for OG image request parameters
 *
 * This schema ensures that the request includes a valid blog post slug parameter.
 * It's used with Zod's safeParse method to validate the URL search parameters
 * before attempting to generate an image.
 */
const paramsSchema = z.object({
  slug: z.string(),
});

/**
 * Loader function for generating Open Graph images
 *
 * This function handles requests for dynamically generated OG images for blog posts.
 * It follows these steps:
 * 1. Extracts and validates the blog post slug from the request URL
 * 2. Constructs the file path to the corresponding MDX file
 * 3. Loads and parses the MDX file to extract frontmatter metadata
 * 4. Generates a visually appealing image using the post's title, description, and featured image
 * 5. Returns the image with dimensions optimized for social media platforms
 *
 * Error handling:
 * - Returns 400 Bad Request for invalid parameters
 * - Returns 404 Not Found if the MDX file doesn't exist
 * - Returns 500 Internal Server Error for other errors
 *
 * @param request - The incoming HTTP request with query parameters
 * @returns An ImageResponse containing the generated OG image
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  // Extract and parse URL search parameters
  const url = new URL(request.url);
  const {
    success,
    data: params,
    error,
  } = paramsSchema.safeParse(Object.fromEntries(url.searchParams));

  // Return 400 Bad Request if parameters are invalid
  if (!success) {
    return data(null, { status: 400 });
  }

  try {
    // Get metadata from database instead of downloading MDX
    const meta = await getBlogPostMetaBySlug(client, params.slug);

    if (!meta) {
      throw data(null, { status: 404 });
    }

    // Get image URL from Supabase Storage
    const imageUrl = getBlogImageUrl(client, params.slug);

    // Generate and return the OG image using Vercel's ImageResponse
    return new ImageResponse(
      (
        <div tw="relative flex h-full w-full " style={{ fontFamily: "Inter" }}>
          {/* Background image from the blog post */}
          <img
            src={imageUrl}
            tw="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Overlay with title and description */}
          <div tw="absolute flex h-full w-full items-center justify-center p-8 flex-col bg-black bg-opacity-20">
            <h1 tw="text-white text-6xl font-extrabold ">{meta.title}</h1>
            <p tw="text-white text-3xl -mt-2">{meta.description}</p>
          </div>
        </div>
      ),
      {
        // Dimensions optimized for social media platforms
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    // Handle file not found errors with a 404 response
    if (error instanceof Response) {
      throw error;
    }
    // Handle other errors with a 500 response
    console.error("OG image generation error:", error);
    throw data(null, { status: 500 });
  }
}
