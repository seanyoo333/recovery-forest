import type { Route } from "./+types/submit-product";

import { useState } from "react";
import { Form, redirect } from "react-router";
import z from "zod";

import { Hero } from "~/core/components/hero";
import InputPair from "~/core/components/input-pair";
import SelectPair from "~/core/components/select-pair";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  requireAdminRole,
  requireAuthentication,
} from "~/features/admin/guards.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { createProduct } from "../mutations";
import { getCategories } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Submit Natural Product | Evidence Base" },
    { name: "description", content: "Submit your natural product" },
  ];
};

const formSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  url: z.string().min(1),
  description: z.string().min(1),
  how_it_works: z.string().min(1),
  category: z.coerce.number(),
  picture: z.instanceof(File),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);

  await requireAuthentication(client);
  await requireAdminRole(client);

  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const { data, success, error } = formSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!success) {
    return { formErrors: error.flatten().fieldErrors };
  }
  const { picture, ...rest } = data;
  const { data: uploadData, error: uploadError } = await client.storage
    .from("products")
    .upload(`${userId}/${Date.now()}`, picture, {
      contentType: picture.type,
      upsert: false,
    });
  if (uploadError) {
    return { formError: { picture: ["Failed to upload picture"] } };
  }

  console.log("Uploaded file path:", uploadData.path);

  // Public URL 사용 (버킷이 public으로 설정됨)
  const {
    data: { publicUrl },
  } = await client.storage.from("products").getPublicUrl(uploadData.path);

  if (!publicUrl) {
    return { formError: { picture: ["Failed to get public URL"] } };
  }

  console.log("Public URL:", publicUrl);

  const productId = await createProduct(client, {
    name: rest.name,
    tagline: rest.tagline,
    description: rest.description,
    howItWorks: rest.how_it_works,
    url: rest.url,
    pictureUrl: publicUrl,
    categoryId: rest.category,
    userId,
  });
  return redirect(`/products/${productId}`);
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  // 카테고리 데이터 로드
  const categories = await getCategories(client);

  return { categories };
}

export default function SubmitPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [picture, setPicture] = useState<string | null>(null);
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      setPicture(URL.createObjectURL(file));
    }
  };
  return (
    <div>
      <Hero
        title="천연물질 등록"
        subtitle="천연물질(Natural Products)을 등록하여 매출을 올려보세요"
      />
      <Form
        method="post"
        encType="multipart/form-data"
        className="mx-auto grid max-w-screen-lg grid-cols-2 gap-10"
      >
        <div className="space-y-5">
          <InputPair
            label="천연물질명"
            description="등록할 천연물질의 이름을 입력하세요"
            id="name"
            name="name"
            type="text"
            required
            placeholder="천연물질 이름을 입력하세요"
          />
          {actionData &&
            "formErrors" in actionData &&
            actionData?.formErrors?.name && (
              <p className="text-red-500">{actionData.formErrors.name}</p>
            )}
          <InputPair
            label="태그라인"
            description="60자 이내로 입력하세요"
            id="tagline"
            name="tagline"
            required
            type="text"
            placeholder="천연물질에 대한 간단한 설명을 입력하세요"
          />
          {actionData &&
            "formErrors" in actionData &&
            actionData?.formErrors?.tagline && (
              <p className="text-red-500">{actionData.formErrors.tagline}</p>
            )}
          <InputPair
            label="URL"
            description="천연물질의 웹사이트 URL을 입력하세요"
            id="url"
            name="url"
            required
            type="url"
            placeholder="https://example.com"
          />
          {actionData &&
            "formErrors" in actionData &&
            actionData?.formErrors?.url && (
              <p className="text-red-500">{actionData.formErrors.url}</p>
            )}
          <InputPair
            textArea
            label="설명"
            description="천연물질에 대한 상세한 설명을 입력하세요"
            id="description"
            name="description"
            required
            type="text"
            placeholder="천연물질의 기능, 특징, 장점 등을 자세히 설명해주세요"
          />
          {actionData &&
            "formErrors" in actionData &&
            actionData?.formErrors?.description && (
              <p className="text-red-500">
                {actionData.formErrors.description}
              </p>
            )}
          <InputPair
            textArea
            label="작동 방식"
            description="천연물질의 사용 방법이나 작동 원리를 설명하세요"
            id="how_it_works"
            name="how_it_works"
            required
            type="text"
            placeholder="천연물질을 어떻게 사용하는지, 어떤 방식으로 작동하는지 설명해주세요"
          />
          {actionData &&
            "formErrors" in actionData &&
            actionData?.formErrors?.how_it_works && (
              <p className="text-red-500">
                {actionData.formErrors.how_it_works}
              </p>
            )}
          <SelectPair
            label="카테고리"
            description="천연물질의 카테고리를 선택하세요"
            name="category"
            required
            placeholder="카테고리 선택"
            options={loaderData.categories.map((category) => ({
              label: category.name,
              value: category.category_id.toString(),
            }))}
          />
          {actionData &&
            "formErrors" in actionData &&
            actionData?.formErrors?.category && (
              <p className="text-red-500">{actionData.formErrors.category}</p>
            )}
          <Button type="submit" className="w-full" size="lg">
            천연물질 등록
          </Button>
        </div>
        <div className="flex flex-col space-y-2">
          <div className="size-40 overflow-hidden rounded-xl bg-gray-100 shadow-xl">
            {picture ? (
              <img src={picture} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <Label className="flex flex-col gap-1">
            천연물질 이미지
            <small className="text-muted-foreground">
              천연물질의 대표 이미지를 업로드하세요
            </small>
          </Label>
          <Input
            type="file"
            className="w-1/2"
            onChange={onChange}
            required
            name="picture"
          />
          <div className="test-xs flex flex-col">
            <span className="text-muted-foreground">권장 크기: 128x128px</span>
            <span className="text-muted-foreground">허용 형식: PNG, JPEG</span>
            <span className="text-muted-foreground">최대 파일 크기: 1MB</span>
          </div>
        </div>
      </Form>
    </div>
  );
}
