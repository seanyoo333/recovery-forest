import { BookmarkPlus, Leaf, MapPin, RotateCcw, Utensils } from "lucide-react";
import { Link } from "react-router";

import type { Route } from "./+types/prescribe-result-page";

import { ForestRankCard } from "../components/forest-rank-card";
import { KpomsbRadar } from "../components/kpomsb-radar";
import { ProvenanceBadge } from "../components/provenance-badge";
import { VisitTimeline } from "../components/visit-timeline";
import {
  COMFORT_INPUT_DEMO,
  EXPLORER_INPUT_DEMO,
  pickDemoOutput,
} from "../fixtures/prescription-demo";
import {
  USER_TYPE_LABELS,
  type KpomsbScores,
  type UserType,
} from "../schemas/prescribe-input.schema";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "AI 맞춤 처방 · 회복의 숲" }];
}

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const userType: UserType =
    url.searchParams.get("user_type") === "explorer" ? "explorer" : "comfort";

  const output = pickDemoOutput(userType);
  const input =
    userType === "explorer" ? EXPLORER_INPUT_DEMO : COMFORT_INPUT_DEMO;

  // 입력에서 받은 표시값으로 살짝 덮어 개인화 느낌(픽스처 데모).
  const label = url.searchParams.get("loc_label") ?? input.location.label ?? "";
  const date = url.searchParams.get("visit_date") ?? input.visit_plan.date;
  const goal = url.searchParams.get("health_goal") ?? output.user_summary.health_goal;
  const note = (url.searchParams.get("note") ?? "").trim();

  return {
    output,
    kpomsb: input.kpomsb_pre,
    overlay: { label, date, goal, note },
  };
}

export default function PrescribeResultPage({
  loaderData,
}: Route.ComponentProps) {
  const { output, kpomsb, overlay } = loaderData as {
    output: ReturnType<typeof pickDemoOutput>;
    kpomsb: KpomsbScores;
    overlay: { label: string; date: string; goal: string; note: string };
  };

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
          {/* 숲 사진을 헤더 배경으로 — 몰입감 */}
          <header className="relative flex min-h-[160px] items-end overflow-hidden p-6">
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(/recovery-forest.png)" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/40 to-emerald-950/10"
            />
            <div className="relative flex w-full items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold tracking-wide text-emerald-100">
                  오늘의 처방 · 1순위
                </span>
                <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                  <Leaf className="size-6 text-emerald-300" aria-hidden />
                  {top.forest_name}
                </h2>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-bold tabular-nums text-white">
                  {topRank.engine_score}
                </span>
                <span className="text-[10px] text-emerald-100/80">
                  엔진 종합점수
                </span>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-6 p-6">
            {/* 엔진 계산 지표 */}
            <div className="flex flex-col gap-2">
              <ProvenanceBadge kind="engine" label="엔진 계산 지표" />
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
            </div>

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
