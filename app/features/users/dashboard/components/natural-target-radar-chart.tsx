import type { MetaAxis } from "../constants";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/core/components/ui/chart";

const chartConfig = {
  today: {
    label: "오늘",
    theme: {
      light: "oklch(0.646 0.222 41.116)", // chart-1 light mode
      dark: "oklch(0.488 0.243 264.376)", // chart-1 dark mode
    },
  },
  baseline: {
    label: "기준선",
    theme: {
      light: "oklch(0.6 0.118 184.704)", // chart-2 light mode
      dark: "oklch(0.696 0.17 162.48)", // chart-2 dark mode
    },
  },
} satisfies ChartConfig;

export interface RadarDataPoint {
  axis: MetaAxis;
  label: string;
  score: number;
}

interface NaturalTargetRadarChartProps {
  todayData: RadarDataPoint[];
  baselineData: RadarDataPoint[];
  avgDelta: number;
  lowestAxis: string;
  status: "gray" | "green" | "yellow" | "red";
  statusMessage: string;
  topIngredients: Array<{ name: string; axes: MetaAxis[] }>;
}

/**
 * 상태별 색상 및 스타일 (신호등 판정 기준에 맞춤)
 */
const statusStyles = {
  gray: {
    badgeClassName: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  },
  green: {
    badgeClassName: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  yellow: {
    badgeClassName: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
  red: {
    badgeClassName: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
};

// 명시적 색상 값
const COLORS = {
  today: {
    light: "oklch(0.646 0.222 41.116)",
    dark: "oklch(0.488 0.243 264.376)",
  },
  baseline: {
    light: "oklch(0.6 0.118 184.704)",
    dark: "oklch(0.696 0.17 162.48)",
  },
};

export function NaturalTargetRadarChart({
  todayData,
  baselineData,
  avgDelta,
  lowestAxis,
  status,
  statusMessage,
  topIngredients,
}: NaturalTargetRadarChartProps) {
  console.log(`[레이더 차트 디버깅] NaturalTargetRadarChart 컴포넌트 렌더링:`, {
    todayData,
    baselineData,
    avgDelta,
    lowestAxis,
    status,
    statusMessage,
    topIngredients,
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const todayColor = isDark ? COLORS.today.dark : COLORS.today.light;
  const baselineColor = isDark
    ? COLORS.baseline.dark
    : COLORS.baseline.light;

  // 차트 데이터 준비 (오늘과 기준선을 같은 구조로)
  const chartData = todayData.map((todayItem, idx) => {
    const baselineItem = baselineData[idx];
    return {
      ...todayItem,
      baseline: baselineItem?.score ?? 0,
    };
  });

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle>천연물 표적 프로필</CardTitle>
              <CardDescription className="mt-1">
                최근 평균과 오늘의 점수 비교
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link to="/my/dashboard/health-habits">
                보조제 입력
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-80 items-center justify-center">
            표시할 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          {/* 타이틀과 버튼 행 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle>천연물 표적 프로필</CardTitle>
              <CardDescription className="mt-1">
                최근 평균과 오늘의 점수 비교
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link to="/my/dashboard/health-habits">
                보조제 입력
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
          {/* 뱃지 행 */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isNaN(avgDelta) && (
              <Badge variant="outline" className={`text-xs ${statusStyles[status].badgeClassName}`}>
                {avgDelta > 0 ? "+" : ""}
                <span>평균 기준선 대비 {avgDelta.toFixed(1)}점</span>
              </Badge>
            )}
            {statusMessage && (
              <Badge variant="outline" className={`text-xs ${statusStyles[status].badgeClassName}`}>
                {statusMessage}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="label" />
            <PolarGrid />
            {/* 기준선 레이더 */}
            <Radar
              name="기준선"
              dataKey="baseline"
              stroke={baselineColor}
              fill={baselineColor}
              fillOpacity={0.2}
              strokeWidth={2}
            />
            {/* 오늘 레이더 */}
            <Radar
              name="오늘"
              dataKey="score"
              stroke={todayColor}
              fill={todayColor}
              fillOpacity={0.5}
              strokeWidth={2.5}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1 text-sm">
        {topIngredients.length > 0 && (
          <div className="text-muted-foreground">
            천연물 기여: {topIngredients
              .map((ing) => {
                const axisLabels: Record<string, string> = {
                  metabolic_pressure: "대사안정화",
                  immune_balance: "면역균형",
                  abnormal_signals: "신호조절",
                  neuro_stress: "신경스트레스",
                  recovery: "회복증진",
                };
                return `${ing.name}(${ing.axes.map((a) => axisLabels[a] || a).join("·")})`;
              })
              .join(", ")}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
