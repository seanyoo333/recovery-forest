import { Link } from "react-router";

import {
  FOREST_TYPE_LABELS,
  type RecommendationResult,
} from "../schemas/recommendation.schema";
import {
  scoreBadgeLabel,
  summarizeAir,
  summarizeWeather,
  toRadarPoints,
} from "../services/score-formatter";
import { ScoreRadar } from "./score-radar";

type Props = {
  result: RecommendationResult;
};

export function ResultCard({ result }: Props) {
  const radarPoints = toRadarPoints(result);
  const badge = scoreBadgeLabel(result.total_score);
  const weather = summarizeWeather(result);
  const air = summarizeAir(result);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-emerald-600">
            #{result.rank} · {FOREST_TYPE_LABELS[result.type]}
          </span>
          <h2 className="text-xl font-bold">{result.name}</h2>
          <p className="text-sm text-gray-600">{result.region}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-3xl font-bold text-emerald-600">
            {Math.round(result.total_score)}
          </span>
          <span className="text-xs text-gray-500">{badge}</span>
        </div>
      </header>

      <div className="mt-5 grid gap-4 md:grid-cols-[180px_1fr]">
        <ScoreRadar points={radarPoints} />
        <div className="flex flex-col gap-3 text-sm">
          {weather ? (
            <p>
              <span className="font-semibold text-gray-500">오늘 날씨:</span>{" "}
              {weather}
            </p>
          ) : null}
          {air ? (
            <p>
              <span className="font-semibold text-gray-500">공기:</span> {air}
            </p>
          ) : null}
          {typeof result.travel_time_min === "number" ? (
            <p>
              <span className="font-semibold text-gray-500">예상 이동시간:</span>{" "}
              {result.travel_time_min}분
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
        <p className="font-semibold">추천 이유</p>
        <p className="mt-1">{result.reason}</p>
      </div>

      {result.caution ? (
        <div className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <p className="font-semibold">주의사항</p>
          <p className="mt-1">{result.caution}</p>
        </div>
      ) : null}

      <p className="mt-3 text-sm text-gray-700">
        <span className="font-semibold text-gray-500">추천 활동:</span>{" "}
        {result.recommended_activity}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to={`/forests/${result.forest_id}`}
          className="inline-flex h-10 items-center rounded-full bg-emerald-600 px-5 text-sm font-medium text-white"
        >
          자세히 보기
        </Link>
        {result.programs.length > 0 ? (
          <span className="inline-flex h-10 items-center rounded-full bg-gray-100 px-4 text-sm text-gray-700">
            연계 프로그램 {result.programs.length}개
          </span>
        ) : null}
      </div>
    </article>
  );
}
