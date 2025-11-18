/**
 * Blog Image Upload API
 *
 * This API endpoint handles uploading blog post featured images.
 * Images are saved to the public/blog/ directory.
 * Only authenticated admins can upload images.
 */
import type { Route } from "./+types/upload-blog-image";

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";
import {
  requireAdminRole,
  requireAuthentication,
} from "~/features/admin/guards.server";

const formSchema = z.object({
  slug: z.string().min(1, "Slug가 필요합니다."),
  image: z.instanceof(File, { message: "이미지 파일이 필요합니다." }),
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
    const slug = formData.get("slug") as string;
    const image = formData.get("image") as File;

    const { success, error } = formSchema.safeParse({ slug, image });

    if (!success) {
      return data(
        {
          formErrors: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // Validate image file type
    if (!image.type.startsWith("image/")) {
      return data(
        {
          formErrors: {
            image: ["이미지 파일만 업로드 가능합니다."],
          },
        },
        { status: 400 },
      );
    }

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (image.size > MAX_FILE_SIZE) {
      return data(
        {
          formErrors: {
            image: ["파일 크기는 5MB 이하여야 합니다."],
          },
        },
        { status: 400 },
      );
    }

    // Validate slug format
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

    // Convert image to buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file extension from MIME type
    const mimeToExt: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    const ext = mimeToExt[image.type] || ".jpg";

    // Construct file path
    const publicPath = path.join(
      process.cwd(),
      "public",
      "blog",
      `${slug}${ext}`,
    );

    // Write image file
    await writeFile(publicPath, buffer);

    return data(
      {
        success: true,
        message: "이미지가 성공적으로 업로드되었습니다.",
        path: `/blog-posts/${slug}${ext}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Blog image upload error:", error);
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
