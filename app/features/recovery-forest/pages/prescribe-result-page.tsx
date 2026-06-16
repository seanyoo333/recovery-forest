import {
  BookmarkPlus,
  Leaf,
  MapPin,
  RotateCcw,
  Route as RouteIcon,
  Scale,
  Utensils,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import type { Route } from "./+types/prescribe-result-page";

import { ForestRankCard } from "../components/forest-rank-card";
import { KpomsbRadar } from "../components/kpomsb-radar";
import { ProvenanceBadge } from "../components/provenance-badge";
import { RecoveryPoints } from "../components/recovery-points";
import { VisitTimeline } from "../components/visit-timeline";
import { USER_TYPE_LABELS } from "../schemas/prescribe-input.schema";
import {
  loadPrescription,
  type PrescriptionData,
} from "../services/prescription-loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "AI 맞춤 처방 · 회복의 숲" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  return loadPrescription(request);
}

export default function PrescribeResultPage({
  loaderData,
}: Route.ComponentProps) {
  const { output, kpomsb, overlay } = loaderData as PrescriptionData;

  const location = useLocation();
  const top = output.top_pick_detail;
  const topRank = output.ranking[0];
  const rest = output.ranking.slice(1);
  const program = top.recommended_program;

  return (
    <div className="bg-gradient-to-b from-emerald-50/70 to-white">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 pt-12 pb-4">
        {/* 헤더: AI 상태 해석 히어로 */}
        <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_200px]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                  {USER_TYPE_LABELS[output.user_summary.user_type]}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                  목표 · {overlay.goal}
                </span>
                {overlay.label ? (
                  <span className="inline-flex items-center gap-1 text-gray-400">
                    <MapPin className="size-3.5" aria-hidden />
                    {overlay.label}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <ProvenanceBadge kind="ai" label="AI가 읽은 지금의 상태" />
                {overlay.note ? (
                  <blockquote className="border-l-2 border-indigo-200 pl-3 text-sm text-gray-500 italic">
                    “{overlay.note}”
                  </blockquote>
                ) : null}
                <p className="text-xl leading-relaxed font-semibold text-gray-900">
                  {output.user_summary.ai_state_reading}
                </p>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[220px]">
              <KpomsbRadar scores={kpomsb} />
              <p className="text-center text-xs text-gray-400">
                K-POMS-B 기분 프로필
              </p>
            </div>
          </div>
        </section>

        {/* 1위 상세 — 처방전(타임라인 여정형) */}
        <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-lg shadow-emerald-950/10">
          {/* B-1 숲 대표 사진(데모 플레이스홀더) — "가고 싶다"의 핵심 */}
          <header className="relative flex min-h-[240px] items-end overflow-hidden p-6">
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(/recovery-forest.png)" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/45 to-emerald-950/5"
            />
            <div className="relative flex w-full flex-col gap-3">
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold tracking-wide text-emerald-100">
                    오늘의 처방 · 1순위
                  </span>
                  <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                    <Leaf className="size-6 text-emerald-300" aria-hidden />
                    {top.forest_name}
                  </h2>
                </div>
                {/* B-3 점수 → 매칭률 */}
                <div className="flex shrink-0 flex-col items-center rounded-2xl bg-white/15 px-4 py-2 backdrop-blur-sm">
                  <span className="text-3xl leading-none font-bold tabular-nums text-white">
                    {Math.round(topRank.engine_score)}%
                  </span>
                  <span className="mt-1 text-[10px] text-emerald-50/90">
                    나와 맞아요
                  </span>
                </div>
              </div>
              <p className="text-sm text-emerald-50/90">
                자연이 주는 치유로, 오늘의 나를 회복하세요
              </p>
            </div>
          </header>

          <div className="flex flex-col gap-6 p-6">
            {/* B-4 트레이드오프 — 약점도 솔직히 */}
            {top.tradeoff ? (
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <Scale className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                <p className="text-sm leading-relaxed text-amber-900">
                  {top.tradeoff}
                </p>
              </div>
            ) : null}

            {/* B-2 오늘의 회복 포인트 4칸 */}
            {top.recovery_points && top.recovery_points.length > 0 ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-semibold text-gray-900">
                  오늘의 회복 포인트
                </h3>
                <RecoveryPoints points={top.recovery_points} />
              </div>
            ) : null}

            {/* 측정 지표 — 근거로 접어두기(A4 유지, 숫자 거부감 완화) */}
            <details className="rounded-2xl border border-gray-100 bg-gray-50/60">
              <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-medium text-gray-600">
                <ProvenanceBadge kind="engine" />
                측정 지표 자세히 보기
              </summary>
              <div className="flex flex-col gap-2 border-t border-gray-100 p-4">
                <div className="flex flex-wrap gap-2 text-sm">
                  <Metric label="수종" value={topRank.engine_breakdown.species} />
                  <Metric
                    label="거리"
                    value={`${topRank.engine_breakdown.distance_km}km`}
                  />
                  <Metric
                    label="피톤치드 잠재력"
                    value={`${topRank.engine_breakdown.phytoncide_index}/100`}
                  />
                  <Metric
                    label="미세먼지"
                    value={`PM2.5 ${topRank.engine_breakdown.pm25} · ${topRank.engine_breakdown.air_label}`}
                  />
                </div>
                {topRank.engine_breakdown.pm25_source ? (
                  <p className="text-[11px] text-gray-400">
                    미세먼지 출처: {topRank.engine_breakdown.pm25_source} · 현재 실측
                  </p>
                ) : null}
              </div>
            </details>

            {/* AI 맞춤 실천 계획 */}
            <div className="flex flex-col gap-3 rounded-2xl bg-indigo-50/60 p-5">
              <ProvenanceBadge kind="ai" label="AI 맞춤 실천 계획" />
              <ul className="flex flex-col gap-2.5">
                {top.ai_personal_plan.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-gray-800">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* 방문 동선 타임라인 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">방문 동선</h3>
                <span className="text-sm text-gray-400">{overlay.date}</span>
              </div>
              <VisitTimeline steps={top.itinerary.steps} />
            </div>

            {/* 프로그램 + 맛집 */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-400">
                  추천 프로그램
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-medium text-gray-900">
                  {program.title}
                  {program.is_example ? (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      예시
                    </span>
                  ) : null}
                </p>
              </div>
              {top.nearby_food.length > 0 ? (
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                    <Utensils className="size-3.5" aria-hidden />
                    주변 맛집
                  </p>
                  {top.nearby_food.map((f) => (
                    <p
                      key={f.name}
                      className="mt-1 font-medium text-gray-900"
                    >
                      {f.name}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        {f.category} · ★{f.rating}
                      </span>
                    </p>
                  ))}
                </div>
              ) : null}
            </div>

            {/* AI 노트 */}
            <div className="flex flex-col gap-2 rounded-2xl border border-indigo-100 bg-white p-4">
              <ProvenanceBadge kind="ai" label="근거와 권장 시점" />
              <p className="text-sm leading-relaxed text-gray-700">
                {top.ai_note}
              </p>
            </div>

            {/* 여행 일정표 화면으로(동일 처방) */}
            <Link
              to={{ pathname: "/prescribe/itinerary", search: location.search }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:brightness-105"
            >
              <RouteIcon className="size-5" aria-hidden />이 처방으로 여행 일정 보기
            </Link>
          </div>
        </section>

        {/* 2·3위 — 각 카드를 펼치면 1위처럼 일정·실천을 확인. 기본은 접힘. */}
        {rest.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              다른 선택지{" "}
              <span className="text-sm font-normal text-gray-400">
                (눌러서 일정 펼치기)
              </span>
            </h2>
            {rest.map((item) => (
              <ForestRankCard key={item.rank} item={item} />
            ))}
          </section>
        ) : null}

        {/* 안내 + 다시 입력 */}
        <section className="flex flex-col gap-4">
          <ul className="flex flex-col gap-1 rounded-2xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
            {output.disclaimers.map((d, i) => (
              <li key={i}>· {d}</li>
            ))}
          </ul>
          <Link
            to="/prescribe"
            className="inline-flex h-12 w-fit items-center gap-2 rounded-full border border-emerald-600 px-6 text-emerald-700 transition hover:bg-emerald-50"
          >
            <RotateCcw className="size-4" aria-hidden />
            조건 바꿔 다시 받기
          </Link>
        </section>
      </main>

      {/* 스크롤해도 늘 보이는 저장 버튼 */}
      <div className="pointer-events-none sticky bottom-0 z-20 flex justify-center px-6 pb-5">
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-emerald-950/25 transition hover:bg-emerald-700 hover:brightness-105"
        >
          <BookmarkPlus className="size-5" aria-hidden />
          {top.cta}
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/50 px-3 py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </span>
  );
}
