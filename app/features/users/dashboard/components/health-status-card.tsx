/**
 * Health Status Card Component
 *
 * 건강습관 상태 표시 카드 컴포넌트
 */
import type { Category } from "../types";
import type {
  CategoryEvaluation,
  NextAction,
  StreakData,
  TrafficLightResult,
  TrafficLightStatus,
} from "../utils";

import { Badge } from "~/core/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/core/components/ui/tooltip";

const categoryLabels: Record<Category, string> = {
  exercise: "운동",
  sleep: "수면",
  supplement: "보조제",
  diet: "식단",
  therapy: "보조요법",
};

const statusIcons = {
  good: "✅",
  ok: "➖",
  needs_care: "⚠️",
};

const statusColors = {
  good: "bg-green-500/10 text-green-700 dark:text-green-400",
  ok: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  needs_care: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
};

interface HealthStatusCardProps {
  trafficLight: TrafficLightResult;
  categoryEvaluations: CategoryEvaluation[];
  nextAction: NextAction | null;
  streak: StreakData;
}

type TrafficLightStatusType = "gray" | "green" | "yellow" | "red";

const trafficLightMessages: Record<
  TrafficLightStatusType,
  { title: string; description: string }
> = {
  gray: {
    title: "데이터 부족",
    description: "오늘 1개만 더 체크하면 상태가 계산돼요",
  },
  green: {
    title: "좋은 상태",
    description: "최근 평균보다 7점 이상 높아요. 오늘은 유지가 목표입니다.",
  },
  yellow: {
    title: "평균 근처",
    description: "최근 평균과 비슷해요. 작은 습관 한 가지로 '건강한 날' 만들기",
  },
  red: {
    title: "주의 필요",
    description: "최근 평균보다 7점 이상 낮아요. 회복 루틴 1개만 시도해 보세요",
  },
};

export function HealthStatusCard({
  trafficLight,
  categoryEvaluations,
  nextAction,
  streak,
}: HealthStatusCardProps) {
  const lightColors = {
    gray: "bg-gray-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  const lightMessage = trafficLightMessages[trafficLight.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>오늘의 상태</CardTitle>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`size-4 cursor-help rounded-full ${lightColors[trafficLight.status]}`}
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-fit px-3 py-2 whitespace-nowrap">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">{lightMessage.title}</p>
                  <p className="text-xs whitespace-nowrap">
                    {lightMessage.description}
                  </p>
                  {trafficLight.baseline !== null &&
                    trafficLight.delta !== null && (
                      <p className="text-muted-foreground border-border/50 mt-1.5 border-t pt-1.5 text-xs whitespace-nowrap">
                        변화량: {trafficLight.delta > 0 ? "+" : ""}
                        {trafficLight.delta.toFixed(1)}점
                      </p>
                    )}
                </div>
              </TooltipContent>
            </Tooltip>
            <Badge variant="outline" className="text-xs">
              {streak.currentStreak}일 연속 기록
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 신호등 메시지 */}
        <div className="bg-muted rounded-lg p-3">
          <p className="text-sm">{trafficLight.message}</p>
          {trafficLight.baseline !== null && (
            <div className="text-muted-foreground mt-2 flex gap-4 text-xs">
              <span>오늘: {trafficLight.todayTotal.toFixed(1)}점</span>
              <span>기준: {trafficLight.baseline.toFixed(1)}점</span>
              {trafficLight.delta !== null && (
                <span>
                  {trafficLight.delta > 0 ? "+" : ""}
                  {trafficLight.delta.toFixed(1)}점
                </span>
              )}
            </div>
          )}
        </div>

        {/* 카테고리별 상태 */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">카테고리별 상태</h4>
          <div className="grid grid-cols-2 gap-2">
            {categoryEvaluations.map((evaluation) => (
              <div
                key={evaluation.category}
                className={`rounded-md p-2 ${statusColors[evaluation.status]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {statusIcons[evaluation.status]}{" "}
                    {categoryLabels[evaluation.category]}
                  </span>
                  <span className="text-xs">
                    {evaluation.todayScore.toFixed(1)}점
                    {evaluation.delta !== 0 && (
                      <span className="ml-1">
                        ({evaluation.delta > 0 ? "+" : ""}
                        {evaluation.delta.toFixed(1)})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* 다음 행동 추천 */}
        {nextAction && (
          <div className="border-primary/20 bg-primary/5 rounded-lg border-2 p-3">
            <p className="text-sm font-semibold">💡 오늘의 추천</p>
            <p className="mt-1 text-sm">{nextAction.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
