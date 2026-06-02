import { Link, redirect } from "react-router";

import type { Route } from "./+types/report-page";

import { makeRecoveryServiceClient } from "~/lib/supabase.server";

import type { ReportResponse } from "../schemas/report.schema";
import { WELLNESS_AXIS_LABELS } from "../schemas/wellness.schema";
import { getJourneyByToken } from "../services/journey.repository";
import {
  getReportByJourneyId,
  rowToReportResponse,
} from "../services/report.repository";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "나의 회복 변화 리포트 · 회복의 숲" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const token = params.token;
  if (!token) throw new Response("token missing", { status: 400 });
  const client = makeRecoveryServiceClient();
  const journey = await getJourneyByToken(client, token);
  if (!journey) throw new Response("journey not found", { status: 404 });

  const row = await getReportByJourneyId(client, journey.id);
  if (!row) {
    if (journey.status === "failed") {
      const failed: ReportResponse = {
        journey_token: token,
        status: "failed",
        deltas: [],
        hit_miss: [],
        citations: [],
        last_error: journey.last_error,
      };
      return failed;
    }
    if (journey.status !== "reported" && journey.status !== "post_surveyed") {
      throw redirect(`/journey/${token}/post-survey`);
    }
    const pending: ReportResponse = {
      journey_token: token,
      status: "pending",
      deltas: [],
      hit_miss: [],
      citations: [],
      last_error: journey.last_error,
    };
    return pending;
  }
  return rowToReportResponse(row, token);
}

export default function ReportPage({ loaderData }: Route.ComponentProps) {
  const data = loaderData as unknown as ReportResponse;

  if (data.status === "pending") {
    return (
      <Centered
        title="리포트를 만들고 있어요"
        body="사전·사후 자가보고를 비교하는 중입니다. 잠시만 기다려주세요."
      />
    );
  }
  if (data.status === "failed") {
    return (
      <Centered
        title="리포트를 만들지 못했어요"
        body={data.last_error ?? "잠시 후 다시 시도해주세요."}
      />
    );
  }

  const hitCount = data.hit_miss.filter((h) => h.hit).length;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-emerald-700">
          나의 회복 변화 리포트
        </span>
        <h1 className="text-3xl font-bold">방문 전후, 이렇게 달라졌어요</h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {data.deltas.map((d) => (
          <div
            key={d.axis}
            className={`flex flex-col gap-1 rounded-2xl border p-5 ${
              d.improved
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-gray-200"
            }`}
          >
            <span className="text-sm text-gray-500">
              {WELLNESS_AXIS_LABELS[d.axis]}
            </span>
            <span className="text-2xl font-bold text-gray-900">
              {d.pre} → {d.post}
            </span>
            <span
              className={`text-sm font-semibold ${
                d.improved ? "text-emerald-700" : "text-gray-400"
              }`}
            >
              {d.delta > 0 ? `+${d.delta}` : d.delta}
              {d.improved ? " · 개선" : " · 변화 적음"}
            </span>
          </div>
        ))}
      </section>

      {data.hit_miss.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold">
            처방 가설 적중 {hitCount}/{data.hit_miss.length}
            {data.hit_rate != null
              ? ` (${Math.round(data.hit_rate * 100)}%)`
              : ""}
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-gray-800">
            {data.hit_miss.map((h) => (
              <li key={h.axis} className="flex items-center justify-between">
                <span className="font-medium">
                  {WELLNESS_AXIS_LABELS[h.axis]}
                </span>
                <span className={h.hit ? "text-emerald-700" : "text-gray-400"}>
                  목표 {h.target_delta > 0 ? `+${h.target_delta}` : h.target_delta}{" "}
                  / 실제 {h.actual_delta > 0 ? `+${h.actual_delta}` : h.actual_delta}{" "}
                  {h.hit ? "✓" : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.narrative ? (
        <section className="whitespace-pre-line rounded-2xl border border-gray-200 p-6 text-sm leading-relaxed text-gray-700">
          {data.narrative}
        </section>
      ) : null}

      {data.citations.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold">근거</h2>
          <ul className="flex flex-col gap-2 text-sm text-gray-700">
            {data.citations.map((c, i) => (
              <li key={i}>
                <span className="font-medium">{c.title}</span>
                {c.year ? <span className="text-gray-400"> ({c.year})</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link
        to="/journey/insights"
        className="flex h-12 items-center justify-center rounded-full border border-emerald-600 px-6 text-emerald-700"
      >
        전체 참가자 데이터 보기
      </Link>
    </main>
  );
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-gray-600">{body}</p>
    </main>
  );
}
