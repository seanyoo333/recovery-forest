/**
 * Blog MDX Upload API
 *
 * This API endpoint handles uploading MDX blog post files to the file system.
 * Only authenticated admins can upload blog posts.
 *
 * The uploaded MDX file is saved to app/features/blog/docs/ directory
 * with the filename based on the slug from frontmatter.
 */
import type { Route } from "./+types/upload-blog";

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { data, redirect } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";
import {
  requireAdminRole,
  requireAuthentication,
} from "~/features/admin/guards.server";

const formSchema = z.object({
  content: z.string().min(1, "MDX 내용이 필요합니다."),
  slug: z.string().min(1, "Slug가 필요합니다."),
});

export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);

  await requireAuthentication(client);
  await requireAdminRole(client);

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const content = formData.get("content") as string;
    const slug = formData.get("slug") as string;

    const { success, error } = formSchema.safeParse({ content, slug });

    if (!success) {
      return data(
        {
          formErrors: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // Validate slug format (URL-safe)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return data(
        {
          formErrors: {
            slug: [
              "Slug는 소문자, 숫자, 하이픈만 사용할 수 있습니다. (예: my-blog-post)",
            ],
          },
        },
        { status: 400 },
      );
    }

    // Construct file path
    const docsPath = path.join(
      process.cwd(),
      "app",
      "features",
      "blog",
      "docs",
      `${slug}.mdx`,
    );

    // Check if file already exists
    try {
      await import("node:fs/promises").then((fs) => fs.access(docsPath));
      return data(
        {
          formErrors: {
            slug: ["이미 존재하는 slug입니다. 다른 slug를 사용해주세요."],
          },
        },
        { status: 400 },
      );
    } catch {
      // File doesn't exist, proceed with upload
    }

    // Write MDX file
    await writeFile(docsPath, content, "utf-8");

    return redirect(`/blog-posts/${slug}`);
  } catch (error) {
    console.error("Blog upload error:", error);
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "업로드 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
