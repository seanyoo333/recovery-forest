/**
 * Health Habits Area Chart Component
 *
 * 건강습관 점수 추이 Area Chart 컴포넌트
 */
import type { PeriodScores } from "../utils";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Area, AreaChart, ReferenceLine } from "recharts";
import { CartesianGrid, XAxis } from "recharts";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { ChartContainer } from "~/core/components/ui/chart";
import type { ChartConfig } from "~/core/components/ui/chart";
import { ChartTooltip } from "~/core/components/ui/chart";
import { ChartTooltipContent } from "~/core/components/ui/chart";

interface HealthHabitsAreaChartProps {
  dailyScores: Array<{ date: string; total: number }>;
  periodScores: PeriodScores;
  todayTotal: number;
  baseline: number | null;
  delta: number | null;
  status: "gray" | "green" | "yellow" | "red";
  statusMessage: string;
}

const chartConfig = {
  total: {
    label: "하루 총 건강 점수",
    theme: {
      light: "oklch(0.646 0.222 41.116)", // chart-1 light mode (밝은 주황색)
      dark: "oklch(0.488 0.243 264.376)", // chart-1 dark mode
    },
  },
  baseline: {
    label: "최근 평균 기준선",
    theme: {
      light: "oklch(0.6 0.118 184.704)", // chart-2 light mode (청록색)
      dark: "oklch(0.696 0.17 162.48)", // chart-2 dark mode
    },
  },
} satisfies ChartConfig;

/**
 * 상태별 색상 및 스타일 (신호등 판정 기준에 맞춤)
 */
const statusStyles = {
  gray: {
    badgeClassName: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
    dot: "fill-gray-500",
  },
  green: {
    badgeClassName: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    dot: "fill-green-500",
  },
  yellow: {
    badgeClassName: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    dot: "fill-yellow-500",
  },
  red: {
    badgeClassName: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    dot: "fill-red-500",
  },
};

// 명시적 색상 값 (CSS 변수 대신 직접 사용)
const COLORS = {
  total: {
    light: "oklch(0.646 0.222 41.116)", // chart-1 light mode (밝은 주황색)
    dark: "oklch(0.488 0.243 264.376)", // chart-1 dark mode
  },
  baseline: {
    light: "oklch(0.6 0.118 184.704)", // chart-2 light mode (청록색)
    dark: "oklch(0.696 0.17 162.48)", // chart-2 dark mode
  },
};

export function HealthHabitsAreaChart({
  dailyScores,
  periodScores,
  todayTotal,
  baseline,
  delta,
  status,
  statusMessage,
}: HealthHabitsAreaChartProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [isDark, setIsDark] = useState(false);
  
  // 다크 모드 감지
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
  
  // 색상 선택
  const totalColor = isDark ? COLORS.total.dark : COLORS.total.light;
  const baselineColor = isDark ? COLORS.baseline.dark : COLORS.baseline.light;
  
  // 최근 30일 데이터 (오래된 것부터)
  const chartData = [...dailyScores].reverse().map((d) => {
    const dateObj = new Date(d.date);
    const isToday = d.date === today;
    return {
      date: format(dateObj, "MM/dd", { locale: ko }),
      dateFull: d.date,
      total: d.total,
      isToday,
    };
  });

  // 오늘 데이터 인덱스 찾기
  const todayIndex = chartData.findIndex((d) => d.isToday);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>건강습관 추이</CardTitle>
          <CardDescription>하루 총 습관 점수 변화</CardDescription>
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
        <div className="space-y-3">
          {/* 타이틀과 버튼 행 */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>생활습관 건강 점수</CardTitle>
              <CardDescription>
                최근 평균과 오늘의 점수 비교
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link to="/my/dashboard/health-habits">
                생활습관 입력
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
          {/* 뱃지 행 */}
          <div className="flex items-center gap-2 flex-wrap">
            {delta !== null && (
              <Badge variant="outline" className={`text-xs ${statusStyles[status].badgeClassName}`}>
                {delta > 0 ? "+" : ""}
                <span>평균 기준선 대비 {delta.toFixed(1)}점</span>
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
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value, payload) => {
                    if (!payload || !Array.isArray(payload) || payload.length === 0) {
                      return String(value);
                    }
                    const firstPayload = payload[0] as { payload?: { dateFull?: string } } | undefined;
                    const data = firstPayload?.payload;
                    if (!data?.dateFull) return String(value);
                    return format(new Date(data.dateFull), "yyyy년 MM월 dd일", {
                      locale: ko,
                    });
                  }}
                />
              }
            />
            {/* 메인 점수 영역 */}
            <Area
              dataKey="total"
              type="natural"
              stroke={totalColor}
              fill={totalColor}
              fillOpacity={0.4}
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload && (payload as { isToday?: boolean }).isToday) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={7}
                      fill={statusStyles[status].dot}
                      stroke="#fff"
                      strokeWidth={2.5}
                    />
                  );
                }
                return <></>;
              }}
              activeDot={{
                r: 6,
                fill: totalColor,
                strokeWidth: 2.5,
                stroke: "#fff",
              }}
            />
            {/* 기준선 (신호등 로직과 동일) */}
            {baseline !== null && !isNaN(baseline) && baseline > 0 && (
              <ReferenceLine
                y={baseline}
                stroke={baselineColor}
                strokeDasharray="6 4"
                strokeWidth={2.5}
                strokeOpacity={0.9}
                label={{
                  value: `기준선 ${baseline.toFixed(1)}`,
                  position: "right",
                  fill: baselineColor,
                  fontSize: 11,
                  fontWeight: 600,
                  offset: 5,
                }}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
