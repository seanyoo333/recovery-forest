import { ChevronDown } from "lucide-react";

import type { RankingItem } from "../schemas/prescribe-output.schema";
import { forestImage } from "./forest-image";
import { ProvenanceBadge } from "./provenance-badge";
import { VisitTimeline } from "./visit-timeline";

/**
 * 2·3위 카드 — 기본은 요약, 펼치면 1위처럼 일정·실천을 확인.
 * engine_* 는 엔진 계산, ai_* 는 AI 추론으로 표기.
 */
export function ForestRankCard({ item }: { item: RankingItem }) {
  const b = item.engine_breakdown;
  const d = item.detail;

  return (
    <details className="group rounded-2xl border border-gray-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-gray-400">
            {item.rank}순위
          </span>
          <h3 className="text-lg font-bold text-gray-900">{item.forest_name}</h3>
          <p className="text-sm text-gray-500">
            {b.species} · {b.distance_km}km · 미세먼지 {b.air_label}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold tabular-nums text-emerald-600">
              {item.engine_score}
            </span>
            <span className="text-[10px] text-gray-400">종합 추천 점수</span>
          </div>
          <ChevronDown
            className="mt-1 size-5 shrink-0 text-gray-400 transition group-open:rotate-180"
            aria-hidden
          />
        </div>
      </summary>

      <div className="flex flex-col gap-4 border-t border-gray-100 p-5">
        <div className="flex gap-2">
          <ProvenanceBadge kind="ai" className="mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed text-gray-700">
            {item.ai_reason}
          </p>
        </div>

        {d ? (
          <>
            <div className="flex flex-col gap-2 rounded-2xl bg-indigo-50/60 p-4">
              <ProvenanceBadge kind="ai" label="AI 맞춤 실천" />
              <ul className="flex flex-col gap-2">
                {d.ai_personal_plan.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm leading-relaxed text-gray-800"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">
                  방문 동선
                </h4>
                <span className="text-xs text-gray-400">
                  {d.itinerary.date}
                </span>
              </div>
              <VisitTimeline
                steps={d.itinerary.steps}
                forestImage={forestImage(b.species)}
              />
            </div>

            <div className="rounded-xl border border-gray-200 p-3 text-sm">
              <span className="text-xs font-semibold text-gray-400">
                추천 프로그램{" "}
              </span>
              <span className="font-medium text-gray-900">
                {d.recommended_program.title}
              </span>
              {d.recommended_program.is_example ? (
                <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                  예시
                </span>
              ) : null}
            </div>

            <p className="text-sm leading-relaxed text-gray-600">{d.ai_note}</p>
          </>
        ) : null}
      </div>
    </details>
  );
}
