/**
 * Admin Blog Management Page
 *
 * This page allows authenticated admins to:
 * - Create or update blog post metadata in Supabase
 * - Manage blog post publication status
 *
 * Note: MDX files are managed locally in app/features/blog/docs/ and committed to git.
 * Images are stored in public/blog/ directory.
 * This page only manages metadata for dynamic features (views, likes, bookmarks, comments, etc.)
 *
 * Follows the same pattern as other admin pages for consistency.
 */
import type { Route } from "./+types/admin-blog-page";

import { Form, Link, redirect } from "react-router";
import { z } from "zod";

import { Hero } from "~/core/components/hero";
import InputPair from "~/core/components/input-pair";
import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  requireAdminRole,
  requireAuthentication,
} from "~/features/admin/guards.server";
import {
  createBlogPostMeta,
  updateBlogPostMeta,
} from "~/features/blog/queries";
import { getLoggedInUserId } from "~/features/users/queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "블로그 관리 | Evidence Base" },
    {
      name: "description",
      content: "블로그 포스트 메타데이터 관리",
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  return {};
}

const metaFormSchema = z.object({
  title: z.string().min(1, "제목이 필요합니다."),
  description: z.string().min(1, "설명이 필요합니다."),
  date: z.string().min(1, "날짜가 필요합니다."),
  category: z.string().min(1, "카테고리가 필요합니다."),
  author: z.string().min(1, "작성자가 필요합니다."),
  slug: z.string().min(1, "Slug가 필요합니다."),
  is_published: z.string().optional(),
});

export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);

  await requireAuthentication(client);
  await requireAdminRole(client);

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "create-meta" || actionType === "update-meta") {
    const {
      success,
      error,
      data: parsedData,
    } = metaFormSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      date: formData.get("date"),
      category: formData.get("category"),
      author: formData.get("author"),
      slug: formData.get("slug"),
      is_published: formData.get("is_published") || "true",
    });

    if (!success) {
      return { formErrors: error.flatten().fieldErrors };
    }

    // Validate slug format (URL-safe)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(parsedData.slug)) {
      return {
        formErrors: {
          slug: [
            "Slug는 소문자, 숫자, 하이픈만 사용할 수 있습니다. (예: my-blog-post)",
          ],
        },
      };
    }

    try {
      // Get user ID for profile_id
      const userId = await getLoggedInUserId(client);

      // Save metadata to database
      await createBlogPostMeta(client, {
        slug: parsedData.slug,
        title: parsedData.title,
        description: parsedData.description,
        category: parsedData.category,
        author: parsedData.author,
        date: parsedData.date,
        profile_id: userId,
        is_published: parsedData.is_published === "true",
      });

      return redirect(`/blog/${parsedData.slug}`);
    } catch (error) {
      console.error("Blog metadata save error:", error);
      return {
        formErrors: {
          _form: [
            error instanceof Error
              ? error.message
              : "메타데이터 저장 중 오류가 발생했습니다.",
          ],
        },
      };
    }
  }

  if (actionType === "update-meta-only") {
    const slug = formData.get("slug") as string;
    const is_published = formData.get("is_published") === "true";

    if (!slug) {
      return {
        formErrors: {
          _form: ["Slug가 필요합니다."],
        },
      };
    }

    try {
      await updateBlogPostMeta(client, slug, {
        is_published,
      });

      return {
        success: true,
        message: "메타데이터가 성공적으로 업데이트되었습니다.",
      };
    } catch (error) {
      console.error("Blog metadata update error:", error);
      return {
        formErrors: {
          _form: [
            error instanceof Error
              ? error.message
              : "메타데이터 업데이트 중 오류가 발생했습니다.",
          ],
        },
      };
    }
  }

  return { formErrors: { _form: ["알 수 없는 작업입니다."] } };
}

export default function AdminBlogPage({ actionData }: Route.ComponentProps) {
  return (
    <div>
      <Hero title="블로그 관리" subtitle="블로그 포스트 메타데이터 관리" />
      <div className="mx-auto max-w-screen-lg space-y-8 p-6">
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">안내</h3>
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li>
              • MDX 파일은 로컬에서 작성하여{" "}
              <code className="bg-muted rounded px-1">
                app/features/blog/docs/
              </code>{" "}
              디렉토리에 저장하고 Git에 커밋하세요.
            </li>
            <li>
              • 대표 이미지는{" "}
              <code className="bg-muted rounded px-1">
                public/blog/{`{slug}.{ext}`}
              </code>{" "}
              형식으로 저장하세요. (jpg, png, webp, jpeg, gif 지원)
            </li>
            <li>
              • MDX 내부 이미지는{" "}
              <code className="bg-muted rounded px-1">
                public/blog/{`{date}_{slug}/`}
              </code>{" "}
              폴더에 저장하고 MDX에서{" "}
              <code className="bg-muted rounded px-1">
                &lt;img src="/blog/{`{date}_{slug}/image.jpg`}" /&gt;
              </code>{" "}
              형식으로 사용하세요.
            </li>
            <li>
              • 이 페이지는 Supabase에 메타데이터만 저장합니다. (조회수, 좋아요,
              북마크, 댓글 등 동적 기능용)
            </li>
            <li>
              • MDX 파일의 frontmatter와 Supabase 메타데이터가 모두 있어야
              포스트가 표시됩니다.
            </li>
          </ul>
        </div>

        {/* Metadata Form */}
        <Form method="post" className="space-y-6">
          <input type="hidden" name="actionType" value="create-meta" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <InputPair
                label="Slug"
                description="MDX 파일명과 일치해야 합니다 (예: my-blog-post.mdx → my-blog-post)"
                id="slug"
                name="slug"
                type="text"
                required
                placeholder="예: my-blog-post"
              />
              {actionData &&
                "formErrors" in actionData &&
                actionData.formErrors &&
                "slug" in actionData.formErrors &&
                actionData.formErrors.slug && (
                  <p className="text-red-500">
                    {actionData.formErrors.slug.join(", ")}
                  </p>
                )}

              <InputPair
                label="제목"
                description="블로그 포스트 제목"
                id="title"
                name="title"
                type="text"
                required
                placeholder="예: 암 치료 가이드"
              />
              {actionData &&
                "formErrors" in actionData &&
                actionData.formErrors &&
                "title" in actionData.formErrors &&
                actionData.formErrors.title && (
                  <p className="text-red-500">
                    {actionData.formErrors.title.join(", ")}
                  </p>
                )}

              <InputPair
                label="설명"
                description="블로그 포스트 간단한 설명"
                id="description"
                name="description"
                type="text"
                required
                placeholder="예: 암 환자를 위한 실전 가이드"
              />
              {actionData &&
                "formErrors" in actionData &&
                actionData.formErrors &&
                "description" in actionData.formErrors &&
                actionData.formErrors.description && (
                  <p className="text-red-500">
                    {actionData.formErrors.description.join(", ")}
                  </p>
                )}

              <InputPair
                label="날짜"
                description="발행 날짜 (YYYY-MM-DD 형식)"
                id="date"
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
              {actionData &&
                "formErrors" in actionData &&
                actionData.formErrors &&
                "date" in actionData.formErrors &&
                actionData.formErrors.date && (
                  <p className="text-red-500">
                    {actionData.formErrors.date.join(", ")}
                  </p>
                )}
            </div>

            <div className="space-y-5">
              <InputPair
                label="카테고리"
                description="블로그 포스트 카테고리"
                id="category"
                name="category"
                type="text"
                required
                placeholder="예: 면역요법, 대사치료"
              />
              {actionData &&
                "formErrors" in actionData &&
                actionData.formErrors &&
                "category" in actionData.formErrors &&
                actionData.formErrors.category && (
                  <p className="text-red-500">
                    {actionData.formErrors.category.join(", ")}
                  </p>
                )}

              <InputPair
                label="작성자"
                description="블로그 포스트 작성자 이름"
                id="author"
                name="author"
                type="text"
                required
                placeholder="예: 작성자"
              />
              {actionData &&
                "formErrors" in actionData &&
                actionData.formErrors &&
                "author" in actionData.formErrors &&
                actionData.formErrors.author && (
                  <p className="text-red-500">
                    {actionData.formErrors.author.join(", ")}
                  </p>
                )}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  value="true"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="is_published" className="text-sm">
                  발행됨 (is_published)
                </label>
              </div>
            </div>
          </div>

          {actionData &&
            "formErrors" in actionData &&
            actionData.formErrors &&
            "_form" in actionData.formErrors &&
            Array.isArray(actionData.formErrors._form) && (
              <div className="rounded-lg bg-red-50 p-4 text-red-800">
                {actionData.formErrors._form.join(", ")}
              </div>
            )}

          {actionData && "success" in actionData && (
            <div className="rounded-lg bg-green-50 p-4 text-green-800">
              {actionData.message}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              메타데이터 저장
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/blog">블로그 목록 보기</Link>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
