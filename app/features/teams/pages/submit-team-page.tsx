import type { Route } from "./+types/submit-team-page";

import { Form, redirect } from "react-router";
import { z } from "zod";

import { Hero } from "~/core/components/hero";
import InputPair from "~/core/components/input-pair";
import SelectPair from "~/core/components/select-pair";
import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import { createTeam } from "~/features/teams/mutations";
import { getLoggedInUserId } from "~/features/users/queries";

import { TEAM_POSITIONS } from "../constants";

export const meta: Route.MetaFunction = () => [
  { title: "Create Team | Evidence Base" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  await getLoggedInUserId(client);
};

export const formSchema = z.object({
  name: z.string().min(1).max(20),
  specialty: z.string().min(1).max(20),
  size: z.coerce.number().min(1).max(100),
  cost: z.coerce.number().min(1).max(1000000),
  target: z.string().min(1).max(200),
  description: z.string().min(1).max(200),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const { success, data, error } = formSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!success) {
    return { fieldErrors: error.flatten().fieldErrors };
  }
  const { team_id } = await createTeam(client, userId, {
    ...data,
  });
  return redirect(`/teams/${team_id}`);
};

export default function SubmitTeamPage({ actionData }: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <Hero title="전문가 그룹 등록" subtitle="전문가 그룹을 등록하세요." />
      <Form
        className="mx-auto flex max-w-screen-2xl flex-col items-center gap-10"
        method="post"
      >
        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-3">
          <InputPair
            label="전문가 그룹명"
            description="(20 characters max)"
            placeholder="i.e 좋은습관"
            name="name"
            maxLength={20}
            type="text"
            id="name"
            required
          />
          {actionData && "fieldErrors" in actionData && (
            <p className="text-red-500">{actionData.fieldErrors.name}</p>
          )}

          <SelectPair
            label="전문 영역"
            description="전문 영역을 선택하세요"
            name="specialty"
            required
            placeholder="전문 영역을 선택하세요"
            options={TEAM_POSITIONS}
          />
          {actionData && "fieldErrors" in actionData && (
            <p className="text-red-500">{actionData.fieldErrors.specialty}</p>
          )}
          <InputPair
            label="팀 최대 인원 수"
            description="(1-100)"
            name="size"
            max={100}
            min={1}
            type="number"
            id="size"
            required
          />
          {actionData && "fieldErrors" in actionData && (
            <p className="text-red-500">{actionData.fieldErrors.size}</p>
          )}
          <InputPair
            label="예상 비용 / 시간"
            description="(원)"
            name="cost"
            type="text"
            id="cost"
            required
          />
          {actionData && "fieldErrors" in actionData && (
            <p className="text-red-500">{actionData.fieldErrors.cost}</p>
          )}
          <InputPair
            label="적합한 대상"
            placeholder="노인, 암경험자"
            description="(콤마로 구분)"
            name="target"
            type="text"
            id="target"
            required
          />
          {actionData && "fieldErrors" in actionData && (
            <p className="text-red-500">{actionData.fieldErrors.target}</p>
          )}
          <InputPair
            label="전문가 그룹 소개"
            description="(200자 이내)"
            placeholder="i.e 좋은습관은 좋은 습관을 만드는 팀입니다."
            name="description"
            maxLength={200}
            type="text"
            id="description"
            required
            textArea
          />
          {actionData && "fieldErrors" in actionData && (
            <p className="text-red-500">{actionData.fieldErrors.description}</p>
          )}
        </div>
        <Button type="submit" className="w-full max-w-sm font-bold" size="lg">
          팀 만들기
        </Button>
      </Form>
    </div>
  );
}
