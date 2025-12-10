/**
 * Open Graph Image Generator API
 *
 * This module dynamically generates Open Graph (OG) images for blog posts
 * based on their frontmatter metadata. These images are used when blog posts
 * are shared on social media platforms to provide rich, visual previews.
 */
import type { Route } from "./+types/og";

import { ImageResponse } from "@vercel/og";
import { bundleMDX } from "mdx-bundler";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { data } from "react-router";
import { z } from "zod";

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
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const { success, data: params } = paramsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );

  if (!success) {
    return data(null, { status: 400 });
  }

  // Construct the file path to the MDX file
  const filePath = path.join(
    process.cwd(),
    "app",
    "features",
    "blog",
    "docs",
    `${params.slug}.mdx`,
  );

  try {
    // Load and parse the MDX file to extract frontmatter
    const { frontmatter } = await bundleMDX({
      file: filePath,
    });

    // Find the actual image file with any extension
    const blogImagesPath = path.join(process.cwd(), "public", "blog");
    const baseUrl = process.env.SITE_URL || "http://localhost:5173";
    let imageFile: string | undefined;

    try {
      const files = await readdir(blogImagesPath);
      // Find image file matching the slug (any extension)
      imageFile = files.find((file) => {
        const nameWithoutExt = file.replace(/\.[^/.]+$/, "");
        return nameWithoutExt === params.slug;
      });
    } catch {
      // If directory doesn't exist or can't read, imageFile remains undefined
    }

    // Generate and return the OG image using Vercel's ImageResponse
    return new ImageResponse(
      (
        <div tw="relative flex h-full w-full" style={{ fontFamily: "Inter" }}>
          {/* Background image from the blog post - only if image file exists */}
          {imageFile && (
            <img
              src={`${baseUrl}/blog/${imageFile}`}
              tw="absolute inset-0 h-full w-full object-cover object-center"
            />
          )}
          {/* Overlay with title and description */}
          <div
            tw={`absolute flex h-full w-full items-center justify-center p-8 flex-col ${
              imageFile ? "bg-black bg-opacity-20" : "bg-gray-100"
            }`}
          >
            <h1
              tw={`text-6xl font-extrabold ${imageFile ? "text-white" : "text-gray-900"}`}
            >
              {frontmatter.title}
            </h1>
            <p
              tw={`text-3xl -mt-2 ${imageFile ? "text-white" : "text-gray-600"}`}
            >
              {frontmatter.description}
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
