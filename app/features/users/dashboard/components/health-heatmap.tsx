/**
 * Health Habits Heatmap Component
 *
 * 건강습관 히트맵 컴포넌트
 */
import type { Category, HeatmapDataPoint, HeatmapInsight } from "../utils";

import { format } from "date-fns";
import { ko } from "date-fns/locale";

const categoryLabels: Record<Category, string> = {
  exercise: "운동",
  sleep: "수면",
  supplement: "보조제",
  diet: "식단",
  therapy: "보조요법",
};

interface HealthHeatmapProps {
  data: HeatmapDataPoint[];
  insight: HeatmapInsight;
}

/**
 * 점수에 따른 색상 계산
 * - 음수: 빨강 계열
 * - 0: 회색
 * - 양수: 초록 계열
 */
function getScoreColor(score: number, filled: boolean): string {
  if (!filled) {
    return "bg-gray-200 dark:bg-gray-800"; // 기록 없음
  }

  if (score < 0) {
    // 음수 점수: 빨강 계열 (어두운 빨강)
    return "bg-red-600 dark:bg-red-800";
  } else if (score === 0) {
    // 0점: 회색
    return "bg-gray-400 dark:bg-gray-600";
  } else if (score === 1) {
    // 1점: 연한 초록
    return "bg-green-300 dark:bg-green-700";
  } else if (score === 2) {
    // 2점: 중간 초록
    return "bg-green-500 dark:bg-green-600";
  } else {
    // 3점: 진한 초록
    return "bg-green-700 dark:bg-green-500";
  }
}

export function HealthHeatmap({ data, insight }: HealthHeatmapProps) {
  // 날짜별로 그룹화
  const dates = Array.from(new Set(data.map((d) => d.date))).sort();
  const categories: Category[] = [
    "exercise",
    "sleep",
    "supplement",
    "diet",
    "therapy",
  ];

  // 데이터를 날짜-카테고리 맵으로 변환
  const dataMap = new Map<string, Map<Category, HeatmapDataPoint>>();
  data.forEach((point) => {
    if (!dataMap.has(point.date)) {
      dataMap.set(point.date, new Map());
    }
    dataMap.get(point.date)!.set(point.category, point);
  });

  return (
    <div className="space-y-4">
      {/* 판단 문장 */}
      <div className="bg-muted rounded-lg p-3">
        <p className="text-sm">{insight.message}</p>
      </div>

      {/* 히트맵 */}
      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-full">
          {/* 헤더 */}
          <div
            className="bg-background sticky left-0 z-10 grid border-b"
            style={{
              gridTemplateColumns: `80px repeat(${dates.length}, minmax(24px, 1fr))`,
            }}
          >
            <div className="border-r p-2 text-xs font-medium">카테고리</div>
            {dates.map((date) => {
              const dateObj = new Date(date);
              const dayOfWeek = format(dateObj, "EEE", { locale: ko });
              const day = format(dateObj, "d");
              const isToday = format(new Date(), "yyyy-MM-dd") === date;

              return (
                <div
                  key={date}
                  className={`border-r p-1 text-center text-[10px] ${
                    isToday ? "bg-primary/10 font-semibold" : ""
                  }`}
                  title={format(dateObj, "yyyy-MM-dd EEEE", { locale: ko })}
                >
                  <div>{dayOfWeek}</div>
                  <div className="text-xs">{day}</div>
                </div>
              );
            })}
          </div>

          {/* 바디 */}
          <div className="divide-y">
            {categories.map((category) => (
              <div
                key={category}
                className="hover:bg-muted/50 grid"
                style={{
                  gridTemplateColumns: `80px repeat(${dates.length}, minmax(24px, 1fr))`,
                }}
              >
                <div className="border-r p-2 text-xs font-medium">
                  {categoryLabels[category]}
                </div>
                {dates.map((date) => {
                  const point =
                    dataMap.get(date)?.get(category) ??
                    ({
                      date,
                      category,
                      score: 0,
                      filled: false,
                    } as HeatmapDataPoint);

                  return (
                    <div
                      key={`${date}-${category}`}
                      className={`border-r ${getScoreColor(point.score, point.filled)}`}
                      title={`${format(new Date(date), "yyyy-MM-dd", { locale: ko })} ${categoryLabels[category]}: ${point.score}점`}
                    >
                      <div className="aspect-square" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="text-muted-foreground flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="size-3 rounded bg-gray-200 dark:bg-gray-800" />
          <span>기록 없음</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-3 rounded bg-red-600 dark:bg-red-800" />
          <span>낮음</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-3 rounded bg-green-300 dark:bg-green-700" />
          <span>보통</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-3 rounded bg-green-500 dark:bg-green-600" />
          <span>좋음</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-3 rounded bg-green-700 dark:bg-green-500" />
          <span>매우 좋음</span>
        </div>
      </div>
    </div>
  );
}
