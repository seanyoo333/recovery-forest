import type { Route } from "./+types/dashboard";

import { format, subDays } from "date-fns";
import { Link } from "react-router";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts";

import { HealthReportRequestButton } from "~/core/components/health-report-request-button";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/core/components/ui/chart";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { HealthHabitsAreaChart } from "../components/health-habits-area-chart";
import { NaturalTargetRadarChart } from "../components/natural-target-radar-chart";
import { META_AXES } from "../constants";
import { initializeDefaultGridOptions } from "../mutations";
import {
  type BloodTestChartPoint,
  type BloodTestSummary,
  METRIC_DEFINITIONS,
  type MedicalRecordTranscriptEntry,
  type PatientHealthProfile,
  getBloodTestOverview,
  getDailyGridLogs,
  getDailyGridLogsByDateRange,
  getGridOptions,
  getIngredientEvidenceByDateRange,
  getPatientHealthProfile,
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
      metabolicFuelData: [],
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
      patientProfile,
      bloodTestOverview,
    ] = await Promise.all([
      getGridOptions(client, userId),
      getDailyGridLogs(client, userId, today),
      getDailyGridLogsByDateRange(client, userId, month30Start, yesterday),
      getTodayIngredientEvidence(client, userId, today),
      getIngredientEvidenceByDateRange(client, userId, week7Start, yesterday),
      getIngredientEvidenceByDateRange(client, userId, month30Start, yesterday),
      getPatientHealthProfile(client, userId).catch((error) => {
        console.error("Failed to load patient profile:", error);
        return null;
      }),
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

    // 천연물 점수 (5축) - 오늘
    const todaySuppAxisScores = computeSupplementAxisScores(
      todayIngredientEvidence as any,
    );

    // 최종 레이더 점수 (80% 천연물 + 20% 생활습관) - 오늘
    const todayFinalAxisScores = combineAxisScores(
      todaySuppAxisScores,
      todayLifeAxisScores,
    );

    const todayRadarData = toRadarData(todayFinalAxisScores);

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
    const week7EvidenceByDate = new Map<
      string,
      typeof week7IngredientEvidence
    >();
    const month30EvidenceByDate = new Map<
      string,
      typeof month30IngredientEvidence
    >();

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
      for (const axis of META_AXES) {
        const sum = week7AxisScoresList.reduce(
          (acc, scores) => acc + (scores[axis] || 0),
          0,
        );
        week7AvgAxisScores[axis] = sum / week7AxisScoresList.length;
      }
    }

    if (month30AxisScoresList.length > 0) {
      for (const axis of META_AXES) {
        const sum = month30AxisScoresList.reduce(
          (acc, scores) => acc + (scores[axis] || 0),
          0,
        );
        month30AvgAxisScores[axis] = sum / month30AxisScoresList.length;
      }
    }

    // 기준선 계산: 0.7 * week7Avg + 0.3 * month30Avg
    const baselineAxisScores: Record<string, number> = {};
    for (const axis of META_AXES) {
      const week7Avg = week7AvgAxisScores[axis] ?? 0;
      const month30Avg = month30AvgAxisScores[axis] ?? 0;
      baselineAxisScores[axis] = 0.7 * week7Avg + 0.3 * month30Avg;
    }

    const baselineRadarData = toRadarData(baselineAxisScores as any);

    // 기준선 대비 변화량 계산 (평균)
    const avgDelta =
      todayRadarData.reduce((sum, item, idx) => {
        const baselineItem = baselineRadarData[idx];
        return sum + (item.score - (baselineItem?.score ?? 0));
      }, 0) / todayRadarData.length;

    // 가장 낮은 축 찾기
    const lowestAxis = todayRadarData.reduce((min, item) =>
      item.score < min.score ? item : min,
    );

    // 상위 기여 성분
    const topIngredients = topContributingIngredients(
      todayIngredientEvidence as any,
      2,
    );

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
      bloodTestData:
        bloodTestOverview || patientProfile
          ? {
              latestSummary: bloodTestOverview?.latestSummary ?? [],
              chartData: bloodTestOverview?.chartData ?? [],
              availableMetrics: bloodTestOverview?.availableMetrics ?? [],
              referenceRanges: bloodTestOverview?.referenceRanges ?? {},
              lastTestDate: bloodTestOverview?.lastTestDate ?? null,
              patientProfile,
            }
          : null,
      metabolicFuelData: todayIngredientEvidence.map((ev) => ({
        ingredient_id: ev.ingredient_id,
        ingredient_name: ev.ingredient_name,
        target_slug: ev.target_slug,
        strength: ev.strength,
        study_type: ev.study_type,
      })),
    };
  } catch (error) {
    console.error("[레이더 차트 디버깅] 에러 발생:", error);
    console.error("Failed to load health habits data:", error);
    return {
      healthHabitsData: null,
      radarData: null,
      bloodTestData: null,
      metabolicFuelData: [],
    };
  }
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex justify-end">
        <HealthReportRequestButton sourceTag="dashboard" variant="outline" />
      </div>
      {/* 6칸 그리드 레이아웃 */}
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2">
        {/* 1. 혈액검사 기본 정보 */}
        <div className="h-full min-h-[420px]">
          {loaderData.bloodTestData ? (
            <BloodTestProfileCard
              patientProfile={loaderData.bloodTestData.patientProfile}
            />
          ) : (
            <DashboardFallbackCard
              title="혈액검사 기본정보"
              description="기본 건강 프로필"
              message="데이터 없음"
            />
          )}
        </div>

        {/* 2. 최근 검사 결과 요약 */}
        <div className="h-full min-h-[420px]">
          {loaderData.bloodTestData ? (
            <BloodTestSummaryCard
              latestSummary={loaderData.bloodTestData.latestSummary}
              lastTestDate={loaderData.bloodTestData.lastTestDate}
              medicalRecords={
                loaderData.bloodTestData.patientProfile
                  ?.medical_record_transcripts ?? []
              }
            />
          ) : (
            <DashboardFallbackCard
              title="최근 검사 결과 요약"
              description="최근 검사 기준"
              message="데이터 없음"
            />
          )}
        </div>

        {/* 3. 대표 종양표지자 그래프 */}
        <div className="h-full min-h-[420px]">
          {loaderData.bloodTestData ? (
            <TumorMarkerTrendCard
              latestSummary={loaderData.bloodTestData.latestSummary}
              chartData={loaderData.bloodTestData.chartData}
              availableMetrics={loaderData.bloodTestData.availableMetrics}
              referenceRanges={loaderData.bloodTestData.referenceRanges}
            />
          ) : (
            <DashboardFallbackCard
              title="대표 종양표지자 그래프"
              description="최근 추이"
              message="데이터 없음"
            />
          )}
        </div>

        {/* 4. 생활습관 건강 점수 */}
        <div className="h-full min-h-[420px]">
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
            <DashboardFallbackCard
              title="생활습관 건강 점수"
              description="최근 평균과 오늘의 점수를 비교해 보세요"
              message="데이터 로딩 중..."
            />
          )}
        </div>

        {/* 5. 천연물 표적 프로필 */}
        <div className="h-full min-h-[420px]">
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
            <DashboardFallbackCard
              title="천연물 표적 프로필"
              description="최근 기록 기반 요약"
              message="데이터 로딩 중..."
            />
          )}
        </div>

        {/* 6. 천연물 기여도 */}
        <div className="h-full min-h-[420px]">
          <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>대사 안정화</CardTitle>
                  <CardDescription>연료 차단 맵</CardDescription>
                </div>
                <Link to="/my/dashboard/metabolic-fuel">
                  <Button variant="outline" size="sm">
                    자세히 보기
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              {loaderData.metabolicFuelData &&
              loaderData.metabolicFuelData.length > 0 ? (
                <MetabolicFuelPreview
                  evidenceData={loaderData.metabolicFuelData}
                />
              ) : (
                <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
                  데이터가 없습니다. 보조제를 입력해주세요.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface BloodTestProfileCardProps {
  patientProfile: PatientHealthProfile | null;
}

interface BloodTestSummaryCardProps {
  latestSummary: BloodTestSummary[];
  /** 최근 혈액검사 요약이 기준으로 삼는 검사일 (없으면 요약 항목의 testDate로 폴백) */
  lastTestDate: string | null;
  medicalRecords: MedicalRecordTranscriptEntry[];
}

interface TumorMarkerTrendCardProps {
  latestSummary: BloodTestSummary[];
  chartData: BloodTestChartPoint[];
  availableMetrics: string[];
  referenceRanges: Record<string, { min: number | null; max: number | null }>;
}

interface DashboardFallbackCardProps {
  title: string;
  description?: string;
  message: string;
}

function calculateBmi(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined,
): number | null {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function formatGender(gender: "M" | "F" | null | undefined): string {
  if (gender === "M") return "남성";
  if (gender === "F") return "여성";
  return "-";
}

function formatNumber(
  value: number | null | undefined,
  digits: number = 1,
): string {
  if (value === null || value === undefined) return "-";
  return value.toFixed(digits);
}

function formatShortDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, "MM/dd");
}

function pickPrimaryTumorMarker(
  latestSummary: BloodTestSummary[],
  availableMetrics: string[],
): string | null {
  const summaryMarker = latestSummary.find((item) =>
    item.metric.startsWith("tumor_marker_"),
  )?.metric;
  if (summaryMarker) return summaryMarker;
  const availableMarker = availableMetrics
    .filter((metric) => metric.startsWith("tumor_marker_"))
    .sort()[0];
  return availableMarker ?? null;
}

function brightenColor(color: string, brightnessBoost: number = 15): string {
  const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    const h = hslMatch[1];
    const s = Math.min(100, Number(hslMatch[2]) + 10);
    const l = Math.min(95, Number(hslMatch[3]) + brightnessBoost);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return color;
}

function formatChartConfig(metrics: string[]) {
  return metrics.reduce<Record<string, { label: string; color: string }>>(
    (acc, metric) => {
      acc[metric] = {
        label: getMetricLabel(metric),
        color: brightenColor(getMetricColor(metric), 20),
      };
      return acc;
    },
    {},
  );
}

function getChartYDomain(
  chartData: Array<Record<string, string | number>>,
  metric: string,
  referenceMin: number | null,
  referenceMax: number | null,
): [number, number] {
  const values = chartData
    .map((point) => point[metric] as number | undefined)
    .filter((value): value is number => value !== undefined);

  if (values.length === 0) return [0, 100];

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const span = Math.max(
    dataMax - dataMin,
    Math.max(Math.abs(dataMax), Math.abs(dataMin), 1) * 0.1,
  );
  const padding = span * 0.2;

  let min = dataMin - padding;
  let max = dataMax + padding;

  if (referenceMin !== null && referenceMin < min) {
    const rangePadding =
      (referenceMax !== null && referenceMin !== null
        ? referenceMax - referenceMin
        : dataMax - dataMin) * 0.3;
    min = referenceMin - rangePadding;
  }
  if (referenceMax !== null) {
    const rangePadding =
      referenceMin !== null && referenceMax !== null
        ? (referenceMax - referenceMin) * 0.3
        : referenceMax * 0.4;
    max = Math.max(max, referenceMax + rangePadding);
  }

  return [min, max];
}

function WarningPatternDefs({ metric }: { metric: string }) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter
          id="neon-glow-strong"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern
          id={`warning-pattern-upper-${metric}`}
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(-45)"
        >
          <rect
            width="8"
            height="8"
            fill="hsl(0, 100%, 70%)"
            fillOpacity={0.25}
          />
          <path
            d="M 0,4 L 8,4"
            stroke="hsl(0, 100%, 60%)"
            strokeWidth="2.5"
            strokeOpacity={0.6}
          />
        </pattern>
        <pattern
          id={`warning-pattern-lower-${metric}`}
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(-45)"
        >
          <rect
            width="8"
            height="8"
            fill="hsl(0, 100%, 70%)"
            fillOpacity={0.25}
          />
          <path
            d="M 0,4 L 8,4"
            stroke="hsl(0, 100%, 60%)"
            strokeWidth="2.5"
            strokeOpacity={0.6}
          />
        </pattern>
      </defs>
    </svg>
  );
}

const METRIC_DEFINITIONS_MAP = METRIC_DEFINITIONS as Record<
  string,
  { label: string; color: string }
>;

function getMetricLabel(metric: string): string {
  return METRIC_DEFINITIONS_MAP[metric]?.label ?? metric;
}

function getMetricColor(metric: string): string {
  return METRIC_DEFINITIONS_MAP[metric]?.color ?? "hsl(var(--primary))";
}

const treatmentStatusLabels: Record<string, string> = {
  ongoing: "치료 중",
  completed: "치료 완료",
  follow_up: "경과 관찰",
};

const medicationStatusLabels: Record<string, string> = {
  none: "복용 안 함",
  active: "복용 중",
};

function BloodTestProfileCard({ patientProfile }: BloodTestProfileCardProps) {
  const bmi = calculateBmi(
    patientProfile?.height_cm,
    patientProfile?.weight_kg,
  );

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>혈액검사 기본정보</CardTitle>
            <CardDescription>기본 건강 프로필</CardDescription>
          </div>
          <Link to="/my/dashboard/health">
            <Button variant="outline" size="sm">
              기본정보 입력
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">나이</div>
            <div className="font-medium">
              {patientProfile?.age ? `${patientProfile.age}세` : "-"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">성별</div>
            <div className="font-medium">
              {formatGender(patientProfile?.gender)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">질환명</div>
            <div className="font-medium">{patientProfile?.disease || "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">질환 상태</div>
            <div className="font-medium">
              {patientProfile?.disease_status ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">치료 상태</div>
            <div className="font-medium">
              {treatmentStatusLabels[patientProfile?.treatment_status ?? ""] ??
                patientProfile?.treatment_status ??
                "-"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">약물 복용</div>
            <div className="font-medium">
              {patientProfile?.medication_status === "active"
                ? `${medicationStatusLabels["active"]} (${patientProfile?.medication_name ?? "약물명 미입력"})`
                : (medicationStatusLabels[
                    patientProfile?.medication_status ?? ""
                  ] ?? "-")}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">키</div>
            <div className="font-medium">
              {patientProfile?.height_cm != null
                ? `${patientProfile.height_cm} cm`
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">몸무게</div>
            <div className="font-medium">
              {patientProfile?.weight_kg != null
                ? `${patientProfile.weight_kg} kg`
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">BMI</div>
            <div className="font-medium">{formatNumber(bmi, 1)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getLatestMedicalByDate(records: MedicalRecordTranscriptEntry[]) {
  if (records.length === 0) {
    return {
      date: null as string | null,
      entries: [] as MedicalRecordTranscriptEntry[],
    };
  }
  const dates = [...new Set(records.map((r) => r.test_date))].sort((a, b) =>
    b.localeCompare(a),
  );
  const date = dates[0] ?? null;
  const entries = date ? records.filter((r) => r.test_date === date) : [];
  return { date, entries };
}

function truncatePreview(text: string, maxLen: number) {
  const t = text.trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

function BloodTestSummaryCard({
  latestSummary,
  lastTestDate,
  medicalRecords,
}: BloodTestSummaryCardProps) {
  const previewItems = latestSummary.slice(0, 8);
  const summaryTestDate = lastTestDate ?? previewItems[0]?.testDate ?? null;
  const formattedBloodDate =
    summaryTestDate && !Number.isNaN(new Date(summaryTestDate).getTime())
      ? new Date(summaryTestDate).toLocaleDateString("ko-KR")
      : null;

  const { date: latestMedicalDate, entries: latestMedicalEntries } =
    getLatestMedicalByDate(medicalRecords);
  const formattedMedicalDate =
    latestMedicalDate && !Number.isNaN(new Date(latestMedicalDate).getTime())
      ? new Date(latestMedicalDate).toLocaleDateString("ko-KR")
      : null;

  const hasBlood = previewItems.length > 0;
  const hasMedical = latestMedicalEntries.length > 0;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>최근 검사 결과 요약</CardTitle>
            <CardDescription>
              혈액검사·의무기록 중 최근 등록된 결과를 요약해 보여줍니다.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/my/dashboard/health/consent">
              <Button variant="outline" size="sm">
                병원 검사 입력
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {!hasBlood && !hasMedical ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
            최근 검사 결과가 없습니다.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {hasBlood ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 border-b pb-1">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    혈액검사
                  </span>
                  {formattedBloodDate ? (
                    <span className="text-muted-foreground text-xs">
                      검사일{" "}
                      <span className="text-foreground font-medium">
                        {formattedBloodDate}
                      </span>
                    </span>
                  ) : null}
                </div>
                <div className="space-y-3 text-sm">
                  {previewItems.map((item) => (
                    <div
                      key={item.metric}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="text-muted-foreground">{item.label}</div>
                      <div className="font-medium">
                        {item.value === null
                          ? "데이터 없음"
                          : `${item.value} ${item.unit}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                등록된 혈액검사 요약이 없습니다.
              </p>
            )}

            {hasMedical ? (
              <div className="space-y-2 border-t pt-2">
                <div className="flex items-center justify-between gap-2 border-b pb-1">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    의무기록
                  </span>
                  {formattedMedicalDate ? (
                    <span className="text-muted-foreground text-xs">
                      검사일{" "}
                      <span className="text-foreground font-medium">
                        {formattedMedicalDate}
                      </span>
                    </span>
                  ) : null}
                </div>
                <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1 text-sm">
                  {latestMedicalEntries.map((rec, idx) => (
                    <div
                      key={`${rec.test_date}-${idx}`}
                      className="bg-muted/50 space-y-1.5 rounded-md border p-2.5 text-xs"
                    >
                      {latestMedicalEntries.length > 1 ? (
                        <div className="text-muted-foreground text-[10px]">
                          항목 {idx + 1}
                        </div>
                      ) : null}
                      {rec.test_content ? (
                        <div>
                          <span className="text-foreground font-medium">
                            검사내용
                          </span>
                          <p className="text-muted-foreground mt-0.5 line-clamp-4 whitespace-pre-wrap">
                            {truncatePreview(rec.test_content, 400)}
                          </p>
                        </div>
                      ) : null}
                      {rec.clinical_information ? (
                        <div>
                          <span className="text-foreground font-medium">
                            Clinical Information
                          </span>
                          <p className="text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-wrap">
                            {truncatePreview(rec.clinical_information, 200)}
                          </p>
                        </div>
                      ) : null}
                      {rec.finding ? (
                        <div>
                          <span className="text-foreground font-medium">
                            Finding
                          </span>
                          <p className="text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-wrap">
                            {truncatePreview(rec.finding, 200)}
                          </p>
                        </div>
                      ) : null}
                      {rec.conclusion ? (
                        <div>
                          <span className="text-foreground font-medium">
                            Conclusion
                          </span>
                          <p className="text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-wrap">
                            {truncatePreview(rec.conclusion, 200)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                <Link
                  to="/my/dashboard/health"
                  className="text-primary inline-block text-xs font-medium underline-offset-4 hover:underline"
                >
                  건강 정보에서 전체 보기
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground border-t pt-2 text-xs">
                등록된 의무기록이 없습니다.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TumorMarkerTrendCard({
  latestSummary,
  chartData,
  availableMetrics,
  referenceRanges,
}: TumorMarkerTrendCardProps) {
  const primaryTumorMarker = pickPrimaryTumorMarker(
    latestSummary,
    availableMetrics,
  );
  const miniChartData = chartData.slice(-12);
  const chartDataWithTimestamps = miniChartData.map((point) => ({
    ...point,
    dateTimestamp: new Date(point.date).getTime(),
  }));
  const refRange = primaryTumorMarker
    ? referenceRanges[primaryTumorMarker]
    : null;
  const yDomain = primaryTumorMarker
    ? getChartYDomain(
        chartDataWithTimestamps,
        primaryTumorMarker,
        refRange?.min ?? null,
        refRange?.max ?? null,
      )
    : [0, 100];
  const hasReferenceRange =
    refRange && (refRange.min !== null || refRange.max !== null);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>대표 종양표지자 그래프</CardTitle>
            <CardDescription>최근 추이</CardDescription>
          </div>
          <Link to="/my/dashboard/health/consent">
            <Button variant="outline" size="sm">
              혈액검사 입력
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {primaryTumorMarker && chartDataWithTimestamps.length > 1 ? (
          <div className="space-y-3">
            <WarningPatternDefs metric={primaryTumorMarker} />
            <div className="text-muted-foreground text-xs font-medium">
              {getMetricLabel(primaryTumorMarker)}
            </div>
            <div className="h-48 overflow-hidden rounded-md">
              <ChartContainer config={formatChartConfig([primaryTumorMarker])}>
                <ComposedChart
                  accessibilityLayer
                  data={chartDataWithTimestamps}
                  margin={{ left: 12, right: 20, top: 12, bottom: 12 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    strokeWidth={1.5}
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="dateTimestamp"
                    type="number"
                    scale="time"
                    domain={[
                      (dataMin: number) => dataMin - 86400000,
                      (dataMax: number) => dataMax + 86400000,
                    ]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) =>
                      formatShortDate(new Date(value).toISOString())
                    }
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={yDomain}
                    tickFormatter={(value) => Number(value).toFixed(2)}
                  />
                  {hasReferenceRange && (
                    <>
                      {refRange?.max !== null &&
                        (yDomain[1] as number) > refRange.max && (
                          <ReferenceArea
                            y1={refRange.max}
                            y2={yDomain[1] as number}
                            fill={`url(#warning-pattern-upper-${primaryTumorMarker})`}
                            stroke="hsl(0, 100%, 65%)"
                            strokeWidth={2}
                            strokeOpacity={0.5}
                            strokeDasharray="4 4"
                          />
                        )}
                      {refRange?.min !== null &&
                        (yDomain[0] as number) < refRange.min && (
                          <ReferenceArea
                            y1={yDomain[0] as number}
                            y2={refRange.min}
                            fill={`url(#warning-pattern-lower-${primaryTumorMarker})`}
                            stroke="hsl(0, 100%, 65%)"
                            strokeWidth={2}
                            strokeOpacity={0.5}
                            strokeDasharray="4 4"
                          />
                        )}
                    </>
                  )}
                  <Line
                    dataKey={primaryTumorMarker}
                    type="monotone"
                    stroke={brightenColor(
                      getMetricColor(primaryTumorMarker),
                      25,
                    )}
                    strokeWidth={3}
                    filter="url(#neon-glow-strong)"
                    dot={{
                      r: 5,
                      strokeWidth: 2.5,
                      stroke: "#fff",
                      fill: brightenColor(
                        getMetricColor(primaryTumorMarker),
                        20,
                      ),
                      filter: "url(#neon-glow)",
                    }}
                    activeDot={{
                      r: 8,
                      strokeWidth: 3,
                      stroke: "#fff",
                      fill: brightenColor(
                        getMetricColor(primaryTumorMarker),
                        25,
                      ),
                      filter: "url(#neon-glow)",
                    }}
                    connectNulls
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
            대표 종양표지자 데이터를 찾을 수 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetabolicFuelPreviewProps {
  evidenceData: Array<{
    ingredient_id: string;
    ingredient_name: string;
    target_slug: string;
    strength: number;
    study_type: string;
  }>;
}

function MetabolicFuelPreview({ evidenceData }: MetabolicFuelPreviewProps) {
  const targetSlugs = new Set(evidenceData.map((ev) => ev.target_slug));
  const targetCount = targetSlugs.size;
  const ingredientCount = new Set(evidenceData.map((ev) => ev.ingredient_id))
    .size;

  const fuelCounts = {
    glucose: 0,
    glutamine: 0,
    fatty: 0,
  };

  const glucoseTargets = [
    "glut1",
    "insulin",
    "pppathway",
    "oxphos",
    "aerobic_glycolysis",
  ];
  const glutamineTargets = [
    "igf-1",
    "gln_oxphos",
    "mtor",
    "macropinocytosis",
    "nucleoside_salvage",
    "glutaminolysis",
  ];
  const fattyTargets = [
    "acetate-srebp-1",
    "acly",
    "fas",
    "fao",
    "srebp-1",
    "mevalonate-srebp-2",
  ];

  evidenceData.forEach((ev) => {
    if (glucoseTargets.includes(ev.target_slug)) fuelCounts.glucose++;
    if (glutamineTargets.includes(ev.target_slug)) fuelCounts.glutamine++;
    if (fattyTargets.includes(ev.target_slug)) fuelCounts.fatty++;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground text-xs">Glucose</div>
          <div className="text-lg font-semibold">{fuelCounts.glucose}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground text-xs">Glutamine</div>
          <div className="text-lg font-semibold">{fuelCounts.glutamine}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground text-xs">Fatty Acids</div>
          <div className="text-lg font-semibold">{fuelCounts.fatty}</div>
        </div>
      </div>
      <div className="text-muted-foreground text-sm">
        총 {targetCount}개 표적, {ingredientCount}개 성분에서 증거 발견
      </div>
    </div>
  );
}

function DashboardFallbackCard({
  title,
  description,
  message,
}: DashboardFallbackCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground text-sm">{message}</div>
      </CardContent>
    </Card>
  );
}
