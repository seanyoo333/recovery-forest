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

import { ChevronRightIcon, ChevronUpIcon } from "lucide-react";
import { bundleMDX } from "mdx-bundler";
import { getMDXComponent } from "mdx-bundler/client";
import path from "node:path";
import { Link, data, redirect, useFetcher } from "react-router";

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
} from "~/core/components/mdx-typography1";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Separator } from "~/core/components/ui/separator";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";
import {
  AskDoctorList,
  Callout,
  ModeCompare,
  ReferenceList,
  SummaryBox,
  WarningBox,
} from "~/features/blog/components/blog-components";
import { getBlogPostMetaBySlug } from "~/features/blog/queries";

/**
 * Meta function for the blog post page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  if (!data) {
    return [
      {
        title: `404 Page Not Found | ${import.meta.env.VITE_APP_NAME}`,
      },
    ];
  }

  // Use baseUrl from loader data (calculated on server side)
  const baseUrl = data.baseUrl || "http://localhost:5173";

  return [
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
      content: `${baseUrl}/api/blog/og?slug=${data.frontmatter.slug}`,
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
    // Process the MDX file to extract code and frontmatter
    const { code, frontmatter } = await bundleMDX({
      file: filePath,
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

    // Try to get metadata from Supabase (optional)
    let blogMeta = null;
    try {
      const userId = user?.id;
      blogMeta = await getBlogPostMetaBySlug(client, params.slug, userId);
    } catch {
      // If Supabase query fails, continue without metadata
    }

    // Merge frontmatter with Supabase metadata (prefer Supabase for dynamic fields)
    const mergedFrontmatter = blogMeta
      ? {
          ...frontmatter,
          title: blogMeta.title,
          description: blogMeta.description,
          category: blogMeta.category,
          author: blogMeta.author,
          date: blogMeta.date,
          slug: blogMeta.slug,
        }
      : frontmatter;

    // Calculate base URL from request (for OG image generation)
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    return {
      frontmatter: mergedFrontmatter,
      code,
      baseUrl,
      postId: blogMeta?.post_id,
      upvotes: blogMeta?.upvotes || 0,
      is_upvoted: blogMeta?.is_upvoted || false,
    };
  } catch (error) {
    // Handle file not found errors with a 404 response
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw data(null, { status: 404 });
    }
    // Handle all other errors with a 500 response
    console.error("Blog post loader error:", error);
    throw data(null, { status: 500 });
  }
}

/**
 * Blog Post Component
 */
export default function Post({
  loaderData: { frontmatter, code, postId, upvotes, is_upvoted },
}: Route.ComponentProps) {
  const MDXContent = getMDXComponent(code);
  const fetcher = useFetcher();

  // Optimistic updates for upvote
  const optimisticUpvotes =
    fetcher.state === "idle"
      ? upvotes || 0
      : is_upvoted
        ? (upvotes || 0) - 1
        : (upvotes || 0) + 1;
  const optimisticIsUpvoted =
    fetcher.state === "idle" ? is_upvoted || false : !is_upvoted;

  const handleUpvoteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!postId) return;
    fetcher.submit(null, {
      method: "POST",
      action: `/api/blog/${postId}/upvote`,
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Post header */}
      <header className="space-y-4">
        <div className="space-y-3">
          <Badge variant="secondary">{frontmatter.category}</Badge>
          <h1 className="text-3xl leading-tight font-bold tracking-tight md:text-4xl md:leading-tight lg:text-5xl lg:leading-tight">
            {frontmatter.title}
          </h1>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">
            {frontmatter.author} on{" "}
            {new Date(frontmatter.date).toLocaleDateString("ko-KR")}
          </span>
          {/* Upvote button */}
          {postId && (
            <Button
              onClick={handleUpvoteClick}
              variant="outline"
              className={cn(
                "flex h-10 flex-shrink-0 flex-col gap-1",
                optimisticIsUpvoted && "border-primary text-primary",
              )}
            >
              <ChevronUpIcon className="size-4" />
              <span className="text-xs">{optimisticUpvotes}</span>
            </Button>
          )}
        </div>
      </header>

      {/* Featured image */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-4xl">
          <img
            src={`/blog/${frontmatter.slug}.jpg`}
            alt={frontmatter.title}
            className="aspect-[21/9] w-full rounded-2xl object-cover object-center shadow-lg transition-shadow hover:shadow-xl"
            onError={(e) => {
              const img = e.currentTarget;
              img.style.display = "none";
              const placeholder = img
                .closest("div")
                ?.querySelector(".bg-muted") as HTMLElement;
              if (placeholder) {
                placeholder.style.display = "flex";
              }
            }}
          />
          {/* Placeholder */}
          <div className="bg-muted absolute inset-0 hidden aspect-[21/9] w-full items-center justify-center rounded-2xl">
            <span className="text-muted-foreground text-sm">이미지 없음</span>
          </div>
        </div>
      </div>

      {/* Render the MDX content */}
      <div className="[&_blockquote+p]:-mt-0 [&_h2+ol]:-mt-2 [&_h2+ul]:-mt-2 [&_h3+ol]:-mt-2 [&_h3+ul]:-mt-2 [&_h4+ol]:-mt-2 [&_h4+ul]:-mt-2 [&_li_ol]:my-0 [&_li_ol]:-mt-2 [&_li_ul]:my-0 [&_li_ul]:-mt-2 [&_p+blockquote]:-mt-0 [&_p+ol]:-mt-2 [&_p+ul]:-mt-2">
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
            // 블로그 전용 컴포넌트들
            SummaryBox,
            WarningBox,
            Callout,
            AskDoctorList,
            ModeCompare,
            ReferenceList,
          }}
        />
      </div>

      {/* Related Products Section */}
      <div className="space-y-4">
        <Separator />
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-xl">관련 제품 찾아보기</CardTitle>
            <CardDescription>
              이 글과 관련된 제품을 카테고리별로 찾아보실 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/products/categories">
              <Button className="w-full sm:w-auto" variant="default">
                제품 카테고리 보기
                <ChevronRightIcon className="ml-2 size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
