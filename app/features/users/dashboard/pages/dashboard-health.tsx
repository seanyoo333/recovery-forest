import type { Route } from "./+types/dashboard-health";

import { Link } from "react-router";
import { Line } from "recharts";
import { CartesianGrid, LineChart, XAxis } from "recharts";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import type { ChartConfig } from "~/core/components/ui/chart";
import { ChartTooltipContent } from "~/core/components/ui/chart";
import { ChartTooltip } from "~/core/components/ui/chart";
import { ChartContainer } from "~/core/components/ui/chart";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import {
  METRIC_DEFINITIONS,
  PRIMARY_METRICS,
  getBloodTestOverview,
  getPatientHealthProfile,
} from "../queries";

function formatChartConfig(
  metrics: Array<keyof typeof METRIC_DEFINITIONS>,
): ChartConfig {
  return metrics.reduce<Record<string, { label: string; color: string }>>(
    (acc, metric) => {
      const definition = METRIC_DEFINITIONS[metric];
      if (definition) {
        acc[metric] = {
          label: definition.label,
          color: definition.color,
        };
      }
      return acc;
    },
    {},
  ) satisfies ChartConfig;
}

export const meta: Route.MetaFunction = () => {
  return [{ title: `Dashboard | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  const [patientProfile, overview] = await Promise.all([
    getPatientHealthProfile(client, userId).catch((error) => {
      console.error("Failed to load patient profile:", error);
      return null;
    }),
    getBloodTestOverview(client, userId).catch((error) => {
      console.error("Failed to load blood test overview:", error);
      return {
        chartData: [],
        availableMetrics: [],
        latestSummary: [],
        lastTestDate: null,
      };
    }),
  ]);

  return {
    patientProfile,
    ...overview,
  };
};

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function DashboardHealth({ loaderData }: Route.ComponentProps) {
  const {
    patientProfile,
    chartData,
    availableMetrics,
    latestSummary,
    lastTestDate,
  } = loaderData as LoaderData;

  const hasChartData = chartData.length > 0;

  const availableMetricKeys = availableMetrics.reduce<
    Array<keyof typeof METRIC_DEFINITIONS>
  >((acc, metric) => {
    if (metric in METRIC_DEFINITIONS) {
      acc.push(metric as keyof typeof METRIC_DEFINITIONS);
    }
    return acc;
  }, []);

  const primaryMetrics = PRIMARY_METRICS.filter((metric) =>
    availableMetricKeys.includes(metric),
  );

  const primaryMetricSet = new Set(primaryMetrics);

  const secondaryMetrics = availableMetricKeys.filter(
    (metric) => !primaryMetricSet.has(metric),
  );

  const groupedSecondaryMetrics: Array<Array<keyof typeof METRIC_DEFINITIONS>> =
    [];
  secondaryMetrics.forEach((metric) => {
    const lastGroup =
      groupedSecondaryMetrics[groupedSecondaryMetrics.length - 1];
    if (!lastGroup || lastGroup.length === 2) {
      groupedSecondaryMetrics.push([metric as keyof typeof METRIC_DEFINITIONS]);
    } else {
      lastGroup.push(metric as keyof typeof METRIC_DEFINITIONS);
    }
  });

  const bmi =
    patientProfile?.height_cm && patientProfile?.weight_kg
      ? patientProfile.weight_kg / Math.pow(patientProfile.height_cm / 100, 2)
      : null;

  const latestSummaryByDate = latestSummary.sort((a, b) =>
    b.testDate.localeCompare(a.testDate),
  );

  const treatmentStatusLabels: Record<string, string> = {
    ongoing: "치료 중",
    completed: "치료 완료",
    follow_up: "경과 관찰",
  };

  const medicationStatusLabels: Record<string, string> = {
    none: "복용 안 함",
    active: "복용 중",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">혈액검사 분석</h1>
        <Link to="/my/dashboard/health/consent">
          <Button>새 검사 결과 입력</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>환자 기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {patientProfile ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">나이</span>
                  <p className="text-muted-foreground">
                    {patientProfile.age}세
                  </p>
                </div>
                <div>
                  <span className="font-medium">성별</span>
                  <p className="text-muted-foreground">
                    {patientProfile.gender === "M" ? "남성" : "여성"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">질환명</span>
                  <p className="text-muted-foreground">
                    {patientProfile.disease}
                  </p>
                </div>
                <div>
                  <span className="font-medium">질환 상태</span>
                  <p className="text-muted-foreground">
                    {patientProfile.disease_status ?? "-"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">치료 상태</span>
                  <p className="text-muted-foreground">
                    {treatmentStatusLabels[patientProfile.treatment_status] ??
                      patientProfile.treatment_status ??
                      "-"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">약물 복용</span>
                  <p className="text-muted-foreground">
                    {patientProfile.medication_status === "active"
                      ? `${medicationStatusLabels[patientProfile.medication_status] ?? "복용 중"} (${
                          patientProfile.medication_name ?? "약물명 미입력"
                        })`
                      : (medicationStatusLabels[
                          patientProfile.medication_status
                        ] ?? "복용 상태 미입력")}
                  </p>
                </div>
                <div>
                  <span className="font-medium">키</span>
                  <p className="text-muted-foreground">
                    {patientProfile.height_cm ?? "-"} cm
                  </p>
                </div>
                <div>
                  <span className="font-medium">몸무게</span>
                  <p className="text-muted-foreground">
                    {patientProfile.weight_kg ?? "-"} kg
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">BMI</span>
                  <p className="text-muted-foreground">
                    {bmi ? bmi.toFixed(1) : "-"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                아직 환자 기본 정보가 등록되지 않았습니다.{" "}
                <Link to="/my/dashboard/health/consent" className="underline">
                  기본 정보를 입력해주세요.
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 검사 결과 요약</CardTitle>
          </CardHeader>
          <CardContent>
            {latestSummaryByDate.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {latestSummaryByDate.map((item) => (
                    <div key={item.metric}>
                      <span className="font-medium">{item.label}:</span>{" "}
                      <span className="text-muted-foreground">
                        {item.value}
                        {item.unit ? ` ${item.unit}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-muted-foreground text-xs">
                  마지막 검사일:{" "}
                  {lastTestDate
                    ? new Date(lastTestDate).toLocaleDateString("ko-KR")
                    : "-"}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                아직 입력된 검사 결과가 없습니다.{" "}
                <Link to="/my/dashboard/health/consent" className="underline">
                  첫 검사 결과를 등록해보세요.
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {hasChartData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {primaryMetrics.map((metric) => (
              <Card key={metric}>
                <CardHeader>
                  <CardTitle>{METRIC_DEFINITIONS[metric].label} 추이</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={formatChartConfig([metric])}>
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
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <Line
                        dataKey={metric}
                        type="natural"
                        stroke={METRIC_DEFINITIONS[metric].color}
                        strokeWidth={2}
                        dot={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ))}
          </div>

          {groupedSecondaryMetrics.length > 0 && (
            <div className="space-y-6">
              {groupedSecondaryMetrics.map((group, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-6 lg:grid-cols-2"
                >
                  {group.map((metric) => (
                    <Card key={metric}>
                      <CardHeader>
                        <CardTitle>
                          {METRIC_DEFINITIONS[metric].label} 추이
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={formatChartConfig([metric])}>
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
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tickFormatter={(value) =>
                                new Date(value).toLocaleDateString("ko-KR", {
                                  month: "short",
                                  day: "numeric",
                                })
                              }
                            />
                            <Line
                              dataKey={metric}
                              type="natural"
                              stroke={METRIC_DEFINITIONS[metric].color}
                              strokeWidth={2}
                              dot={false}
                            />
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent hideLabel />}
                            />
                          </LineChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  ))}
                  {group.length === 1 && <div className="hidden lg:block" />}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>검사 데이터 없음</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              아직 차트를 그릴 수 있는 검사 데이터가 없습니다.{" "}
              <Link to="/my/dashboard/health/consent" className="underline">
                신규 검사 결과를 입력해주세요.
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
