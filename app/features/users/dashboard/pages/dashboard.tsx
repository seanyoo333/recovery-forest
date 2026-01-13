import type { Route } from "./+types/dashboard";

import { format, subDays } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { BloodTestMiniCharts } from "../components/blood-test-mini-charts";
import { HealthHabitsAreaChart } from "../components/health-habits-area-chart";
import { NaturalTargetRadarChart } from "../components/natural-target-radar-chart";
import { initializeDefaultGridOptions } from "../mutations";
import {
  getBloodTestOverview,
  getDailyGridLogs,
  getDailyGridLogsByDateRange,
  getGridOptions,
  getIngredientEvidenceByDateRange,
  getTodayIngredientEvidence,
} from "../queries";
import {
  calculateCategoryScore,
  calculateDailyTotal,
  calculatePeriodScores,
  calculateTrafficLight,
  combineAxisScores,
  computeLifestyleAxisScores,
  computeSupplementAxisScores,
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
      bloodTestData: null,
    };
  }

  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const week7Start = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const month30Start = format(subDays(new Date(), 30), "yyyy-MM-dd");

    // 기본 그리드 옵션 초기화
    await initializeDefaultGridOptions(client, userId);

    const [
      options,
      todayLogs,
      pastLogs,
      todayIngredientEvidence,
      week7IngredientEvidence,
      month30IngredientEvidence,
      bloodTestOverview,
    ] = await Promise.all([
      getGridOptions(client, userId),
      getDailyGridLogs(client, userId, today),
      getDailyGridLogsByDateRange(client, userId, month30Start, yesterday),
      getTodayIngredientEvidence(client, userId, today),
      getIngredientEvidenceByDateRange(client, userId, week7Start, yesterday),
      getIngredientEvidenceByDateRange(client, userId, month30Start, yesterday),
      getBloodTestOverview(client, userId).catch((error) => {
        console.error("Failed to load blood test overview:", error);
        return null;
      }),
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
    const todayFilledCount = countFilledCategories(todayLogs);

    // 기준선 및 변화량 계산 (신호등 로직 재사용)
    const trafficLight = calculateTrafficLight(
      todayFilledCount,
      todayTotal,
      periodScores,
    );

    // 레이더 차트 데이터 계산 (5축)
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

    // 생활습관 점수 (5축) - 오늘
    const todayLifeAxisScores = computeLifestyleAxisScores(habitScores);
    console.log(`[레이더 차트 디버깅] 생활습관 점수 (5축):`, todayLifeAxisScores);

    // 천연물 점수 (5축) - 오늘
    console.log(`[레이더 차트 디버깅] todayIngredientEvidence 입력:`, {
      count: todayIngredientEvidence.length,
      data: todayIngredientEvidence.slice(0, 5), // 처음 5개만 로그
    });
    
    const todaySuppAxisScores = computeSupplementAxisScores(
      todayIngredientEvidence as any,
    );
    console.log(`[레이더 차트 디버깅] 천연물 점수 (5축):`, todaySuppAxisScores);

    // 최종 레이더 점수 (80% 천연물 + 20% 생활습관) - 오늘
    const todayFinalAxisScores = combineAxisScores(
      todaySuppAxisScores,
      todayLifeAxisScores,
    );
    console.log(`[레이더 차트 디버깅] 최종 레이더 점수 (5축):`, todayFinalAxisScores);
    
    const todayRadarData = toRadarData(todayFinalAxisScores);
    console.log(`[레이더 차트 디버깅] 레이더 차트 데이터:`, todayRadarData);

    // 기준선 계산: 최근 7일(0.7) + 최근 30일(0.3) 가중 평균
    // 날짜별로 그룹화하여 각 날짜의 축 점수 계산
    const week7Dates = new Set<string>();
    const month30Dates = new Set<string>();

    // 7일, 30일 날짜 수집
    for (let i = 1; i <= 7; i++) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      week7Dates.add(date);
      month30Dates.add(date);
    }
    for (let i = 8; i <= 30; i++) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      month30Dates.add(date);
    }

    // 날짜별 evidence 그룹화
    const week7EvidenceByDate = new Map<string, typeof week7IngredientEvidence>();
    const month30EvidenceByDate = new Map<string, typeof month30IngredientEvidence>();

    week7IngredientEvidence.forEach((ev) => {
      if (!week7EvidenceByDate.has(ev.log_date)) {
        week7EvidenceByDate.set(ev.log_date, []);
      }
      week7EvidenceByDate.get(ev.log_date)!.push(ev);
    });

    month30IngredientEvidence.forEach((ev) => {
      if (!month30EvidenceByDate.has(ev.log_date)) {
        month30EvidenceByDate.set(ev.log_date, []);
      }
      month30EvidenceByDate.get(ev.log_date)!.push(ev);
    });

    // 날짜별 생활습관 점수 계산 (7일, 30일)
    const week7AxisScoresList: Array<Record<string, number>> = [];
    const month30AxisScoresList: Array<Record<string, number>> = [];

    for (const date of week7Dates) {
      const dateLogs = pastLogs.filter((log) => log.log_date === date);
      const dateHabitScores = categories.reduce(
        (acc, cat) => {
          acc[cat] = calculateCategoryScore(dateLogs, cat, options);
          return acc;
        },
        {} as Record<
          "exercise" | "sleep" | "supplement" | "diet" | "therapy",
          number
        >,
      );
      const dateLifeAxisScores = computeLifestyleAxisScores(dateHabitScores);
      const dateSuppAxisScores = computeSupplementAxisScores(
        (week7EvidenceByDate.get(date) || []) as any,
      );
      const dateFinalAxisScores = combineAxisScores(
        dateSuppAxisScores,
        dateLifeAxisScores,
      );
      week7AxisScoresList.push(dateFinalAxisScores);
    }

    for (const date of month30Dates) {
      const dateLogs = pastLogs.filter((log) => log.log_date === date);
      const dateHabitScores = categories.reduce(
        (acc, cat) => {
          acc[cat] = calculateCategoryScore(dateLogs, cat, options);
          return acc;
        },
        {} as Record<
          "exercise" | "sleep" | "supplement" | "diet" | "therapy",
          number
        >,
      );
      const dateLifeAxisScores = computeLifestyleAxisScores(dateHabitScores);
      const dateSuppAxisScores = computeSupplementAxisScores(
        (month30EvidenceByDate.get(date) || []) as any,
      );
      const dateFinalAxisScores = combineAxisScores(
        dateSuppAxisScores,
        dateLifeAxisScores,
      );
      month30AxisScoresList.push(dateFinalAxisScores);
    }

    // 7일 평균, 30일 평균 계산
    const week7AvgAxisScores: Record<string, number> = {};
    const month30AvgAxisScores: Record<string, number> = {};

    if (week7AxisScoresList.length > 0) {
      for (const axis of ["metabolic_pressure", "immune_balance", "abnormal_signals", "neuro_stress", "recovery"] as const) {
        const sum = week7AxisScoresList.reduce(
          (acc, scores) => acc + (scores[axis] || 0),
          0,
        );
        week7AvgAxisScores[axis] = sum / week7AxisScoresList.length;
      }
    }

    if (month30AxisScoresList.length > 0) {
      for (const axis of ["metabolic_pressure", "immune_balance", "abnormal_signals", "neuro_stress", "recovery"] as const) {
        const sum = month30AxisScoresList.reduce(
          (acc, scores) => acc + (scores[axis] || 0),
          0,
        );
        month30AvgAxisScores[axis] = sum / month30AxisScoresList.length;
      }
    }

    // 기준선 계산: 0.7 * week7Avg + 0.3 * month30Avg
    const baselineAxisScores: Record<string, number> = {};
    for (const axis of ["metabolic_pressure", "immune_balance", "abnormal_signals", "neuro_stress", "recovery"] as const) {
      const week7Avg = week7AvgAxisScores[axis] ?? 0;
      const month30Avg = month30AvgAxisScores[axis] ?? 0;
      baselineAxisScores[axis] = 0.7 * week7Avg + 0.3 * month30Avg;
    }

    console.log(`[레이더 차트 디버깅] 기준선 계산 결과:`, {
      week7AvgAxisScores,
      month30AvgAxisScores,
      baselineAxisScores,
    });
    
    const baselineRadarData = toRadarData(baselineAxisScores as any);
    console.log(`[레이더 차트 디버깅] 기준선 레이더 차트 데이터:`, baselineRadarData);

    // 기준선 대비 변화량 계산 (평균)
    const avgDelta =
      todayRadarData.reduce((sum, item, idx) => {
        const baselineItem = baselineRadarData[idx];
        return sum + (item.score - (baselineItem?.score ?? 0));
      }, 0) / todayRadarData.length;

    console.log(`[레이더 차트 디버깅] 기준선 대비 변화량:`, avgDelta);

    // 가장 낮은 축 찾기
    const lowestAxis = todayRadarData.reduce((min, item) =>
      item.score < min.score ? item : min,
    );
    console.log(`[레이더 차트 디버깅] 가장 낮은 축:`, lowestAxis);

    // 상위 기여 성분
    const topIngredients = topContributingIngredients(
      todayIngredientEvidence as any,
      2,
    );
    console.log(`[레이더 차트 디버깅] 상위 기여 성분:`, topIngredients);

    // 상태 판정 (기준선 대비)
    let status: "gray" | "green" | "yellow" | "red" = "gray";
    let statusMessage = "";
    if (todayIngredientEvidence.length === 0) {
      status = "gray";
      statusMessage = "천연물 기록이 부족해요. 보조제를 입력해주세요.";
    } else if (avgDelta >= 7) {
      status = "green";
      statusMessage = "최근 평균보다 좋아요. 오늘은 유지가 목표";
    } else if (avgDelta <= -7) {
      status = "red";
      statusMessage = "오늘은 낮은 날. 회복 루틴 1개만 선택하세요";
    } else {
      status = "yellow";
      statusMessage = "평균 근처. 작은 한 가지로 '좋은 날' 만들기";
    }
    
    console.log(`[레이더 차트 디버깅] 상태 판정:`, {
      status,
      statusMessage,
      todayIngredientEvidenceCount: todayIngredientEvidence.length,
      avgDelta,
    });

    return {
      healthHabitsData: {
        dailyScores,
        periodScores,
        todayTotal,
        baseline: trafficLight.baseline,
        delta: trafficLight.delta,
        status: trafficLight.status,
        statusMessage: trafficLight.message,
      },
      radarData: {
        todayData: todayRadarData,
        baselineData: baselineRadarData,
        avgDelta,
        lowestAxis: lowestAxis.label,
        status,
        statusMessage,
        topIngredients: topIngredients.map((ing) => ({
          name: ing.name,
          axes: ing.axes,
        })),
      },
      bloodTestData: bloodTestOverview
        ? {
            latestSummary: bloodTestOverview.latestSummary,
          }
        : null,
    };
  } catch (error) {
    console.error("[레이더 차트 디버깅] 에러 발생:", error);
    console.error("Failed to load health habits data:", error);
    return {
      healthHabitsData: null,
      radarData: null,
      bloodTestData: null,
    };
  }
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* 4칸 그리드 레이아웃 */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        {/* 상단 왼쪽: 천연물 표적 프로필 */}
        <div className="min-h-[400px]">
          {loaderData.radarData ? (
            <NaturalTargetRadarChart
              todayData={loaderData.radarData.todayData}
              baselineData={loaderData.radarData.baselineData}
              avgDelta={loaderData.radarData.avgDelta}
              lowestAxis={loaderData.radarData.lowestAxis}
              status={loaderData.radarData.status}
              statusMessage={loaderData.radarData.statusMessage}
              topIngredients={loaderData.radarData.topIngredients}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>천연물 표적 프로필</CardTitle>
                <CardDescription>최근 기록 기반 요약</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground flex h-80 items-center justify-center">
                  데이터 로딩 중...
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 상단 오른쪽: 혈액검사 핵심 3개 미니차트 */}
        <div className="min-h-[400px]">
          {loaderData.bloodTestData ? (
            <BloodTestMiniCharts
              latestSummary={loaderData.bloodTestData.latestSummary}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>혈액검사 핵심 지표</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground flex h-80 items-center justify-center">
                  데이터 없음
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 하단 왼쪽: 생활습관 건강 점수 */}
        <div className="min-h-[400px]">
          {loaderData.healthHabitsData ? (
            <HealthHabitsAreaChart
              dailyScores={loaderData.healthHabitsData.dailyScores}
              periodScores={loaderData.healthHabitsData.periodScores}
              todayTotal={loaderData.healthHabitsData.todayTotal}
              baseline={loaderData.healthHabitsData.baseline}
              delta={loaderData.healthHabitsData.delta}
              status={loaderData.healthHabitsData.status}
              statusMessage={loaderData.healthHabitsData.statusMessage}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>생활습관 건강 점수</CardTitle>
                <CardDescription>최근 평균과 오늘의 점수를 비교해 보세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground flex h-80 items-center justify-center">
                  데이터 로딩 중...
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 하단 오른쪽: 천연물 기여도 막대그래프 (빈 공간) */}
        <div className="min-h-[400px]">
          <Card>
            <CardHeader>
              <CardTitle>천연물 기여도</CardTitle>
              <CardDescription>준비 중입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex h-80 items-center justify-center">
                곧 추가될 예정입니다
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
