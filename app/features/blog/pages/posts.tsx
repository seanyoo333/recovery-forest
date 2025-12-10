/**
 * Blog Posts Screen
 *
 * This component displays a list of blog posts from MDX files in the docs directory.
 * It combines local MDX files with Supabase metadata for dynamic features like views, likes, etc.
 *
 * The blog implementation demonstrates:
 * 1. MDX content handling with frontmatter extraction from local files
 * 2. Supabase metadata integration for dynamic features
 * 3. File system operations for reading blog content
 * 4. Responsive grid layout for different screen sizes
 * 5. View transitions for smooth navigation between pages
 */
import type { Route } from "./+types/posts";

import { ChevronUpIcon } from "lucide-react";
import { bundleMDX } from "mdx-bundler";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { Form, Link, useFetcher, useSearchParams } from "react-router";
import { redirect } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";
import { BlogPagination } from "~/features/blog/components/blog-pagination";
import { getBlogPostsMeta } from "~/features/blog/queries";

/**
 * Meta function for the blog posts page
 */
export const meta: Route.MetaFunction = () => {
  return [
    { title: `좋은습관 블로그 | ${import.meta.env.VITE_APP_NAME}` },
    { name: "description", content: "근거기반의 통합의학 정보를 공유합니다." },
  ];
};

/**
 * Interface defining the structure of blog post data
 */
interface BlogPost {
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  slug: string;
  upvotes?: number;
  is_upvoted?: boolean;
  post_id?: number;
}

const POSTS_PER_PAGE = 10;

/**
 * Blog Post Card Component with Optimistic Upvote
 */
function BlogPostCard({ frontmatter }: { frontmatter: BlogPost }) {
  const fetcher = useFetcher();

  // Optimistic updates for upvote
  const optimisticUpvotes =
    fetcher.state === "idle"
      ? frontmatter.upvotes || 0
      : frontmatter.is_upvoted
        ? (frontmatter.upvotes || 0) - 1
        : (frontmatter.upvotes || 0) + 1;
  const optimisticIsUpvoted =
    fetcher.state === "idle"
      ? frontmatter.is_upvoted || false
      : !frontmatter.is_upvoted;

  const handleUpvoteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!frontmatter.post_id) return;
    fetcher.submit(null, {
      method: "POST",
      action: `/api/blog/${frontmatter.post_id}/upvote`,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/blog/${frontmatter.slug}`}
        className="flex flex-col gap-4"
        viewTransition
      >
        {/* Post featured image */}
        <div className="relative">
          <img
            src={`/blog/${frontmatter.slug}.jpg`}
            alt={frontmatter.title}
            className="aspect-[4/3] w-full rounded-lg object-cover object-center shadow-md transition-shadow hover:shadow-lg"
            loading="lazy"
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
          <div className="bg-muted absolute inset-0 hidden aspect-[4/3] w-full items-center justify-center rounded-lg">
            <span className="text-muted-foreground text-sm">이미지 없음</span>
          </div>
        </div>
      </Link>

      {/* Category badge and Upvote button */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-sm">
          {frontmatter.category}
        </Badge>
        {frontmatter.post_id && (
          <Button
            onClick={handleUpvoteClick}
            variant="outline"
            size="sm"
            className={cn(
              "w-fit",
              optimisticIsUpvoted && "border-primary text-primary",
            )}
          >
            <ChevronUpIcon className="size-4" />
            <span>{optimisticUpvotes}</span>
          </Button>
        )}
      </div>

      <Link
        to={`/blog/${frontmatter.slug}`}
        className="flex flex-col gap-4"
        viewTransition
      >
        <div>
          <h2 className="text-lg font-bold md:text-2xl">{frontmatter.title}</h2>
          <p className="text-muted-foreground text-pretty md:text-lg">
            {frontmatter.description}
          </p>
          <span className="text-muted-foreground mt-2 block text-sm">
            By {frontmatter.author} on{" "}
            {new Date(frontmatter.date).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </Link>
    </div>
  );
}

/**
 * Loader function for the blog posts page
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  // Check authentication - redirect to login if not authenticated
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw redirect("/login");
  }

  // Parse search parameters
  const url = new URL(request.url);
  const query = url.searchParams.get("query") || "";
  const category = url.searchParams.get("category") || "";
  const page = Number(url.searchParams.get("page")) || 1;
  const sorting =
    (url.searchParams.get("sorting") as "newest" | "popular") || "newest";

  // Get the path to the docs directory containing MDX files
  const docsPath = path.join(process.cwd(), "app", "features", "blog", "docs");

  // Read all files in the docs directory
  const files = await readdir(docsPath);
  const mdxFiles = files.filter((file) => file.endsWith(".mdx"));

  // Get blog posts metadata from Supabase (optional - if available)
  let blogPostsMeta: Awaited<ReturnType<typeof getBlogPostsMeta>> = [];
  try {
    blogPostsMeta = await getBlogPostsMeta(client, user.id, sorting);
  } catch (error) {
    // If Supabase query fails, continue without metadata
    console.warn("Failed to fetch blog posts metadata:", error);
  }

  // Create a map of slug to metadata for quick lookup
  const metaMap = new Map(blogPostsMeta.map((meta) => [meta.slug, meta]));

  // Extract frontmatter from each MDX file and merge with Supabase metadata
  const blogPosts: BlogPost[] = await Promise.all(
    mdxFiles.map(async (file) => {
      const filePath = path.join(docsPath, file);
      const { frontmatter } = await bundleMDX({ file: filePath });
      const slug = (frontmatter.slug as string) || file.replace(/\.mdx$/, "");

      // Get metadata from Supabase if available
      const meta = metaMap.get(slug);

      // Merge frontmatter with Supabase metadata (prefer Supabase for dynamic fields)
      return {
        title: (meta?.title || frontmatter.title) as string,
        description: (meta?.description || frontmatter.description) as string,
        date: (meta?.date || frontmatter.date) as string,
        category: (meta?.category || frontmatter.category) as string,
        author: (meta?.author || frontmatter.author) as string,
        slug,
        upvotes: meta?.upvotes || 0,
        is_upvoted: meta?.is_upvoted || false,
        post_id: meta?.post_id,
      };
    }),
  );

  // Filter by published posts if Supabase metadata exists, otherwise show all
  const publishedPosts =
    blogPostsMeta.length > 0
      ? blogPosts.filter((post) => metaMap.has(post.slug))
      : blogPosts;

  // Apply search filter
  let filteredPosts = publishedPosts;
  if (query) {
    const queryLower = query.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(queryLower) ||
        post.description.toLowerCase().includes(queryLower) ||
        post.category.toLowerCase().includes(queryLower),
    );
  }

  // Apply category filter
  if (category) {
    filteredPosts = filteredPosts.filter((post) => post.category === category);
  }

  // Sort posts based on sorting parameter
  if (sorting === "popular") {
    filteredPosts.sort((a, b) => {
      const upvotesA = a.upvotes || 0;
      const upvotesB = b.upvotes || 0;
      if (upvotesB !== upvotesA) {
        return upvotesB - upvotesA;
      }
      // If upvotes are equal, sort by date
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  } else {
    // Sort by date, newest first
    filteredPosts.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  // Calculate pagination
  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  // Get all unique categories
  const allCategories = [
    ...new Set(publishedPosts.map((post) => post.category)),
  ] as string[];

  return {
    frontmatters: paginatedPosts,
    totalPages,
    currentPage,
    totalPosts,
    query,
    category,
    sorting,
    allCategories,
  };
}

/**
 * Blog Posts Component
 */
export default function Posts({
  loaderData: {
    frontmatters,
    totalPages,
    currentPage,
    totalPosts,
    query,
    category,
    sorting,
    allCategories,
  },
}: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="flex flex-col gap-16">
      {/* Page header */}
      <header className="flex flex-col items-center">
        <h1 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
          좋은습관 블로그
        </h1>
        <p className="text-muted-foreground mt-2 text-center font-medium md:text-lg">
          근거기반의 통합의학 정보를 공유합니다.
        </p>
      </header>

      {/* Search bar */}
      <Form className="mx-auto flex w-full max-w-screen-sm items-center gap-2">
        <Input
          name="query"
          placeholder="제목, 설명, 카테고리로 검색..."
          defaultValue={query}
          className="flex-1"
        />
        {category && <input type="hidden" name="category" value={category} />}
        {sorting && <input type="hidden" name="sorting" value={sorting} />}
        <Button type="submit">검색</Button>
        {(query || category) && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              searchParams.delete("query");
              searchParams.delete("category");
              searchParams.delete("page");
              setSearchParams(searchParams);
            }}
          >
            초기화
          </Button>
        )}
      </Form>

      {/* Sorting options */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant={sorting === "newest" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link
            to={
              query || category
                ? `?${new URLSearchParams({
                    ...(query && { query }),
                    ...(category && { category }),
                    sorting: "newest",
                  }).toString()}`
                : "?sorting=newest"
            }
          >
            최신순
          </Link>
        </Button>
        <Button
          variant={sorting === "popular" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link
            to={
              query || category
                ? `?${new URLSearchParams({
                    ...(query && { query }),
                    ...(category && { category }),
                    sorting: "popular",
                  }).toString()}`
                : "?sorting=popular"
            }
          >
            인기순
          </Link>
        </Button>
      </div>

      {/* Category filter */}
      <div className="-mt-8 flex flex-wrap justify-center gap-2">
        <Button variant={!category ? "default" : "outline"} size="sm" asChild>
          <Link to={query ? `?query=${query}` : "?"}>전체</Link>
        </Button>
        {allCategories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              to={
                query ? `?query=${query}&category=${cat}` : `?category=${cat}`
              }
            >
              {cat}
            </Link>
          </Button>
        ))}
      </div>

      {/* Results count */}
      {totalPosts > 0 && (
        <p className="text-muted-foreground text-center text-sm">
          총 {totalPosts}개의 포스트를 찾았습니다.
        </p>
      )}

      {/* Blog post cards */}
      {frontmatters.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-8">
            {frontmatters.map((frontmatter) => (
              <BlogPostCard key={frontmatter.slug} frontmatter={frontmatter} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && <BlogPagination totalPages={totalPages} />}
        </>
      ) : (
        <div className="text-muted-foreground py-16 text-center">
          <p className="text-lg">
            {query || category
              ? "검색 결과가 없습니다."
              : "아직 작성된 블로그 포스트가 없습니다."}
          </p>
        </div>
      )}
    </div>
  );
}
