import type { Route } from "./+types/admin-product-chart";

import { Area, AreaChart } from "recharts";
import { CartesianGrid, XAxis } from "recharts";

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

import { requireAdminRole, requireAuthentication } from "../guards.server";
import { getWeeklyEventStats } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "제품 차트 | 관리자 | Evidence Base" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  await requireAdminRole(client);

  const weeklyStats = await getWeeklyEventStats(client);

  return {
    chartData: weeklyStats,
  };
};

const chartConfig = {
  product_view: {
    label: "Product Views",
    color: "hsl(var(--primary))",
  },
  product_visit: {
    label: "Product Visits",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

export default function AdminProductChartPage({
  loaderData,
}: Route.ComponentProps) {
  const { chartData } = loaderData;

  return (
    <div className="space-y-5">
      <h1 className="mb-6 text-2xl font-semibold">Analytics</h1>
      <Card className="w-full md:w-1/2">
        <CardHeader>
          <CardTitle>Weekly Event Statistics</CardTitle>
          {chartData && chartData.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              최근 {chartData.length}주간 데이터
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">데이터가 없습니다</p>
          )}
        </CardHeader>
        <CardContent>
          {chartData && chartData.length > 0 ? (
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  padding={{ left: 15, right: 15 }}
                  angle={0}
                  textAnchor="end"
                  height={60}
                />
                <Area
                  dataKey="product_view"
                  type="natural"
                  stroke="var(--color-product_view)"
                  fill="var(--color-product_view)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  dataKey="product_visit"
                  type="natural"
                  stroke="var(--color-product_visit)"
                  fill="var(--color-product_visit)"
                  strokeWidth={2}
                  dot={false}
                />
                <ChartTooltip
                  cursor={false}
                  wrapperStyle={{ minWidth: "200px" }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="text-muted-foreground flex h-80 items-center justify-center">
              표시할 데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
