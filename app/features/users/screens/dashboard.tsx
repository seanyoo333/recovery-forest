import type { Route } from "./+types/dashboard";

import { LineChart } from "recharts";
import { CartesianGrid, XAxis } from "recharts";
import { Line } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { ChartContainer } from "~/core/components/ui/chart";
import type { ChartConfig } from "~/core/components/ui/chart";
import { ChartTooltip } from "~/core/components/ui/chart";
import { ChartTooltipContent } from "~/core/components/ui/chart";

export const meta: Route.MetaFunction = () => {
  return [{ title: `Dashboard | ${import.meta.env.VITE_APP_NAME}` }];
};

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

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
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
  );
}
