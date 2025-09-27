import type { Route } from "./+types/dashboard-health";

import { Link } from "react-router";
import { Line } from "recharts";
import { CartesianGrid, LineChart, XAxis, YAxis } from "recharts";

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

export const meta: Route.MetaFunction = () => {
  return [{ title: `Dashboard | ${import.meta.env.VITE_APP_NAME}` }];
};

// 가상의 혈액검사 데이터 5개
const bloodTestData = [
  {
    date: "2024-01-15",
    lmr: 2.5,
    nlr: 1.8,
    platelet: 250,
    crp: 0.5,
    glucose: 95,
    hgbA1c: 5.7,
    cholesterol: 180,
    ldh: 140,
    ast: 25,
    alt: 30,
    egfr: 90,
    vitaminD3: 25.0,
    tumorMarker: 2.5,
  },
  {
    date: "2024-02-15",
    lmr: 2.8,
    nlr: 1.6,
    platelet: 265,
    crp: 0.3,
    glucose: 92,
    hgbA1c: 5.6,
    cholesterol: 175,
    ldh: 135,
    ast: 23,
    alt: 28,
    egfr: 92,
    vitaminD3: 28.5,
    tumorMarker: 2.3,
  },
  {
    date: "2024-03-15",
    lmr: 3.0,
    nlr: 1.5,
    platelet: 280,
    crp: 0.2,
    glucose: 88,
    hgbA1c: 5.5,
    cholesterol: 170,
    ldh: 130,
    ast: 22,
    alt: 26,
    egfr: 94,
    vitaminD3: 32.0,
    tumorMarker: 2.1,
  },
  {
    date: "2024-04-15",
    lmr: 3.2,
    nlr: 1.4,
    platelet: 290,
    crp: 0.1,
    glucose: 85,
    hgbA1c: 5.4,
    cholesterol: 165,
    ldh: 125,
    ast: 20,
    alt: 24,
    egfr: 96,
    vitaminD3: 35.5,
    tumorMarker: 1.9,
  },
  {
    date: "2024-05-15",
    lmr: 3.5,
    nlr: 1.3,
    platelet: 300,
    crp: 0.1,
    glucose: 82,
    hgbA1c: 5.3,
    cholesterol: 160,
    ldh: 120,
    ast: 18,
    alt: 22,
    egfr: 98,
    vitaminD3: 38.0,
    tumorMarker: 1.8,
  },
];

const chartConfig = {
  glucose: {
    label: "혈당",
    color: "var(--chart-1)",
  },
  hgbA1c: {
    label: "당화혈색소",
    color: "var(--chart-2)",
  },
  crp: {
    label: "CRP",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export default function DashboardHealth() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">혈액검사 분석</h1>
        <Link to="/my/dashboard/health/consent">
          <Button>새 검사 결과 입력</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 혈당 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>혈당 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart
                accessibilityLayer
                data={bloodTestData}
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
                  dataKey="glucose"
                  type="natural"
                  stroke="var(--chart-1)"
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

        {/* 당화혈색소 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>당화혈색소 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart
                accessibilityLayer
                data={bloodTestData}
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
                  dataKey="hgbA1c"
                  type="natural"
                  stroke="var(--chart-2)"
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

        {/* CRP 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>CRP 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart
                accessibilityLayer
                data={bloodTestData}
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
                  dataKey="crp"
                  type="natural"
                  stroke="var(--chart-3)"
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

        {/* 최근 검사 결과 요약 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 검사 결과 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">LMR:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].lmr}
                </div>
                <div>
                  <span className="font-medium">NLR:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].nlr}
                </div>
                <div>
                  <span className="font-medium">Platelet:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].platelet}
                </div>
                <div>
                  <span className="font-medium">CRP:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].crp}
                </div>
                <div>
                  <span className="font-medium">Glucose:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].glucose}
                </div>
                <div>
                  <span className="font-medium">HgbA1c:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].hgbA1c}
                </div>
                <div>
                  <span className="font-medium">Cholesterol:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].cholesterol}
                </div>
                <div>
                  <span className="font-medium">LDH:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].ldh}
                </div>
                <div>
                  <span className="font-medium">AST:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].ast}
                </div>
                <div>
                  <span className="font-medium">ALT:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].alt}
                </div>
                <div>
                  <span className="font-medium">eGFR:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].egfr}
                </div>
                <div>
                  <span className="font-medium">Vitamin D3:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].vitaminD3}
                </div>
                <div>
                  <span className="font-medium">Tumor Marker:</span>{" "}
                  {bloodTestData[bloodTestData.length - 1].tumorMarker}
                </div>
              </div>
              <div className="text-muted-foreground text-xs">
                마지막 검사일:{" "}
                {new Date(
                  bloodTestData[bloodTestData.length - 1].date,
                ).toLocaleDateString("ko-KR")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
