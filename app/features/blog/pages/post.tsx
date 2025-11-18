/**
 * Blog Post Screen Component
 *
 * This component handles the rendering of individual blog posts using MDX.
 * It demonstrates:
 * - MDX bundling and rendering with custom components
 * - Frontmatter extraction for metadata
 * - Dynamic routing with React Router
 * - SEO optimization with meta tags
 * - Error handling for missing or invalid posts
 */
import type { Route } from "./+types/post";

import { bundleMDX } from "mdx-bundler";
import { getMDXComponent } from "mdx-bundler/client";
import path from "node:path";
import { data, redirect } from "react-router";

import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyList,
  TypographyOrderedList,
  TypographyP,
} from "~/core/components/mdx-typography";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Separator } from "~/core/components/ui/separator";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  AskDoctorList,
  Callout,
  ModeCompare,
  ReferenceList,
  SummaryBox,
  WarningBox,
} from "~/features/blog/components/blog-components";
import { downloadBlogPost } from "~/features/blog/lib/storage";
import { getBlogPostMetaBySlug } from "~/features/blog/queries";

/**
 * Meta function for the blog post page
 *
 * This function generates meta tags for SEO optimization and social sharing.
 * It handles two scenarios:
 * 1. When the post is found: Sets title, description, and Open Graph tags
 * 2. When the post is not found: Sets a 404 title
 *
 * The Open Graph tags enable rich previews when the post is shared on
 * social media platforms like Twitter, Facebook, and LinkedIn.
 *
 * @param data - The data returned from the loader function
 * @returns An array of meta tag objects for the page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  // Handle case where post is not found
  if (!data) {
    return [
      {
        title: `404 Page Not Found | ${import.meta.env.VITE_APP_NAME}`,
      },
    ];
  }

  // Generate meta tags for found posts
  return [
    // Page title with post title and app name
    {
      title: `${data.frontmatter.title} | ${import.meta.env.VITE_APP_NAME}`,
    },
    // Meta description for search engines
    {
      name: "description",
      content: data.frontmatter.description,
    },
    // Open Graph image for social media previews
    {
      name: "og:image",
      content: `http://localhost:5173/api/blog-posts/og?slug=${data.frontmatter.slug}`,
    },
    // Open Graph title for social media previews
    {
      name: "og:title",
      content: data.frontmatter.title,
    },
    // Open Graph description for social media previews
    {
      name: "og:description",
      content: data.frontmatter.description,
    },
  ];
};

/**
 * Server loader function for fetching and processing blog post content
 *
 * This function is responsible for:
 * 1. Finding the MDX file based on the URL slug parameter
 * 2. Bundling and processing the MDX content
 * 3. Extracting frontmatter metadata
 * 4. Handling errors for missing or invalid posts
 *
 * The MDX bundler compiles the markdown content into executable React components
 * while extracting the frontmatter metadata (title, date, author, etc.)
 *
 * @param params - Route parameters containing the post slug
 * @returns The processed MDX code and frontmatter metadata
 * @throws 404 error if the post is not found, 500 error for other issues
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  // Check authentication - redirect to login if not authenticated
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw redirect("/login");
  }

  try {
    // Get blog post metadata from database (includes featured_image_url)
    const blogMeta = await getBlogPostMetaBySlug(client, params.slug);

    if (!blogMeta) {
      throw data(null, { status: 404 });
    }

    // Download MDX content from Supabase Storage
    const mdxContent = await downloadBlogPost(client, params.slug);

    // Process the MDX content to extract code and frontmatter
    const { code, frontmatter } = await bundleMDX({
      source: mdxContent,
      cwd: process.cwd(),
      esbuildOptions(options) {
        options.resolveExtensions = [
          ".webp",
          ".png",
          ".jpg",
          ".jpeg",
          ".svg",
          ".gif",
          ".tsx",
          ".ts",
          ".jsx",
          ".js",
          ".mjs",
          ".cjs",
        ];
        options.alias = {
          "~": path.join(process.cwd(), "app"),
        };
        return options;
      },
    });

    // Merge frontmatter with database metadata (especially featured_image_url and updated_at)
    const mergedFrontmatter = {
      ...frontmatter,
      featured_image_url: blogMeta.featured_image_url,
      updated_at: blogMeta.updated_at,
    } as typeof frontmatter & {
      featured_image_url: string | null;
      updated_at: string;
    };

    // Return both the compiled MDX code and the merged frontmatter metadata
    return {
      frontmatter: mergedFrontmatter,
      code,
    };
  } catch (error) {
    // Handle file not found errors with a 404 response
    if (
      error instanceof Error &&
      (error.message.includes("다운로드 실패") ||
        error.message.includes("not found"))
    ) {
      throw data(null, { status: 404 });
    }
    // Handle all other errors with a 500 response
    console.error("Blog post loader error:", error);
    throw data(null, { status: 500 });
  }
}

/**
 * Blog Post Component
 *
 * This component renders a complete blog post with:
 * - Header with title, category, author, and date
 * - Featured image
 * - MDX content with custom styled typography components
 *
 * The MDX content is rendered using custom components for consistent styling
 * across all blog posts. This approach allows writing content in Markdown
 * while maintaining the design system's typography and styling.
 *
 * @param loaderData - Data from the loader containing frontmatter and compiled MDX code
 */
export default function Post({
  loaderData: { frontmatter, code },
}: Route.ComponentProps) {
  // Convert the compiled MDX code into a React component
  const MDXContent = getMDXComponent(code);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Post header with category, title, author and date */}
      <header className="space-y-4">
        <div className="space-y-2">
          <Badge variant="secondary">{frontmatter.category}</Badge>
          <h1 className="text-3xl font-bold md:text-5xl lg:text-7xl">
            {frontmatter.title}
          </h1>
        </div>
        <span className="text-muted-foreground">
          {frontmatter.author} on{" "}
          {new Date(frontmatter.date).toLocaleDateString("ko-KR")}
        </span>
      </header>

      {/* Featured image for the post */}
      {frontmatter.featured_image_url && (
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <img
              src={`${frontmatter.featured_image_url}?v=${new Date(frontmatter.updated_at).getTime()}`}
              alt={frontmatter.title}
              className="aspect-[21/9] w-full rounded-2xl object-cover object-center shadow-lg transition-shadow hover:shadow-xl"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>
      )}
      {!frontmatter.featured_image_url && (
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <div className="bg-muted flex aspect-[21/9] w-full items-center justify-center rounded-2xl">
              <span className="text-muted-foreground text-sm">이미지 없음</span>
            </div>
          </div>
        </div>
      )}

      {/* Render the MDX content with custom typography components */}
      <MDXContent
        components={{
          // Map HTML elements to custom styled components
          h1: TypographyH1,
          h2: TypographyH2,
          h3: TypographyH3,
          h4: TypographyH4,
          p: TypographyP,
          blockquote: TypographyBlockquote,
          ul: TypographyList,
          ol: TypographyOrderedList,
          code: TypographyInlineCode,
          // Shadcn UI 컴포넌트들
          Badge,
          Button,
          Card,
          CardContent,
          CardHeader,
          CardTitle,
          Alert,
          AlertDescription,
          AlertTitle,
          Separator,
          // 블로그 전용 컴포넌트들 (간결하고 실천적인 조언을 위한)
          SummaryBox,
          WarningBox,
          Callout,
          AskDoctorList,
          ModeCompare,
          ReferenceList,
        }}
      />
    </div>
  );
}
