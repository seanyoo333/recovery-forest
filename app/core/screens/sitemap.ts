/**
 * Sitemap Generator Module
 *
 * This module dynamically generates an XML sitemap for the application by scanning
 * content directories and combining them with static routes. The sitemap helps search
 * engines discover and index the application's pages, improving SEO performance.
 *
 * The module automatically includes:
 * - Blog posts from MDX files in the blog directory
 * - Legal pages from MDX files in the legal directory
 * - Custom static routes defined in the code
 *
 * The sitemap is generated on-demand when the route is accessed, ensuring it always
 * contains the latest content without requiring a rebuild of the application.
 */
import type { Route } from "./+types/sitemap";

import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import makeServerClient from "~/core/lib/supa-client.server";
import { getBlogPostEntries } from "~/features/blog/lib/blog-content.server";

interface SitemapEntry {
  url: string;
  lastmod: string;
}

const toIsoDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

async function getBlogSitemapEntries(request: Request): Promise<SitemapEntry[]> {
  const [client] = makeServerClient(request);
  const { data, error } = await client
    .from("blog_posts_meta")
    .select("slug, date, updated_at")
    .eq("is_published", true)
    .order("date", { ascending: false });

  if (!error && data) {
    return data.map((post) => ({
      url: `/blog/${post.slug}`,
      lastmod: post.updated_at
        ? toIsoDate(post.updated_at)
        : toIsoDate(post.date),
    }));
  }

  return (await getBlogPostEntries()).map(
    ({ frontmatter, lastmod }): SitemapEntry => ({
      url: `/blog/${frontmatter.slug}`,
      lastmod: frontmatter.updatedAt
        ? toIsoDate(frontmatter.updatedAt)
        : frontmatter.date
          ? toIsoDate(frontmatter.date)
          : toIsoDate(lastmod),
    }),
  );
}

/**
 * Sitemap generator loader function
 *
 * This React Router loader function dynamically generates an XML sitemap for the application.
 * It scans the filesystem for content files, combines them with static routes, and formats
 * them according to the sitemap protocol specification.
 *
 * The function performs these steps:
 * 1. Gets the site domain from environment variables
 * 2. Scans the blog directory for MDX files and converts filenames to URLs
 * 3. Scans the legal directory for MDX files and converts filenames to URLs
 * 4. Combines these with static routes like homepage, login, and registration
 * 5. Formats all URLs according to the sitemap XML specification
 * 6. Returns an XML response with the proper content type header
 *
 * @returns {Response} XML response containing the sitemap
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Get the site domain from environment variables
  const DOMAIN = process.env.SITE_URL ?? "";
  const now = new Date().toISOString();
  const legalDocsPath = path.join(
    process.cwd(),
    "app",
    "features",
    "legal",
    "docs",
  );

  const blogEntries = await getBlogSitemapEntries(request);

  // Scan the legal directory for MDX files and convert to URLs
  const legalEntries = await Promise.all(
    (await readdir(legalDocsPath))
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file): Promise<SitemapEntry> => {
        const filePath = path.join(legalDocsPath, file);
        const fileStats = await stat(filePath);

        return {
          url: `/legal/${file.replace(/\.mdx$/, "")}`,
          lastmod: toIsoDate(fileStats.mtime),
        };
      }),
  );

  // Define static routes that should be included in the sitemap
  const customEntries: SitemapEntry[] = [
    { url: "/", lastmod: now },
    { url: "/blog", lastmod: now },
  ];

  // Combine all URLs and format them according to sitemap protocol
  const sitemapUrls = [
    ...blogEntries,
    ...legalEntries,
    ...customEntries,
  ].map(({ url, lastmod }) => {
    return `<url>
      <loc>${escapeXml(`${DOMAIN}${url}`)}</loc>
      <lastmod>${lastmod}</lastmod>
    </url>`;
  });

  // Return an XML response with the sitemap
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
    <urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
    >
      ${sitemapUrls.join("\n")}
    </urlset>
    `,
    {
      headers: { "Content-Type": "application/xml" }, // Set proper content type for XML
    },
  );
}
