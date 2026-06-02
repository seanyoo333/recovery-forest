import { Form, redirect, useActionData, useNavigation } from "react-router";

import type { Route } from "./+types/post-survey-page";

import { makeRecoveryServiceClient } from "~/lib/supabase.server";

import { WellnessFields } from "../components/wellness-fields";
import { getJourneyByToken } from "../services/journey.repository";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "사후 자가보고 · 회복의 숲" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const token = params.token;
  if (!token) throw new Response("token missing", { status: 400 });
  const client = makeRecoveryServiceClient();
  const journey = await getJourneyByToken(client, token);
  if (!journey) throw new Response("journey not found", { status: 404 });
  if (journey.status === "consented") {
    throw redirect(`/journey/${token}/pre-survey`);
  }
  if (journey.status === "pre_surveyed") {
    throw redirect(`/journey/${token}/prescription`);
  }
  if (journey.status === "reported") {
    throw redirect(`/journey/${token}/report`);
  }
  return { token };
}

type ActionError = { ok: false; error: { code: string; message: string } };

export default function PostSurveyPage({ loaderData }: Route.ComponentProps) {
  const { token } = loaderData as { token: string };
  const navigation = useNavigation();
  const actionData = useActionData() as ActionError | undefined;

  const actionPath = `/api/journey/${token}/post-survey`;
  const isSubmitting =
    navigation.state === "submitting" && navigation.formAction === actionPath;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">다녀오신 뒤, 지금은 어떠세요?</h1>
        <p className="text-gray-600">
          방문 전과 같은 항목을 다시 기록하면 변화를 비교한 리포트를 만들어드려요.
        </p>
      </header>

      {actionData?.ok === false ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionData.error.message}
        </div>
      ) : null}

      <Form method="post" action={actionPath} className="flex flex-col gap-8">
        <WellnessFields />

        <div className="flex flex-col gap-2">
          <label htmlFor="impression" className="text-lg font-semibold">
            한 줄 인상{" "}
            <span className="text-sm font-normal text-gray-400">(선택)</span>
          </label>
          <textarea
            id="impression"
            name="impression"
            rows={3}
            maxLength={200}
            placeholder="다녀온 소감을 자유롭게 적어주세요"
            className="rounded-lg border border-gray-300 p-4 text-base"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-14 rounded-full bg-emerald-600 text-lg font-semibold text-white shadow-lg transition enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "리포트를 만들고 있어요…" : "변화 리포트 받기"}
        </button>
      </Form>
    </main>
  );
}
