import type { Route } from "./+types/dashboard";

import { format, subDays } from "date-fns";
import { LineChart } from "recharts";
import { CartesianGrid, XAxis } from "recharts";
import { Line } from "recharts";

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
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { HealthHabitsAreaChart } from "../components/health-habits-area-chart";
import { NaturalTargetRadarChart } from "../components/natural-target-radar-chart";
import { initializeDefaultGridOptions } from "../mutations";
import {
  getDailyGridLogs,
  getDailyGridLogsByDateRange,
  getGridOptions,
  getTodayIngredientEvidence,
} from "../queries";
import {
  calculateCategoryScore,
  calculateDailyTotal,
  calculatePeriodScores,
  combineAxisScores,
  computeLifestyleBaseAxisScores,
  computeSupplementBonusAxisScores,
  countFilledCategories,
  toRadarData,
  topContributingIngredients,
} from "../utils";

export const meta: Route.MetaFunction = () => {
  return [{ title: `Dashboard | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  if (!userId) {
    return {
      healthHabitsData: null,
      radarData: null,
    };
  }

  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const month30Start = format(subDays(new Date(), 30), "yyyy-MM-dd");

    // 기본 그리드 옵션 초기화
    await initializeDefaultGridOptions(client, userId);

    const [options, todayLogs, pastLogs, ingredientEvidence] =
      await Promise.all([
        getGridOptions(client, userId),
        getDailyGridLogs(client, userId, today),
        getDailyGridLogsByDateRange(client, userId, month30Start, yesterday),
        getTodayIngredientEvidence(client, userId, today),
      ]);

    // 일별 점수 계산 (최근 30일)
    const dailyScores = [];
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dateLogs =
        date === today
          ? todayLogs
          : pastLogs.filter((log) => log.log_date === date);
      const total = calculateDailyTotal(dateLogs, options);
      const filledCount = countFilledCategories(dateLogs);
      dailyScores.push({ date, total, filledCount });
    }

    // 기간별 점수 계산
    const periodScores = calculatePeriodScores(dailyScores, today);

    // 오늘 점수
    const todayTotal = calculateDailyTotal(todayLogs, options);

    // 레이더 차트 데이터 계산
    const categories: Array<
      "exercise" | "sleep" | "supplement" | "diet" | "therapy"
    > = ["exercise", "sleep", "supplement", "diet", "therapy"];
    const habitScores = categories.reduce(
      (acc, cat) => {
        acc[cat] = calculateCategoryScore(todayLogs, cat, options);
        return acc;
      },
      {} as Record<
        "exercise" | "sleep" | "supplement" | "diet" | "therapy",
        number
      >,
    );

    // 생활습관 기본 점수
    const baseAxisScores = computeLifestyleBaseAxisScores(habitScores);

    // 천연물 보너스 점수
    const bonusAxisScores = computeSupplementBonusAxisScores(
      ingredientEvidence as any,
    );

    // 최종 레이더 점수
    const finalAxisScores = combineAxisScores(baseAxisScores, bonusAxisScores);
    const radarData = toRadarData(finalAxisScores);

    // 상위 기여 성분
    const topIngredients = topContributingIngredients(
      ingredientEvidence as any,
      2,
    );

    // 판단 문장 생성
    const strongestAxis = radarData.reduce((max, item) =>
      item.score > max.score ? item : max,
    );
    const topLine = `이번 주 가장 강한 축: ${strongestAxis.label}`;
    const subLine =
      topIngredients.length > 0
        ? `천연물 기여: ${topIngredients
            .map(
              (ing) =>
                `${ing.name}(${ing.axes
                  .map((a) => {
                    const labels: Record<string, string> = {
                      metabolic: "대사",
                      inflammation: "염증",
                      immune: "면역",
                      hormone: "호르몬",
                      neuro: "신경",
                      recovery: "회복",
                    };
                    return labels[a] || a;
                  })
                  .join("·")})`,
            )
            .join(", ")}`
        : "천연물 기록 없음";

    return {
      healthHabitsData: {
        dailyScores,
        periodScores,
        todayTotal,
      },
      radarData: {
        data: radarData,
        topLine,
        subLine,
      },
    };
  } catch (error) {
    console.error("Failed to load health habits data:", error);
    return {
      healthHabitsData: null,
      radarData: null,
    };
  }
}

const chartData = [
  { month: "January", glucose: 186 },
  { month: "February", glucose: 305 },
  { month: "March", glucose: 237 },
  { month: "April", glucose: 73 },
  { month: "May", glucose: 209 },
  { month: "June", glucose: 214 },
];
const chartConfig = {
  glucose: {
    label: "Glucose",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        {loaderData.radarData ? (
          <NaturalTargetRadarChart
            radarData={loaderData.radarData.data}
            topLine={loaderData.radarData.topLine}
            subLine={loaderData.radarData.subLine}
          />
        ) : (
          <div className="bg-muted/50 aspect-video rounded-xl" />
        )}
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        {loaderData.healthHabitsData ? (
          <HealthHabitsAreaChart
            dailyScores={loaderData.healthHabitsData.dailyScores}
            periodScores={loaderData.healthHabitsData.periodScores}
            todayTotal={loaderData.healthHabitsData.todayTotal}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>건강습관 추이</CardTitle>
              <CardDescription>하루 총 습관 점수 변화</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex h-80 items-center justify-center">
                데이터 로딩 중...
              </div>
            </CardContent>
          </Card>
        )}
        <div className="bg-muted/50 min-h-full flex-1 rounded-xl md:min-h-min">
          <Card className="w-1/2">
            <CardHeader>
              <CardTitle>Health Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <LineChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Line
                    dataKey="glucose"
                    type="natural"
                    stroke="var(--color-glucose)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
