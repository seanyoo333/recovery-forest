import { bundleMDX } from "mdx-bundler";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { getBlogCategory } from "../categories";

export interface BlogPostFrontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  categoryName: string;
  author: string;
  slug: string;
  image?: string;
  imageAlt?: string;
  updatedAt?: string;
  tags?: unknown[];
}

export interface BlogPostEntry {
  filePath: string;
  frontmatter: BlogPostFrontmatter;
  lastmod: Date;
}

export const BLOG_CONTENT_ROOT = path.join(process.cwd(), "app", "content", "blog");
const PUBLIC_BLOG_ROOT = path.join(process.cwd(), "public", "blog");
const LEGACY_BLOG_DOCS_ROOT = path.join(
  process.cwd(),
  "app",
  "features",
  "blog",
  "docs",
);

const DATE_PREFIX_PATTERN = /^\d{4}-\d{2}-\d{2}-/;
const IMAGE_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif"]);

async function pathExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getMdxFiles(root: string): Promise<string[]> {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(root, entry.name);

      if (entry.isDirectory()) {
        return getMdxFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".mdx") ? [entryPath] : [];
    }),
  );

  return nested.flat();
}

function slugFromFileName(filePath: string) {
  return path
    .basename(filePath, ".mdx")
    .replace(DATE_PREFIX_PATTERN, "");
}

function normalizeFrontmatter(
  frontmatter: Record<string, unknown>,
  fallbackSlug: string,
): BlogPostFrontmatter {
  const category = getBlogCategory(frontmatter.category);

  return {
    title: String(frontmatter.title ?? ""),
    description: String(frontmatter.description ?? ""),
    date: String(frontmatter.date ?? ""),
    category: category.slug,
    categoryName: category.name,
    author: String(frontmatter.author ?? ""),
    slug:
      typeof frontmatter.slug === "string" && frontmatter.slug.trim()
        ? frontmatter.slug.trim()
        : fallbackSlug,
    image:
      typeof frontmatter.image === "string" && frontmatter.image.trim()
        ? frontmatter.image.trim()
        : undefined,
    imageAlt:
      typeof frontmatter.imageAlt === "string" && frontmatter.imageAlt.trim()
        ? frontmatter.imageAlt.trim()
        : typeof frontmatter.image_alt === "string" && frontmatter.image_alt.trim()
          ? frontmatter.image_alt.trim()
          : undefined,
    updatedAt:
      typeof frontmatter.updatedAt === "string" && frontmatter.updatedAt.trim()
        ? frontmatter.updatedAt.trim()
        : typeof frontmatter.updated_at === "string" &&
            frontmatter.updated_at.trim()
          ? frontmatter.updated_at.trim()
          : undefined,
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : undefined,
  };
}

async function findPostImage(slug: string, basename: string) {
  const imageDirectory = path.join(PUBLIC_BLOG_ROOT, slug);

  if (await pathExists(imageDirectory)) {
    const files = await readdir(imageDirectory);
    const imageFile = files.find((file) => {
      const parsed = path.parse(file);
      return (
        parsed.name === basename && IMAGE_EXTENSIONS.has(parsed.ext.toLowerCase())
      );
    });

    if (imageFile) {
      return `/blog/${slug}/${imageFile}`;
    }
  }

  return undefined;
}

export async function getBlogPostEntries(): Promise<BlogPostEntry[]> {
  const contentFiles = await getMdxFiles(BLOG_CONTENT_ROOT);
  const files =
    contentFiles.length > 0 ? contentFiles : await getMdxFiles(LEGACY_BLOG_DOCS_ROOT);

  const entries = await Promise.all(
    files.map(async (filePath) => {
      const fileStats = await stat(filePath);
      const fallbackSlug = slugFromFileName(filePath);
      const { frontmatter: rawFrontmatter } = await bundleMDX({ file: filePath });

      const frontmatter = normalizeFrontmatter(rawFrontmatter, fallbackSlug);
      const image =
        frontmatter.image ??
        (await findPostImage(frontmatter.slug, "cover")) ??
        (await findPostImage(frontmatter.slug, frontmatter.slug));

      return {
        filePath,
        frontmatter: {
          ...frontmatter,
          image,
        },
        lastmod: fileStats.mtime,
      };
    }),
  );

  return entries.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime(),
  );
}

export async function getBlogPostEntryBySlug(slug: string) {
  const entries = await getBlogPostEntries();
  return entries.find((entry) => entry.frontmatter.slug === slug) ?? null;
}
