/**
 * Admin Blog Management Page
 *
 * This page allows authenticated admins to:
 * - Upload new MDX blog post files
 * - Upload featured images for blog posts
 * - Manage existing blog posts
 *
 * Follows the same pattern as other admin pages for consistency.
 */
import type { Route } from "./+types/admin-blog-page";

import { useState } from "react";
import { Form, Link, redirect } from "react-router";
import { z } from "zod";

import { Hero } from "~/core/components/hero";
import InputPair from "~/core/components/input-pair";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  requireAdminRole,
  requireAuthentication,
} from "~/features/admin/guards.server";
import {
  getBlogImageUrl,
  uploadBlogImage,
  uploadBlogPost,
} from "~/features/blog/lib/storage";
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
      content: "블로그 포스트 및 이미지 관리",
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  return {};
}

const mdxFormSchema = z.object({
  title: z.string().min(1, "제목이 필요합니다."),
  description: z.string().min(1, "설명이 필요합니다."),
  date: z.string().min(1, "날짜가 필요합니다."),
  category: z.string().min(1, "카테고리가 필요합니다."),
  author: z.string().min(1, "작성자가 필요합니다."),
  slug: z.string().min(1, "Slug가 필요합니다."),
  content: z.string().min(1, "내용이 필요합니다."),
});

export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);

  await requireAuthentication(client);
  await requireAdminRole(client);

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "upload-mdx") {
    const {
      success,
      error,
      data: parsedData,
    } = mdxFormSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      date: formData.get("date"),
      category: formData.get("category"),
      author: formData.get("author"),
      slug: formData.get("slug"),
      content: formData.get("content"),
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

    // Build MDX content with frontmatter
    const mdxContent = `---
title: "${parsedData.title.replace(/"/g, '\\"')}"
description: "${parsedData.description.replace(/"/g, '\\"')}"
date: "${parsedData.date}"
category: "${parsedData.category}"
author: "${parsedData.author}"
slug: "${parsedData.slug}"
---

${parsedData.content}`;

    // Upload to Supabase Storage
    try {
      await uploadBlogPost(client, parsedData.slug, mdxContent);

      // Get user ID for profile_id
      const userId = await getLoggedInUserId(client);

      // Don't set featured_image_url on MDX upload - it will be set when image is uploaded
      // This prevents setting a URL for a non-existent image
      const imageUrl = null;

      // Save metadata to database
      await createBlogPostMeta(client, {
        slug: parsedData.slug,
        title: parsedData.title,
        description: parsedData.description,
        category: parsedData.category,
        author: parsedData.author,
        date: parsedData.date,
        featured_image_url: imageUrl,
        profile_id: userId,
        is_published: true,
      });

      return redirect(`/blog-posts/${parsedData.slug}`);
    } catch (error) {
      console.error("Blog upload error:", error);
      return {
        formErrors: {
          _form: [
            error instanceof Error
              ? error.message
              : "업로드 중 오류가 발생했습니다.",
          ],
        },
      };
    }
  }

  if (actionType === "upload-image") {
    const slug = formData.get("imageSlug") as string;
    const image = formData.get("image") as File;

    if (!slug || !image) {
      return {
        formErrors: {
          image: ["Slug와 이미지 파일이 필요합니다."],
        },
      };
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return {
        formErrors: {
          imageSlug: [
            "Slug는 소문자, 숫자, 하이픈만 사용할 수 있습니다. (예: my-blog-post)",
          ],
        },
      };
    }

    // Validate image file type
    if (!image.type.startsWith("image/")) {
      return {
        formErrors: {
          image: ["이미지 파일만 업로드 가능합니다."],
        },
      };
    }

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (image.size > MAX_FILE_SIZE) {
      return {
        formErrors: {
          image: ["파일 크기는 5MB 이하여야 합니다."],
        },
      };
    }

    // Upload to Supabase Storage
    try {
      const { publicUrl } = await uploadBlogImage(client, slug, image);

      console.log("Image uploaded successfully, publicUrl:", publicUrl);

      // Update featured_image_url in metadata
      const updatedMeta = await updateBlogPostMeta(client, slug, {
        featured_image_url: publicUrl,
      });

      console.log(
        "Metadata updated successfully, featured_image_url:",
        updatedMeta.featured_image_url,
      );

      return {
        success: true,
        message: "이미지가 성공적으로 업로드되었습니다.",
      };
    } catch (error) {
      console.error("Blog image upload error:", error);
      return {
        formErrors: {
          _form: [
            error instanceof Error
              ? error.message
              : "업로드 중 오류가 발생했습니다.",
          ],
        },
      };
    }
  }

  return { formErrors: { _form: ["알 수 없는 작업입니다."] } };
}

export default function AdminBlogPage({ actionData }: Route.ComponentProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mdx" | "image">("mdx");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div>
      <Hero title="블로그 관리" subtitle="MDX 포스트 및 이미지 업로드" />
      <div className="mx-auto max-w-screen-lg space-y-8 p-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "mdx" ? "default" : "ghost"}
            onClick={() => setActiveTab("mdx")}
          >
            MDX 포스트 업로드
          </Button>
          <Button
            variant={activeTab === "image" ? "default" : "ghost"}
            onClick={() => setActiveTab("image")}
          >
            이미지 업로드
          </Button>
        </div>

        {/* MDX Upload Form */}
        {activeTab === "mdx" && (
          <Form method="post" className="space-y-6">
            <input type="hidden" name="actionType" value="upload-mdx" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-5">
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
                  actionData?.formErrors?.title && (
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
                  actionData?.formErrors?.description && (
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
                  actionData?.formErrors?.date && (
                    <p className="text-red-500">
                      {actionData.formErrors.date.join(", ")}
                    </p>
                  )}

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
                  actionData?.formErrors?.category && (
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
                  actionData?.formErrors?.author && (
                    <p className="text-red-500">
                      {actionData.formErrors.author.join(", ")}
                    </p>
                  )}

                <InputPair
                  label="Slug"
                  description="URL에 사용될 고유 식별자 (소문자, 숫자, 하이픈만 사용)"
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  placeholder="예: my-blog-post"
                />
                {actionData &&
                  "formErrors" in actionData &&
                  actionData?.formErrors?.slug && (
                    <p className="text-red-500">
                      {actionData.formErrors.slug.join(", ")}
                    </p>
                  )}
              </div>

              <div className="space-y-5">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="content" className="flex flex-col gap-1">
                    MDX 내용
                    <small className="text-muted-foreground">
                      Frontmatter는 자동으로 생성됩니다. 본문 내용만 입력하세요.
                    </small>
                  </Label>
                  <Textarea
                    id="content"
                    name="content"
                    rows={20}
                    className="resize-none font-mono text-sm"
                    required
                    placeholder={`import { SummaryBox } from "~/features/blog/components/blog-components";

<SummaryBox>
  <p>핵심 요약 1</p>
  <p>핵심 요약 2</p>
  <p>핵심 요약 3</p>
</SummaryBox>

# 제목

본문 내용...`}
                  />
                  {actionData &&
                    "formErrors" in actionData &&
                    actionData?.formErrors?.content && (
                      <p className="text-red-500">
                        {actionData.formErrors.content.join(", ")}
                      </p>
                    )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                MDX 파일 업로드
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/blog-posts">블로그 목록 보기</Link>
              </Button>
            </div>
          </Form>
        )}

        {/* Image Upload Form */}
        {activeTab === "image" && (
          <Form
            method="post"
            encType="multipart/form-data"
            className="space-y-6"
          >
            <input type="hidden" name="actionType" value="upload-image" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-5">
                <InputPair
                  label="Slug"
                  description="이미지를 업로드할 블로그 포스트의 slug"
                  id="imageSlug"
                  name="imageSlug"
                  type="text"
                  required
                  placeholder="예: my-blog-post"
                />
                {actionData &&
                  "formErrors" in actionData &&
                  actionData?.formErrors?.imageSlug && (
                    <p className="text-red-500">
                      {actionData.formErrors.imageSlug.join(", ")}
                    </p>
                  )}

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="image" className="flex flex-col gap-1">
                    이미지 파일
                    <small className="text-muted-foreground">
                      JPG, PNG, WebP, GIF (최대 5MB)
                    </small>
                  </Label>
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleImageChange}
                  />
                  {actionData &&
                    "formErrors" in actionData &&
                    actionData?.formErrors?.image && (
                      <p className="text-red-500">
                        {actionData.formErrors.image.join(", ")}
                      </p>
                    )}
                </div>

                {imagePreview && (
                  <div className="space-y-2">
                    <Label>미리보기</Label>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  </div>
                )}

                {actionData && "success" in actionData && (
                  <div className="rounded-lg bg-green-50 p-4 text-green-800">
                    {actionData.message}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">이미지 업로드 안내</h3>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• 이미지는 /public/blog/ 디렉토리에 저장됩니다.</li>
                    <li>• 파일명은 {`{slug}.jpg`} 형식으로 자동 저장됩니다.</li>
                    <li>• 권장 크기: 1200x1200px 이상 (정사각형)</li>
                    <li>• 지원 형식: JPG, PNG, WebP, GIF</li>
                    <li>• 최대 크기: 5MB</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                이미지 업로드
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/blog-posts">블로그 목록 보기</Link>
              </Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
}
