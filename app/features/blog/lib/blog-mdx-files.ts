import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export const BLOG_CONTENT_ROOT = path.join(process.cwd(), "app", "content", "blog");

export const LEGACY_BLOG_DOCS_ROOT = path.join(
  process.cwd(),
  "app",
  "features",
  "blog",
  "docs",
);

export const DATE_PREFIX_PATTERN = /^\d{4}-\d{2}-\d{2}-/;

export async function pathExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function getMdxFiles(root: string): Promise<string[]> {
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

export function slugFromFileName(filePath: string) {
  return path.basename(filePath, ".mdx").replace(DATE_PREFIX_PATTERN, "");
}

/** Prefer `app/content/blog`; fall back to legacy `app/features/blog/docs`. */
export async function resolveBlogMdxFilePaths(): Promise<string[]> {
  const contentFiles = await getMdxFiles(BLOG_CONTENT_ROOT);
  if (contentFiles.length > 0) {
    return contentFiles;
  }
  return getMdxFiles(LEGACY_BLOG_DOCS_ROOT);
}
