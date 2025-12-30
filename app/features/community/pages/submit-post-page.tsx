import type { Route } from "./+types/submit-post-page";

import { Form, redirect } from "react-router";
import { z } from "zod";

import { Hero } from "~/core/components/hero";
import InputPair from "~/core/components/input-pair";
import SelectPair from "~/core/components/select-pair";
import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { createPost } from "../mutations";
import { getTopics, isAdminUser } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Submit Post | Evidence Base" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const isAdmin = await isAdminUser(client, userId);
  const topics = await getTopics(client);
  const filteredTopics = isAdmin
    ? topics
    : topics.filter((topic) => topic.slug !== "notice");
  return { topics: filteredTopics, isAdmin };
};

const formSchema = z.object({
  title: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  content: z.string().min(1),
});

export const action = async ({ request }: Route.ActionArgs) => {
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
      fieldErrors: { category: ["공지사항은 관리자만 작성할 수 있습니다."] },
    };
  }
  const { post_id } = await createPost(client, {
    title,
    category,
    content,
    userId,
  });
  return redirect(`/community/${post_id}`);
};

export default function SubmitPostPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <Hero
        title="토론 주제 제안"
        subtitle="질문, 아이디어, 의견을 공유하고 커뮤니티와 소통하세요."
      />
      <Form
        className="mx-auto flex max-w-screen-md flex-col gap-10"
        method="post"
      >
        <InputPair
          label="제목"
          name="title"
          id="title"
          description="(40자 이내)"
          required
          placeholder="무엇이 궁금하신가요?"
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
        />
        {actionData && "fieldErrors" in actionData && (
          <div className="text-red-500">
            {actionData.fieldErrors.content?.join(", ")}
          </div>
        )}
        <Button type="submit" className="mx-auto">
          제안하기
        </Button>
      </Form>
    </div>
  );
}
/* 나중에는 my dashboard AI 분석 내용을 가져와서 토론 주제 제안 기능 추가 */
