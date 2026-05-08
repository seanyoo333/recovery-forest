/**
 * Admin Blog Management Page
 *
 * This page allows authenticated admins to:
 * - Create or update blog post metadata in Supabase
 * - Manage blog post publication status
 *
 * Note: MDX files are managed locally in app/content/blog/{category}/ and committed to git.
 * Images are stored in the Supabase Storage blog bucket.
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
import { BLOG_CATEGORIES, getBlogCategory } from "~/features/blog/categories";
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
  image_url: z
    .string()
    .url("대표 이미지 URL 형식이 올바르지 않습니다.")
    .optional()
    .or(z.literal("")),
  image_alt: z.string().optional(),
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
      image_url: formData.get("image_url"),
      image_alt: formData.get("image_alt"),
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

      const category = getBlogCategory(parsedData.category);

      // Save metadata to database
      await createBlogPostMeta(client, {
        slug: parsedData.slug,
        title: parsedData.title,
        description: parsedData.description,
        category: category.slug,
        author: parsedData.author,
        date: parsedData.date,
        image_url: parsedData.image_url || null,
        image_alt: parsedData.image_alt || null,
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
                app/content/blog/{`{categorySlug}`}/
              </code>{" "}
              디렉토리에 저장하고 Git에 커밋하세요.
            </li>
            <li>
              • 대표 이미지는 Supabase Storage의{" "}
              <code className="bg-muted rounded px-1">
                blog/{`{slug}`}/cover.webp
              </code>{" "}
              형식으로 업로드하고 Public URL을 아래{" "}
              <code className="bg-muted rounded px-1">image_url</code>에
              입력하세요.
            </li>
            <li>
              • MDX 내부 이미지는 Supabase Storage의{" "}
              <code className="bg-muted rounded px-1">
                blog/{`{slug}`}/
              </code>{" "}
              경로에 업로드하고, MDX에서 Public URL을{" "}
              <code className="bg-muted rounded px-1">
                &lt;img src="https://.../storage/v1/object/public/blog/{`{slug}`}/image.jpg" /&gt;
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
                description="URL slug입니다. 파일명은 YYYY-MM-DD-{slug}.mdx 규칙을 사용하세요."
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
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  카테고리
                </label>
                <p className="text-muted-foreground text-sm">
                  MDX 폴더명과 같은 taxonomy slug를 선택하세요.
                </p>
                <select
                  id="category"
                  name="category"
                  required
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {BLOG_CATEGORIES.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name} ({category.slug})
                    </option>
                  ))}
                </select>
              </div>
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

              <InputPair
                label="대표 이미지 URL"
                description="Supabase Storage blog bucket의 cover 이미지 Public URL"
                id="image_url"
                name="image_url"
                type="url"
                placeholder="https://...supabase.co/storage/v1/object/public/blog/{slug}/cover.webp"
              />
              {actionData &&
                "formErrors" in actionData &&
                actionData.formErrors &&
                "image_url" in actionData.formErrors &&
                actionData.formErrors.image_url && (
                  <p className="text-red-500">
                    {actionData.formErrors.image_url.join(", ")}
                  </p>
                )}

              <InputPair
                label="대표 이미지 설명"
                description="OG 이미지와 접근성에 사용될 대체 텍스트"
                id="image_alt"
                name="image_alt"
                type="text"
                placeholder="예: 키트루다의 PD-1/PD-L1 면역관문 기전 설명 이미지"
              />
              {actionData &&
                "formErrors" in actionData &&
                actionData.formErrors &&
                "image_alt" in actionData.formErrors &&
                actionData.formErrors.image_alt && (
                  <p className="text-red-500">
                    {actionData.formErrors.image_alt.join(", ")}
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
