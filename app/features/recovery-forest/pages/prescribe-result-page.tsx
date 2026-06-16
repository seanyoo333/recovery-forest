import {
  BookmarkPlus,
  Bus,
  Camera,
  Leaf,
  MapPin,
  Mountain,
  RotateCcw,
  Utensils,
} from "lucide-react";
import { Link } from "react-router";

import type { Route } from "./+types/prescribe-result-page";

import { ForestRankCard } from "../components/forest-rank-card";
import { ForestStrengths } from "../components/forest-strengths";
import { KpomsbRadar } from "../components/kpomsb-radar";
import { ProvenanceBadge } from "../components/provenance-badge";
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

  const top = output.top_pick_detail;
  const topRank = output.ranking[0];
  const b = topRank.engine_breakdown;
  const rest = output.ranking.slice(1);

  return (
    <div className="bg-gradient-to-b from-emerald-50/70 to-white">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pt-8 pb-4">
        {/* ① 헤더 — 추천 숲 + 사진 + 종합점수 + 난이도 */}
        <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-lg shadow-emerald-950/10">
          <header className="relative flex min-h-[260px] items-end overflow-hidden p-6">
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
              <span className="text-xs font-bold tracking-wide text-emerald-100">
                오늘의 처방 · 1순위
              </span>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                <Leaf className="size-6 text-emerald-300" aria-hidden />
                {top.forest_name}
              </h1>
              <p className="text-sm text-emerald-50/90">
                자연이 주는 치유로, 오늘의 나를 회복하세요
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-baseline gap-1 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-xl font-bold tabular-nums text-white">
                    {Math.round(topRank.engine_score)}
                  </span>
                  <span className="text-xs text-emerald-50/90">점 · 종합</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs text-emerald-50/90 backdrop-blur-sm">
                  <Mountain className="size-3.5" aria-hidden />
                  난이도 쉬움
                  <span className="text-emerald-100/60">(예시)</span>
                </span>
              </div>
            </div>
          </header>
        </section>

        {/* ② 왜 당신께 이 숲인가 — AI 상태해석 + K-POMS-B 레이더 */}
        <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            왜 당신께 이 숲인가
          </h2>
          <div className="grid items-center gap-5 sm:grid-cols-[1fr_180px]">
            <div className="flex flex-col gap-2">
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
              <ProvenanceBadge kind="ai" label="AI가 읽은 지금의 상태" />
              {overlay.note ? (
                <blockquote className="border-l-2 border-indigo-200 pl-3 text-sm text-gray-500 italic">
                  “{overlay.note}”
                </blockquote>
              ) : null}
              <p className="text-lg leading-relaxed font-semibold text-gray-900">
                {output.user_summary.ai_state_reading}
              </p>
            </div>
            <div className="mx-auto w-full max-w-[200px]">
              <KpomsbRadar scores={kpomsb} />
              <p className="text-center text-xs text-gray-400">
                K-POMS-B 기분 프로필
              </p>
            </div>
          </div>
        </section>

        {/* ③ 이 숲의 강점 — 점수 분해(피톤치드 주인공) */}
        <section className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">이 숲의 강점</h2>
            <ProvenanceBadge kind="engine" />
          </div>
          <ForestStrengths
            b={b}
            engineScore={topRank.engine_score}
            tradeoff={top.tradeoff}
          />
          {b.pm25_source ? (
            <p className="text-[11px] text-gray-400">
              미세먼지 출처: {b.pm25_source} · 현재 실측
            </p>
          ) : null}
        </section>

        {/* ④ 오늘 이렇게 하세요 — AI 맞춤 행동 */}
        <section className="flex flex-col gap-3 rounded-3xl bg-indigo-50/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              오늘 이렇게 하세요
            </h2>
            <ProvenanceBadge kind="ai" />
          </div>
          <ul className="flex flex-col gap-2.5">
            {top.ai_personal_plan.map((step, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-sm leading-relaxed text-gray-800"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {top.ai_note}
          </p>
        </section>

        {/* ⑤ 여행 일정 — 타임라인 */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">여행 일정</h2>
            <span className="text-sm text-gray-400">{overlay.date}</span>
          </div>
          <VisitTimeline steps={top.itinerary.steps} />
        </section>

        {/* ⑥ 주변 — 먹거리·볼거리·교통 (샘플 + 예시 배지) */}
        <section className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">주변 정보</h2>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
              예시 · 연동 예정
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <Utensils className="size-3.5" aria-hidden />
                먹거리
              </p>
              {top.nearby_food.map((f) => (
                <p key={f.name} className="text-sm text-gray-800">
                  {f.name}{" "}
                  <span className="text-gray-400">
                    {f.category} · ★{f.rating}
                  </span>
                </p>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <Camera className="size-3.5" aria-hidden />
                볼거리
              </p>
              <p className="text-sm text-gray-800">출렁다리 · 자연휴양림 산책로</p>
            </div>
          </div>
          <p className="flex items-center gap-1.5 border-t border-gray-100 pt-3 text-sm text-gray-600">
            <Bus className="size-4 text-emerald-600" aria-hidden />
            교통: KTX + 버스 약 3시간 · 추천 프로그램 {top.recommended_program.title}
          </p>
        </section>

        {/* ⑦ 다른 선택지 2·3위 */}
        {rest.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              다른 선택지{" "}
              <span className="text-sm font-normal text-gray-400">
                (눌러서 펼치기)
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
