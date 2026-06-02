import { Link } from "react-router";

import type { Route } from "./+types/results-page";

import { makeRecoveryServerClient } from "~/lib/supabase.server";

import { ResultCard } from "../components/result-card";
import { getSessionById, rowToResponse } from "../services/recommendation.repository";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "오늘의 회복 숲 TOP 5 · 회복의 숲" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const sessionId = params.sessionId;
  if (!sessionId) {
    throw new Response("session id missing", { status: 400 });
  }
  const [client, headers] = makeRecoveryServerClient(request);
  const row = await getSessionById(client, sessionId);
  if (!row) {
    throw new Response("session not found", { status: 404 });
  }
  return new Response(JSON.stringify(rowToResponse(row)), {
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(headers.entries()),
    },
  });
}

type LoaderData = ReturnType<typeof rowToResponse>;

export default function ResultsPage({ loaderData }: Route.ComponentProps) {
  const data = loaderData as unknown as LoaderData;

  if (data.status === "pending") {
    return <PendingState />;
  }

  if (data.status === "failed") {
    return <FailedState message={data.last_error ?? undefined} />;
  }

  if (!data.results || data.results.length === 0) {
    return <EmptyState />;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">오늘의 회복 숲 추천 TOP {data.results.length}</h1>
        {data.ai_summary ? (
          <p className="text-gray-600">{data.ai_summary}</p>
        ) : null}
      </header>

      <ol className="flex flex-col gap-5">
        {data.results.map((result) => (
          <li key={result.forest_id}>
            <ResultCard result={result} />
          </li>
        ))}
      </ol>

      <div className="flex gap-3">
        <Link
          to="/recommend"
          className="inline-flex h-12 items-center justify-center rounded-full border border-emerald-600 px-6 text-emerald-700"
        >
          다시 추천 받기
        </Link>
      </div>

      <footer className="text-center text-xs text-gray-500">
        데이터 출처: 산림청 · 기상청 · 에어코리아 · 4곳 치유의숲 피톤치드 실측
      </footer>
    </main>
  );
}

function PendingState() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">오늘의 숲을 분석하고 있어요</h1>
      <p className="text-gray-600">
        5종 공공데이터와 AI가 함께 살펴보는 중입니다. 잠시만 기다려주세요.
      </p>
    </main>
  );
}

function FailedState({ message }: { message?: string }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">결과를 가져오지 못했어요</h1>
      <p className="text-gray-600">{message ?? "잠시 후 다시 시도해주세요."}</p>
      <Link
        to="/recommend"
        className="mx-auto inline-flex h-12 items-center rounded-full bg-emerald-600 px-6 text-white"
      >
        처음으로 돌아가기
      </Link>
    </main>
  );
}

function EmptyState() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">조건에 맞는 숲을 찾지 못했어요</h1>
      <p className="text-gray-600">
        이동 시간이나 우선순위를 조정해서 다시 시도해보세요.
      </p>
      <Link
        to="/recommend"
        className="mx-auto inline-flex h-12 items-center rounded-full bg-emerald-600 px-6 text-white"
      >
        조건 바꿔서 다시 추천 받기
      </Link>
    </main>
  );
}
