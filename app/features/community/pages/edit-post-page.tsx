import type { Route } from "./+types/edit-post-page";

import { Form, Link, redirect } from "react-router";
import { z } from "zod";

import { Hero } from "~/core/components/hero";
import InputPair from "~/core/components/input-pair";
import SelectPair from "~/core/components/select-pair";
import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { updatePost } from "../mutations";
import { getPostById, getTopics, isAdminUser } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "글 수정 | Evidence Base" }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const isAdmin = await isAdminUser(client, userId);
  const post = await getPostById(client, {
    postId: params.postId,
  });

  // 작성자만 수정할 수 있도록 확인
  if (post.author_profile_id !== userId) {
    throw new Response("권한이 없습니다.", { status: 403 });
  }

  // 공지글은 관리자만 수정 가능
  if (post.topic_slug === "notice" && !isAdmin) {
    throw new Response("권한이 없습니다.", { status: 403 });
  }

  const topics = await getTopics(client);
  const filteredTopics = isAdmin
    ? topics
    : topics.filter((topic) => topic.slug !== "notice");
  return { topics: filteredTopics, post };
};

const formSchema = z.object({
  title: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  content: z.string().min(1),
});

export const action = async ({ request, params }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const isAdmin = await isAdminUser(client, userId);
  const formData = await request.formData();
  const { success, error, data } = formSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!success) {
    return { fieldErrors: error.flatten().fieldErrors };
  }

  const { title, category, content } = data;
  if (category === "notice" && !isAdmin) {
    return {
      fieldErrors: { category: ["공지사항은 관리자만 수정할 수 있습니다."] },
    };
  }
  await updatePost(client, {
    postId: params.postId,
    title,
    category,
    content,
    userId,
  });
  return redirect(`/community/${params.postId}`);
};

export default function EditPostPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <Hero
        title="글 수정"
        subtitle="글 내용을 수정하고 커뮤니티와 소통하세요."
      />
      <Form
        className="mx-auto flex max-w-screen-md flex-col gap-10"
        method="post"
      >
        <InputPair
          label="제목"
          name="title"
          id="title"
          description="(100자 이내)"
          required
          placeholder="What's on your mind?"
          defaultValue={loaderData.post.title}
        />
        {actionData && "fieldErrors" in actionData && (
          <div className="text-red-500">
            {actionData.fieldErrors.title?.join(", ")}
          </div>
        )}
        <SelectPair
          required
          name="category"
          label="카테고리"
          description="토론 주제를 분류하는 카테고리를 선택하세요."
          placeholder="카테고리 선택"
          defaultValue={loaderData.post.topic_slug}
          options={loaderData.topics.map((topic) => ({
            label: topic.name,
            value: topic.slug,
          }))}
        />
        {actionData && "fieldErrors" in actionData && (
          <div className="text-red-500">
            {actionData.fieldErrors.category?.join(", ")}
          </div>
        )}
        <InputPair
          label="내용"
          name="content"
          id="content"
          description="(1000자 이내로 작성해 주세요.)"
          required
          placeholder="최신 뉴스나 관심 주제를 공유해 주세요."
          textArea
          defaultValue={loaderData.post.content}
        />
        {actionData && "fieldErrors" in actionData && (
          <div className="text-red-500">
            {actionData.fieldErrors.content?.join(", ")}
          </div>
        )}
        <div className="mx-auto flex gap-5">
          <Button type="submit">수정하기</Button>
          <Button variant="outline" asChild>
            <Link to={`/community/${loaderData.post.post_id}`}>취소하기</Link>
          </Button>
        </div>
      </Form>
    </div>
  );
}
