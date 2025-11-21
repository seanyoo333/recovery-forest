import type { Route } from "./+types/settings-page";

import { Avatar } from "@radix-ui/react-avatar";
import { useRef, useState } from "react";
import { Form } from "react-router";
import { z } from "zod";

import InputPair from "~/core/components/input-pair";
import SelectPair from "~/core/components/select-pair";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";
import { AvatarFallback } from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";

import { updateUser, updateUserAvatar } from "../../../mutations";
import { getLoggedInUserId, getUserById } from "../../../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Settings | wemake" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const user = await getUserById(client, { id: userId });
  return { user };
};

const formSchema = z.object({
  name: z.string().min(3),
  role: z.string(),
  headline: z.string().optional().default(""),
  bio: z.string().optional().default(""),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const avatar = formData.get("avatar");
  if (avatar && avatar instanceof File) {
    if (avatar.size <= 2097152 && avatar.type.startsWith("image/")) {
      const { data, error } = await client.storage
        .from("avatars")
        .upload(`${userId}/${Date.now()}`, avatar, {
          contentType: avatar.type,
          upsert: false,
        });
      if (error) {
        return { formErrors: { avatar: ["Failed to upload avatar"] } };
      }
      const {
        data: { publicUrl },
      } = await client.storage.from("avatars").getPublicUrl(data.path);
      await updateUserAvatar(client, {
        id: userId,
        avatarUrl: publicUrl,
      });
      return {
        avatarSuccess: true,
      };
    } else {
      return { formErrors: { avatar: ["Invalid file size or type"] } };
    }
  } else {
    const { success, error, data } = formSchema.safeParse(
      Object.fromEntries(formData),
    );
    if (!success) {
      return { formErrors: error.flatten().fieldErrors };
    }
    const { name, role, headline, bio } = data;
    await updateUser(client, {
      id: userId,
      name,
      role: role as
        | "healthy"
        | "patient"
        | "caregiver"
        | "doctor"
        | "health_exp"
        | "other",
      headline,
      bio,
    });
    return {
      ok: true,
    };
  }
};

export default function SettingsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [avatar, setAvatar] = useState<string | null>(loaderData.user.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      setAvatar(URL.createObjectURL(file));
    }
  };
  return (
    <div className="space-y-10 p-10 md:space-y-20">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-6 md:gap-40">
        <div className="flex flex-col gap-10 md:col-span-4">
          {actionData?.ok ? (
            <Alert>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                프로필이 성공적으로 업데이트되었습니다.
              </AlertDescription>
            </Alert>
          ) : null}
          <h2 className="text-2xl font-semibold">프로필 수정</h2>
          <Form className="flex flex-col gap-5 md:w-1/2" method="post">
            <InputPair
              label="별명"
              description="자신을 표현하는 별명을 입력해주세요."
              required
              id="name"
              defaultValue={loaderData.user.name ?? ""}
              name="name"
              placeholder="예시) 좋은습관"
            />
            {actionData?.formErrors && "name" in actionData?.formErrors ? (
              <Alert>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {actionData.formErrors?.name?.join(", ")}
                </AlertDescription>
              </Alert>
            ) : null}
            <SelectPair
              label="역할 "
              defaultValue={loaderData.user.role ?? ""}
              description="자신을 표현하는 역할을 선택해주세요."
              name="role"
              placeholder="역할을 선택해주세요."
              options={[
                { label: "비환자", value: "healthy" },
                { label: "환자", value: "patient" },
                { label: "보호자", value: "caregiver" },
                { label: "의사", value: "doctor" },
                { label: "건강 전문가", value: "health_exp" },
                { label: "기타", value: "other" },
              ]}
            />
            {actionData?.formErrors && "role" in actionData?.formErrors ? (
              <Alert>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {actionData.formErrors?.role?.join(", ")}
                </AlertDescription>
              </Alert>
            ) : null}
            <InputPair
              label="삶의 정체성"
              description="자신을 표현하는 가장 중요한 정체성을 소개해 주세요."
              required
              defaultValue={loaderData.user.headline ?? ""}
              id="headline"
              name="headline"
              placeholder="예시) 치유하는 사업가 / Healing Entrepreneur"
              textArea
            />
            {actionData?.formErrors && "headline" in actionData?.formErrors ? (
              <Alert>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {actionData.formErrors?.headline?.join(", ")}
                </AlertDescription>
              </Alert>
            ) : null}
            <InputPair
              label="회복의 여정"
              description="자신의 치유 과정 중 가장 도움이 되었다고 생각하는 경험 세 가지를 공유해 주세요."
              required
              id="bio"
              defaultValue={loaderData.user.bio ?? ""}
              name="bio"
              placeholder="예시) 산 근처로 이사온 것, 금주, 암 대사치료"
              textArea
            />
            {actionData?.formErrors && "bio" in actionData?.formErrors ? (
              <Alert>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {actionData.formErrors?.bio?.join(", ")}
                </AlertDescription>
              </Alert>
            ) : null}
            <Button className="w-full font-bold">프로필 수정</Button>
          </Form>
        </div>
        <Form
          className="flex flex-col gap-5 rounded-lg border p-6 shadow-md md:col-span-2"
          method="post"
          encType="multipart/form-data"
        >
          <Label className="flex flex-col gap-1">
            아바타
            <small className="text-muted-foreground">
              자신을 표현하는 아바타 이미지를 선택해주세요.
            </small>
          </Label>
          <div className="flex flex-col items-center space-y-5">
            <div className="size-40 overflow-hidden rounded-full shadow-xl">
              {avatar ? (
                <img src={avatar} className="h-full w-full object-cover" />
              ) : (
                <Avatar>
                  <AvatarFallback className="text-5xl">
                    {loaderData.user.name?.[0] ?? ""}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={onChange}
              required
              name="avatar"
              accept="image/png,image/jpeg"
            />
            <Button
              type="button"
              variant="outline"
              className="w-1/2"
              onClick={() => fileInputRef.current?.click()}
            >
              파일 선택
            </Button>
            {actionData?.avatarSuccess ? (
              <Alert className="w-full">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  아바타가 성공적으로 업데이트 되었습니다.
                </AlertDescription>
              </Alert>
            ) : null}
            {actionData?.formErrors && "avatar" in actionData?.formErrors ? (
              <Alert className="w-full">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {actionData.formErrors.avatar.join(", ")}
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="flex flex-col items-center text-xs">
              <span className="text-muted-foreground">
                권장 크기: 128x128px
              </span>
              <span className="text-muted-foreground">
                허용 형식: PNG, JPEG
              </span>
              <span className="text-muted-foreground">최대 파일 크기: 1MB</span>
            </div>
            <Button className="w-full font-bold">아바타 수정</Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
