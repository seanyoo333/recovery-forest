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
import { Link, data, useFetcher } from "react-router";

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
import { getBlogCategory } from "~/features/blog/categories";
import {
  getBlogPostEntryBySlug,
  type BlogPostFrontmatter,
} from "~/features/blog/lib/blog-content.server";
import {
  AskDoctorList,
  Callout,
  ModeCompare,
  ReferenceList,
  SummaryBox,
  WarningBox,
} from "~/features/blog/components/blog-components";
import { getBlogPostMetaBySlug } from "~/features/blog/queries";

const BLOG_DEFAULT_IMAGE = "/blog/og-default.png";

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
  const title = data.frontmatter.title;
  const description = data.frontmatter.description;
  const slug = data.frontmatter.slug;
  const imageAlt = data.frontmatter.imageAlt ?? title;
  const ogImageUrl = `${baseUrl}/api/blog/og?slug=${slug}`;
  const postUrl = `${baseUrl}/blog/${slug}`;

  return [
    {
      title: `${title} | ${import.meta.env.VITE_APP_NAME}`,
    },
    {
      name: "description",
      content: description,
    },
    {
      tagName: "link",
      rel: "canonical",
      href: postUrl,
    },
    {
      property: "og:type",
      content: "article",
    },
    {
      property: "og:url",
      content: postUrl,
    },
    {
      property: "og:title",
      content: title,
    },
    {
      property: "og:description",
      content: description,
    },
    {
      property: "og:image",
      content: ogImageUrl,
    },
    {
      property: "og:image:alt",
      content: imageAlt,
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:title",
      content: title,
    },
    {
      name: "twitter:description",
      content: description,
    },
    {
      name: "twitter:image",
      content: ogImageUrl,
    },
    {
      name: "twitter:image:alt",
      content: imageAlt,
    },
    {
      property: "article:published_time",
      content: data.frontmatter.date,
    },
    {
      property: "article:author",
      content: data.frontmatter.author,
    },
    {
      property: "article:section",
      content: data.frontmatter.categoryName ?? data.frontmatter.category,
    },
  ];
};

/**
 * Server loader function for fetching and processing blog post content
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const entry = await getBlogPostEntryBySlug(params.slug);
  if (!entry) {
    throw data(null, { status: 404 });
  }

  try {
    // Process the MDX file to extract code and frontmatter
    const { code } = await bundleMDX({
      file: entry.filePath,
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
      blogMeta = await getBlogPostMetaBySlug(client, params.slug, user?.id);
    } catch {
      // If Supabase query fails, continue without metadata
    }

    // Merge frontmatter with Supabase metadata (prefer Supabase for dynamic fields)
    const mergedFrontmatter = blogMeta
      ? {
          ...entry.frontmatter,
          title: blogMeta.title,
          description: blogMeta.description,
          category: blogMeta.category,
          author: blogMeta.author,
          date: blogMeta.date,
          slug: blogMeta.slug,
          image: blogMeta.image_url ?? entry.frontmatter.image,
          imageAlt: blogMeta.image_alt ?? entry.frontmatter.imageAlt,
          updatedAt: blogMeta.updated_at ?? entry.frontmatter.updatedAt,
        }
      : entry.frontmatter;
    const category = getBlogCategory(mergedFrontmatter.category);
    const normalizedFrontmatter: BlogPostFrontmatter = {
      title: String(mergedFrontmatter.title ?? ""),
      description: String(mergedFrontmatter.description ?? ""),
      date: String(mergedFrontmatter.date ?? ""),
      category: category.slug,
      categoryName: category.name,
      author: String(mergedFrontmatter.author ?? ""),
      slug:
        typeof mergedFrontmatter.slug === "string"
          ? mergedFrontmatter.slug
          : params.slug,
      image:
        typeof mergedFrontmatter.image === "string"
          ? mergedFrontmatter.image
          : undefined,
      imageAlt:
        typeof mergedFrontmatter.imageAlt === "string"
          ? mergedFrontmatter.imageAlt
          : undefined,
      updatedAt:
        typeof mergedFrontmatter.updatedAt === "string"
          ? mergedFrontmatter.updatedAt
          : undefined,
      tags: Array.isArray(mergedFrontmatter.tags)
        ? mergedFrontmatter.tags
        : undefined,
    };

    // Calculate base URL from request (for OG image generation)
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    return {
      frontmatter: normalizedFrontmatter,
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
  loaderData: { frontmatter, code, baseUrl, postId, upvotes, is_upvoted },
}: Route.ComponentProps) {
  const MDXContent = getMDXComponent(code);
  const fetcher = useFetcher();
  const featuredImageUrl = frontmatter.image ?? BLOG_DEFAULT_IMAGE;
  const toAbsoluteUrl = (url: string) =>
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
  const postUrl = `${baseUrl}/blog/${frontmatter.slug}`;
  const rawTags: unknown = frontmatter.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    dateModified: frontmatter.updatedAt ?? frontmatter.date,
    author: {
      "@type": "Person",
      name: frontmatter.author,
    },
    publisher: {
      "@type": "Organization",
      name: import.meta.env.VITE_APP_NAME,
    },
    image: toAbsoluteUrl(featuredImageUrl),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    articleSection: frontmatter.categoryName,
    ...(tags.length > 0 ? { keywords: tags } : {}),
  };

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto w-full max-w-4xl space-y-8">
        {/* Post header */}
        <header className="space-y-4">
          <div className="space-y-3">
            <Badge variant="secondary">{frontmatter.categoryName}</Badge>
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
            src={featuredImageUrl}
            alt={frontmatter.imageAlt ?? frontmatter.title}
            className="aspect-[21/9] w-full rounded-2xl object-cover object-center shadow-lg transition-shadow hover:shadow-xl"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.endsWith(BLOG_DEFAULT_IMAGE)) {
                img.src = BLOG_DEFAULT_IMAGE;
                return;
              }
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
            img: ({ alt, ...props }) => (
              <img
                {...props}
                alt={alt ?? ""}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.src.endsWith(BLOG_DEFAULT_IMAGE)) {
                    img.src = BLOG_DEFAULT_IMAGE;
                    return;
                  }
                  img.style.display = "none";
                  const placeholder = img
                    .closest("figure")
                    ?.querySelector("[data-image-placeholder]") as HTMLElement;
                  if (placeholder) {
                    placeholder.style.display = "flex";
                  }
                }}
              />
            ),
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
    </>
  );
}
