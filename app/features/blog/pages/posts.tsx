/**
 * Blog Posts Screen
 *
 * This component displays a list of blog posts from MDX files in the docs directory.
 * It uses mdx-bundler to extract frontmatter from MDX files and renders a grid of
 * blog post cards with images, titles, descriptions, and metadata.
 *
 * The blog implementation demonstrates:
 * 1. MDX content handling with frontmatter extraction
 * 2. File system operations for reading blog content
 * 3. Responsive grid layout for different screen sizes
 * 4. View transitions for smooth navigation between pages
 */
import type { Route } from "./+types/posts";

import { Form, Link, data, redirect, useSearchParams } from "react-router";
import { z } from "zod";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import makeServerClient from "~/core/lib/supa-client.server";
import { BlogPagination } from "~/features/blog/components/blog-pagination";
import { getBlogPostsMeta } from "~/features/blog/queries";

/**
 * Meta function for the blog posts page
 *
 * Sets the page title using the application name from environment variables
 * and adds a meta description for SEO purposes
 */
export const meta: Route.MetaFunction = () => {
  return [
    { title: `좋은습관 블로그 | ${import.meta.env.VITE_APP_NAME}` },
    { name: "description", content: "회복의 여정, 함께 해요!" },
  ];
};

/**
 * Interface defining the structure of MDX frontmatter
 *
 * Each MDX blog post file must include these metadata fields in its frontmatter:
 * - title: The title of the blog post
 * - description: A brief summary of the post content
 * - date: Publication date (used for sorting)
 * - category: The post category for filtering/grouping
 * - author: The name of the post author
 * - slug: URL-friendly identifier for the post
 */
interface Frontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  slug: string;
  featured_image_url: string | null;
  updated_at: string;
}

/**
 * Constants for pagination
 */
const POSTS_PER_PAGE = 12;

/**
 * Search params schema for validation
 */
const searchParamsSchema = z.object({
  page: z.coerce.number().optional().default(1),
  query: z.string().optional().default(""),
  category: z.string().optional(),
});

/**
 * Loader function for the blog posts page
 *
 * This function queries the blog_posts_meta table to get metadata for all published posts.
 * It does not download MDX files, making it much faster for listing pages.
 *
 * 1. Queries the database for published blog post metadata
 * 2. Applies search and category filters
 * 3. Implements pagination
 * 4. Returns the paginated frontmatter data to be used by the component
 *
 * @param request - The incoming HTTP request with search parameters
 * @returns Object containing paginated blog post frontmatter data, total pages, and filters
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

  // Parse and validate search parameters
  const url = new URL(request.url);
  const { success, data: parsedData } = searchParamsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );

  if (!success) {
    throw data(
      {
        error_code: "Invalid search params",
        message: "Invalid search params",
      },
      {
        status: 400,
      },
    );
  }

  // Get blog posts metadata from database (no MDX download needed)
  const blogPostsMeta = await getBlogPostsMeta(client);

  // Convert to Frontmatter format for compatibility
  const frontmatters: Frontmatter[] = blogPostsMeta.map((meta) => ({
    title: meta.title,
    description: meta.description,
    date: meta.date,
    category: meta.category,
    author: meta.author,
    slug: meta.slug,
    featured_image_url: meta.featured_image_url,
    updated_at: meta.updated_at,
  }));

  // Apply search filter
  let filteredPosts = frontmatters;
  if (parsedData.query) {
    const query = parsedData.query.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query),
    );
  }

  // Apply category filter
  if (parsedData.category) {
    filteredPosts = filteredPosts.filter(
      (post) => post.category === parsedData.category,
    );
  }

  // Calculate pagination
  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const currentPage = Math.max(1, Math.min(parsedData.page, totalPages || 1));
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  // Return the paginated frontmatter data
  return {
    frontmatters: paginatedPosts,
    totalPages,
    currentPage,
    totalPosts,
    query: parsedData.query,
    category: parsedData.category,
    allCategories: [
      ...new Set(frontmatters.map((post) => post.category)),
    ] as string[],
  };
}

/**
 * Blog Posts Component
 *
 * This component renders the blog posts page with a header, search, filters, and a grid of blog post cards.
 * Each card displays:
 * - Featured image (matching the post slug)
 * - Category badge
 * - Post title
 * - Post description
 * - Author and date information
 *
 * The component uses responsive design with different layouts for mobile and desktop:
 * - Single column on mobile devices
 * - Three-column grid on desktop devices
 *
 * It also implements:
 * - Search functionality for filtering posts by title, description, or category
 * - Category filtering
 * - Pagination for better performance with many posts
 * - View transitions for smooth navigation between the posts list and individual post pages
 *
 * @param loaderData - Data from the loader containing paginated blog post frontmatter
 */
export default function Posts({
  loaderData: {
    frontmatters,
    totalPages,
    currentPage,
    totalPosts,
    query,
    category,
    allCategories,
  },
}: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="flex flex-col gap-16">
      {/* Page header with title and subtitle */}
      <header className="flex flex-col items-center">
        <h1 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
          좋은습관 블로그
        </h1>
        <p className="text-muted-foreground mt-2 text-center font-medium md:text-lg">
          회복의 여정, 함께 해요!
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

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap justify-center gap-2">
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

      {/* Responsive grid of blog post cards */}
      {frontmatters.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-8">
            {frontmatters.map((frontmatter) => (
              <Link
                to={`/blog-posts/${frontmatter.slug}`}
                key={frontmatter.slug}
                className="flex flex-col gap-4"
                viewTransition // Enable smooth transitions between pages
              >
                {/* Post featured image */}
                {frontmatter.featured_image_url ? (
                  <img
                    src={`${frontmatter.featured_image_url}?v=${new Date(frontmatter.updated_at).getTime()}`}
                    alt={frontmatter.title}
                    className="aspect-[4/3] w-full rounded-lg object-cover object-center shadow-md transition-shadow hover:shadow-lg"
                    onError={(e) => {
                      // Hide image if it fails to load and show placeholder
                      const img = e.currentTarget;
                      img.style.display = "none";
                      // Create placeholder div if it doesn't exist
                      if (
                        !img.nextElementSibling?.classList.contains("bg-muted")
                      ) {
                        const placeholder = document.createElement("div");
                        placeholder.className =
                          "bg-muted flex aspect-[4/3] w-full items-center justify-center rounded-lg";
                        placeholder.innerHTML =
                          '<span class="text-muted-foreground text-sm">이미지 없음</span>';
                        img.parentElement?.appendChild(placeholder);
                      }
                    }}
                  />
                ) : null}
                {!frontmatter.featured_image_url && (
                  <div className="bg-muted flex aspect-[4/3] w-full items-center justify-center rounded-lg">
                    <span className="text-muted-foreground text-sm">
                      이미지 없음
                    </span>
                  </div>
                )}

                {/* Category badge */}
                <Badge variant="secondary" className="text-sm">
                  {frontmatter.category}
                </Badge>
                <div>
                  {/* Post title */}
                  <h2 className="text-lg font-bold md:text-2xl">
                    {frontmatter.title}
                  </h2>
                  {/* Post description */}
                  <p className="text-muted-foreground text-pretty md:text-lg">
                    {frontmatter.description}
                  </p>
                  {/* Author and date information */}
                  <span className="text-muted-foreground mt-2 block text-sm">
                    By {frontmatter.author} on{" "}
                    {new Date(frontmatter.date).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </Link>
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
