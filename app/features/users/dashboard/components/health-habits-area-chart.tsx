/**
 * Health Habits Area Chart Component
 *
 * 건강습관 점수 추이 Area Chart 컴포넌트
 */
import type { PeriodScores } from "../utils";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Area, AreaChart, ReferenceLine } from "recharts";
import { CartesianGrid, XAxis } from "recharts";

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
}

const chartConfig = {
  total: {
    label: "하루 총 점수",
    color: "hsl(var(--chart-1))",
  },
  week7Avg: {
    label: "최근 7일 평균",
    color: "hsl(var(--chart-2))",
  },
  week7BeforeAvg: {
    label: "7일 전 평균",
    color: "hsl(var(--chart-3))",
  },
  month30Min: {
    label: "30일 최소",
    color: "hsl(var(--muted))",
  },
  month30Max: {
    label: "30일 최대",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

/**
 * 판단 문장 생성
 */
function generateInsightMessage(
  todayTotal: number,
  week7Avg: number | null,
): string {
  if (week7Avg === null) {
    return "데이터가 부족해요. 계속 기록해주세요";
  }

  if (todayTotal >= week7Avg + 1) {
    return "최근 7일 평균보다 상승";
  } else if (todayTotal <= week7Avg - 1) {
    return "최근 7일 평균보다 하락";
  } else {
    return "평균 근처 유지";
  }
}

export function HealthHabitsAreaChart({
  dailyScores,
  periodScores,
  todayTotal,
}: HealthHabitsAreaChartProps) {
  // 최근 30일 데이터 (오래된 것부터)
  const chartData = [...dailyScores].reverse().map((d) => {
    const dateObj = new Date(d.date);
    return {
      date: format(dateObj, "MM/dd", { locale: ko }),
      dateFull: d.date,
      total: d.total,
    };
  });

  // 7일 전 평균 계산 (8일 전 ~ 14일 전)
  const week7BeforeStart = chartData.length >= 14 ? 14 : chartData.length;
  const week7BeforeEnd = chartData.length >= 7 ? 7 : 0;
  const week7BeforeScores = chartData.slice(week7BeforeEnd, week7BeforeStart);
  const week7BeforeAvg =
    week7BeforeScores.length > 0
      ? week7BeforeScores.reduce((sum, d) => sum + d.total, 0) /
        week7BeforeScores.length
      : null;

  // 30일 최소/최대 계산
  const totals = chartData.map((d) => d.total);
  const month30Min = totals.length > 0 ? Math.min(...totals) : 0;
  const month30Max = totals.length > 0 ? Math.max(...totals) : 0;

  const insightMessage = generateInsightMessage(
    todayTotal,
    periodScores.week7Avg,
  );

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>건강습관 추이</CardTitle>
            <CardDescription>하루 총 습관 점수 변화</CardDescription>
          </div>
          <div className="bg-muted rounded-lg px-3 py-1.5 text-sm">
            {insightMessage}
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
                    const data = payload?.[0]?.payload;
                    if (!data) return value;
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
              stroke="var(--color-total)"
              fill="var(--color-total)"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={false}
            />
            {/* 최근 7일 평균선 */}
            {periodScores.week7Avg !== null && (
              <ReferenceLine
                y={periodScores.week7Avg}
                stroke="var(--color-week7Avg)"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: "7일 평균",
                  position: "right",
                  fill: "var(--color-week7Avg)",
                  fontSize: 10,
                }}
              />
            )}
            {/* 7일 전 평균선 */}
            {week7BeforeAvg !== null && (
              <ReferenceLine
                y={week7BeforeAvg}
                stroke="var(--color-week7BeforeAvg)"
                strokeDasharray="3 3"
                strokeWidth={1}
                strokeOpacity={0.6}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
