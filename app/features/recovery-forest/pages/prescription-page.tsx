import { Link, redirect } from "react-router";

import type { Route } from "./+types/prescription-page";

import { makeRecoveryServiceClient } from "~/lib/supabase.server";

import {
  INTENSITY_LABELS,
  type PrescriptionResponse,
} from "../schemas/prescription.schema";
import { WELLNESS_AXIS_LABELS } from "../schemas/wellness.schema";
import { getJourneyByToken } from "../services/journey.repository";
import {
  getCitations,
  getPrescriptionByJourneyId,
  rowToPrescriptionResponse,
  type PrescribedPlace,
} from "../services/prescription.repository";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "나의 산림치유 처방전 · 회복의 숲" }];
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

  const row = await getPrescriptionByJourneyId(client, journey.id);
  if (!row) {
    const pending: PrescriptionResponse = {
      journey_token: token,
      status: journey.status === "failed" ? "failed" : "pending",
      target_outcome: [],
      citations: [],
      last_error: journey.last_error,
    };
    return pending;
  }

  let place: PrescribedPlace | null = null;
  if (row.forest_place_id) {
    const { data } = await client
      .from("forest_places")
      .select("id, name, type, region")
      .eq("id", row.forest_place_id)
      .maybeSingle();
    place = (data as PrescribedPlace | null) ?? null;
  }
  const citations = await getCitations(client, row.id);
  return rowToPrescriptionResponse(row, token, { place, citations });
}

export default function PrescriptionPage({ loaderData }: Route.ComponentProps) {
  const data = loaderData as unknown as PrescriptionResponse;

  if (data.status === "pending") {
    return (
      <Centered
        title="처방을 준비하고 있어요"
        body="자가보고와 산림 데이터를 바탕으로 맞춤 처방을 만드는 중입니다. 잠시만 기다려주세요."
      />
    );
  }
  if (data.status === "failed") {
    return (
      <Centered
        title="처방을 만들지 못했어요"
        body={data.last_error ?? "잠시 후 다시 시도해주세요."}
      />
    );
  }

  const plan = data.action_plan;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-emerald-700">
          나의 산림치유 처방전
        </span>
        <h1 className="text-3xl font-bold">
          {data.place?.name ?? plan?.place_name ?? "맞춤 처방"}
        </h1>
        {data.ai_summary ? (
          <p className="text-gray-600">{data.ai_summary}</p>
        ) : null}
      </header>

      {plan ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
          <h2 className="text-lg font-bold">행동 계획</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Info label="방문 시점" value={plan.visit_window} />
            <Info label="권장 시간" value={`${plan.duration_min}분`} />
            <Info label="강도" value={INTENSITY_LABELS[plan.intensity]} />
            {data.place ? <Info label="지역" value={data.place.region} /> : null}
          </dl>
          <ol className="flex flex-col gap-2">
            {plan.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-gray-800">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {data.target_outcome.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold">기대하는 변화 (가설)</h2>
          <ul className="flex flex-col gap-2 text-sm text-gray-800">
            {data.target_outcome.map((t) => (
              <li key={t.axis} className="flex items-center gap-2">
                <span className="font-semibold">
                  {WELLNESS_AXIS_LABELS[t.axis]}
                </span>
                <span className="text-gray-500">
                  {t.direction === "increase" ? "↑" : "↓"} 약 {t.expected_delta}점
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400">
            방문 후 자가보고와 비교해 이 가설의 적중 여부를 확인합니다.
          </p>
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
                {c.relevance_note ? (
                  <span className="block text-xs text-gray-500">
                    {c.relevance_note}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.caution ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {data.caution}
        </p>
      ) : null}

      <Link
        to={`/journey/${data.journey_token}/post-survey`}
        className="flex h-14 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-700"
      >
        다녀왔어요 · 사후 자가보고 하기
      </Link>

      <p className="text-center text-xs text-gray-400">
        본 처방은 자가보고 기반 안내이며 의학적 진단이 아닙니다.
      </p>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-900">{value}</dd>
    </div>
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
