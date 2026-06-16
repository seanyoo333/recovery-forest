import {
  ArrowLeft,
  CalendarDays,
  Car,
  Clock,
  Leaf,
  MapPin,
  Mountain,
  Sparkles,
  Utensils,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import type { Route } from "./+types/prescribe-itinerary-page";

import { RecoveryPoints } from "../components/recovery-points";
import { VisitTimeline } from "../components/visit-timeline";
import { USER_TYPE_LABELS } from "../schemas/prescribe-input.schema";
import {
  loadPrescription,
  type PrescriptionData,
} from "../services/prescription-loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "회복 여행 일정표 · 회복의 숲" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  return loadPrescription(request);
}

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function fmtDuration(min: number): string {
  if (min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}시간${m ? ` ${m}분` : ""}` : `${m}분`;
}

export default function PrescribeItineraryPage({
  loaderData,
}: Route.ComponentProps) {
  const location = useLocation();
  const { output, overlay } = loaderData as PrescriptionData;
  const top = output.top_pick_detail;
  const topRank = output.ranking[0];
  const steps = top.itinerary.steps;

  // 데모 추정값(예시): 이동시간(거리 기반)·총 일정시간(타임라인 span)·난이도.
  const travelMin = Math.max(20, Math.round((topRank.engine_breakdown.distance_km / 50) * 60));
  const totalMin =
    steps.length >= 2 ? toMin(steps[steps.length - 1].time) - toMin(steps[0].time) : 0;

  return (
    <div className="bg-gradient-to-b from-emerald-50/70 to-white">
      <main className="mx-auto flex max-w-2xl flex-col gap-7 px-5 pt-10 pb-16">
        {/* 감성 헤더 */}
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Sparkles className="size-3.5" aria-hidden />
            나만을 위한 맞춤 힐링 여행
          </span>
          <h1 className="text-3xl font-bold text-gray-900">회복 여행 일정표</h1>
          <p className="leading-relaxed text-gray-600">
            자연이 주는 치유로, 오늘의 나를 회복하세요.
          </p>
        </header>

        {/* 숲 대표 사진 + 요약 정보 */}
        <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-lg shadow-emerald-950/10">
          <div className="relative flex min-h-[200px] items-end p-5">
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(/recovery-forest.png)" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/40 to-emerald-950/5"
            />
            <h2 className="relative flex items-center gap-2 text-2xl font-bold text-white">
              <Leaf className="size-6 text-emerald-300" aria-hidden />
              {top.forest_name}
            </h2>
          </div>
          <dl className="flex flex-col gap-2.5 p-5 text-sm">
            <Row icon={<CalendarDays className="size-4" />} label="일정">
              {overlay.date} 방문
            </Row>
            {overlay.label ? (
              <Row icon={<MapPin className="size-4" />} label="출발지">
                {overlay.label}
              </Row>
            ) : null}
            <Row icon={<Sparkles className="size-4" />} label="추천 유형">
              {USER_TYPE_LABELS[output.user_summary.user_type]} · {overlay.goal}
            </Row>
          </dl>
        </section>

        {/* 요약 4칸 */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            icon={<Leaf className="size-5 text-emerald-600" />}
            value={`${Math.round(topRank.engine_score)}%`}
            label="나와 맞아요"
          />
          <SummaryCard
            icon={<Car className="size-5 text-emerald-600" />}
            value={fmtDuration(travelMin)}
            label="예상 이동시간"
            example
          />
          <SummaryCard
            icon={<Clock className="size-5 text-emerald-600" />}
            value={fmtDuration(totalMin)}
            label="총 일정시간"
            example
          />
          <SummaryCard
            icon={<Mountain className="size-5 text-emerald-600" />}
            value="쉬움"
            label="추천 난이도"
            example
          />
        </section>

        {/* 시간별 타임라인 */}
        <section className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-gray-900">오늘의 여행 일정</h3>
          <VisitTimeline steps={steps} />
        </section>

        {/* 먹거리 / 볼거리 */}
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <Utensils className="size-4 text-emerald-600" aria-hidden />
              먹거리 추천
            </p>
            {top.nearby_food.length > 0 ? (
              top.nearby_food.map((f) => (
                <p key={f.name} className="text-sm text-gray-700">
                  {f.name}{" "}
                  <span className="text-gray-400">
                    {f.category} · ★{f.rating}
                  </span>
                </p>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                지역 향토 음식점 (예시) — 방문 전 다시 확인하세요
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <MapPin className="size-4 text-emerald-600" aria-hidden />
              볼거리 추천
            </p>
            <p className="text-sm text-gray-400">
              인근 자연·문화 명소 (예시) — 동선에 맞춰 즐겨보세요
            </p>
          </div>
        </section>

        {/* 오늘의 회복 포인트 */}
        {top.recovery_points && top.recovery_points.length > 0 ? (
          <section className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5">
            <h3 className="text-base font-semibold text-gray-900">
              오늘의 회복 포인트
            </h3>
            <RecoveryPoints points={top.recovery_points} />
          </section>
        ) : null}

        <p className="text-center text-sm text-gray-500">
          자연 속에서의 하루가, 내일의 당신을 더 건강하고 행복하게 만듭니다.
        </p>

        <Link
          to={{ pathname: "/prescribe/result", search: location.search }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-600 px-6 py-3 text-emerald-700 transition hover:bg-emerald-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          처방 결과로 돌아가기
        </Link>
      </main>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-gray-700">
      <span className="text-emerald-600" aria-hidden>
        {icon}
      </span>
      <span className="w-16 shrink-0 text-gray-400">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  example,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  example?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm">
      <span aria-hidden>{icon}</span>
      <span className="text-lg font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500">
        {label}
        {example ? <span className="text-gray-300"> (예시)</span> : null}
      </span>
    </div>
  );
}
