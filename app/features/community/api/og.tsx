/**
 * Community News Open Graph Image Generator API
 *
 * This module dynamically generates Open Graph (OG) images for community news posts
 * based on their frontmatter metadata. These images are used when community news posts
 * are shared on social media platforms to provide rich, visual previews.
 *
 * The generator:
 * - Extracts the news post slug from the request URL
 * - Loads and parses the corresponding MD/MDX file to get frontmatter metadata
 * - Creates a visually appealing image with the news title and content
 * - Uses a default background or the news category as visual theme
 * - Returns the generated image with appropriate dimensions for social sharing
 *
 * This enhances social sharing of community news content by providing consistent,
 * branded preview images across platforms like Twitter, Facebook, and LinkedIn.
 */
import { ImageResponse } from "@vercel/og";
import { bundleMDX } from "mdx-bundler";
import path from "node:path";
import { data } from "react-router";
import { z } from "zod";

/**
 * Validation schema for OG image request parameters
 *
 * This schema ensures that the request includes a valid news post slug parameter.
 * It's used with Zod's safeParse method to validate the URL search parameters
 * before attempting to generate an image.
 */
const paramsSchema = z.object({
  slug: z.string(),
});

/**
 * Loader function for generating Open Graph images for community news
 *
 * This function handles requests for dynamically generated OG images for community news posts.
 * It follows these steps:
 * 1. Extracts and validates the news post slug from the request URL
 * 2. Constructs the file path to the corresponding MD/MDX file
 * 3. Loads and parses the MD/MDX file to extract frontmatter metadata
 * 4. Generates a visually appealing image using the post's title, content, and category
 * 5. Returns the image with dimensions optimized for social media platforms
 *
 * Error handling:
 * - Returns 400 Bad Request for invalid parameters
 * - Returns 404 Not Found if the MD/MDX file doesn't exist
 * - Returns 500 Internal Server Error for other errors
 *
 * @param request - The incoming HTTP request with query parameters
 * @returns An ImageResponse containing the generated OG image
 */
export async function loader({ request }: { request: Request }) {
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

  // Construct the file path to the MD/MDX file
  const filePath = path.join(
    process.cwd(),
    "app",
    "features",
    "community",
    "docs",
    `${params.slug}.md`,
  );

  try {
    // Load and parse the MD/MDX file to extract frontmatter
    const { frontmatter } = await bundleMDX({
      file: filePath,
    });

    // Generate and return the OG image using Vercel's ImageResponse
    return new ImageResponse(
      (
        <div tw="relative flex h-full w-full" style={{ fontFamily: "Inter" }}>
          {/* Background with gradient based on category */}
          <div tw="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700" />

          {/* Content overlay */}
          <div tw="absolute flex h-full w-full items-center justify-center p-12 flex-col">
            {/* Category badge */}
            <div tw="bg-white bg-opacity-20 text-white text-lg font-semibold px-4 py-2 rounded-full mb-6">
              {frontmatter.category || "뉴스"}
            </div>

            {/* Title */}
            <h1 tw="text-white text-5xl font-bold text-center leading-tight mb-6">
              {frontmatter.title}
            </h1>

            {/* Date */}
            <div tw="text-white text-xl opacity-80 mb-4">
              {frontmatter.date}
            </div>

            {/* Content preview */}
            <p tw="text-white text-xl text-center opacity-90 max-w-4xl leading-relaxed">
              {frontmatter.content?.substring(0, 200)}...
            </p>
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
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw data(null, { status: 404 });
    }
    // Handle other errors with a 500 response
    throw data(null, { status: 500 });
  }
}
