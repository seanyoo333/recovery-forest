import { MapPin, TreePine, Wind } from "lucide-react";

import type { EngineBreakdown } from "../schemas/prescribe-output.schema";

/**
 * "이 숲의 강점" — 접근성·피톤치드·대기질 막대(0~100) + 수치.
 * 피톤치드를 맨 위·가장 크게 강조(서비스 핵심 차별점). 종합점수+트레이드오프로 마무리.
 */
export function ForestStrengths({
  b,
  engineScore,
  tradeoff,
}: {
  b: EngineBreakdown;
  engineScore: number;
  tradeoff?: string;
}) {
  // 점수 없으면(픽스처 폴백) 엔진 공식으로 근사: 거리=100·exp(-km/150), 대기=100-pm25·1.8.
  const distanceScore =
    b.distance_score ?? Math.round(100 * Math.exp(-b.distance_km / 150));
  const airScore = b.air_score ?? Math.max(0, Math.round(100 - b.pm25 * 1.8));

  return (
    <div className="flex flex-col gap-4">
      {/* 피톤치드 — 주인공 */}
      <div className="flex flex-col gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-end justify-between gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-gray-900">
            <TreePine className="size-5 text-emerald-600" aria-hidden />
            피톤치드 잠재력
          </span>
          <span className="text-2xl leading-none font-bold tabular-nums text-emerald-700">
            {b.phytoncide_index}
            <span className="ml-0.5 text-sm font-medium">점</span>
          </span>
        </div>
        <Bar score={b.phytoncide_index} strong />
        {b.phyto_note ? (
          <p className="text-xs leading-relaxed text-emerald-800/80">
            {b.phyto_note}
          </p>
        ) : null}
      </div>

      <StrengthRow
        icon={<MapPin className="size-4 text-gray-500" aria-hidden />}
        label="접근성"
        score={distanceScore}
        value={`${b.distance_km}km`}
      />
      <StrengthRow
        icon={<Wind className="size-4 text-gray-500" aria-hidden />}
        label="대기질"
        score={airScore}
        value={`PM2.5 ${b.pm25} · ${b.air_label}`}
      />

      <p className="rounded-xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-600">
        <b className="text-gray-900">종합 추천 점수 {Math.round(engineScore)}점</b>
        {tradeoff ? ` — ${tradeoff}` : null}
      </p>
    </div>
  );
}

function StrengthRow({
  icon,
  label,
  score,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-gray-700">
          {icon}
          {label}
        </span>
        <span className="text-gray-500">{value}</span>
      </div>
      <Bar score={score} />
    </div>
  );
}

function Bar({ score, strong }: { score: number; strong?: boolean }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-gray-100 ${strong ? "h-3" : "h-2"}`}
    >
      <div
        className={`h-full rounded-full ${strong ? "bg-emerald-600" : "bg-emerald-400"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
