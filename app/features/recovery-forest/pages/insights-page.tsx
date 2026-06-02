import { Link } from "react-router";

import type { Route } from "./+types/insights-page";

import { makeRecoveryServiceClient } from "~/lib/supabase.server";

import {
  WELLNESS_AXES,
  WELLNESS_AXIS_IMPROVEMENT,
  WELLNESS_AXIS_LABELS,
  type WellnessAxis,
} from "../schemas/wellness.schema";
import {
  aggregateHitRate,
  averageDeltaByAxis,
} from "../services/reflection.service";
import { getCompletedReportSignals } from "../services/report.repository";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "참가자 회복 데이터 · 회복의 숲" }];
}

export async function loader(_args: Route.LoaderArgs) {
  const client = makeRecoveryServiceClient();
  const signals = await getCompletedReportSignals(client);
  const hit = aggregateHitRate(signals.hitMiss);
  const avgDelta = averageDeltaByAxis(signals.deltas);
  return {
    count: signals.count,
    hitRate: hit.rate,
    hits: hit.hits,
    total: hit.total,
    avgDelta,
  };
}

type LoaderData = {
  count: number;
  hitRate: number | null;
  hits: number;
  total: number;
  avgDelta: Record<WellnessAxis, number>;
};

export default function InsightsPage({ loaderData }: Route.ComponentProps) {
  const data = loaderData as LoaderData;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-emerald-700">
          Evidence Engine
        </span>
        <h1 className="text-3xl font-bold">쌓일수록 정확해지는 처방</h1>
        <p className="text-gray-600">
          참가자의 사전·사후 자가보고가 쌓이면, 처방 가설의 적중률로 처방 품질을
          데이터로 입증합니다.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="완료된 여정" value={`${data.count}건`} />
        <Stat
          label="처방 가설 적중률"
          value={
            data.hitRate != null
              ? `${Math.round(data.hitRate * 100)}% (${data.hits}/${data.total})`
              : "—"
          }
          highlight
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold">축별 평균 변화 (자가보고)</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {WELLNESS_AXES.map((axis) => {
            const v = data.avgDelta[axis];
            const improving =
              WELLNESS_AXIS_IMPROVEMENT[axis] === "increase" ? v > 0 : v < 0;
            return (
              <li key={axis} className="flex items-center justify-between">
                <span className="font-medium">
                  {WELLNESS_AXIS_LABELS[axis]}
                </span>
                <span
                  className={
                    improving ? "text-emerald-700" : "text-gray-400"
                  }
                >
                  평균 {v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-xs text-gray-400">
        본 수치는 참가자 자가보고를 집계한 것으로 의학적 효과를 단정하지
        않습니다. 표본이 커질수록 처방 가설의 정확도를 검증할 수 있습니다.
      </p>

      <Link
        to="/journey/start"
        className="flex h-12 items-center justify-center rounded-full bg-emerald-600 px-6 font-semibold text-white"
      >
        나도 여정 시작하기
      </Link>
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl border p-5 ${
        highlight ? "border-emerald-200 bg-emerald-50/60" : "border-gray-200"
      }`}
    >
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  );
}
