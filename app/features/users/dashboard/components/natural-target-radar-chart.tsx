import type { MetaAxis } from "../constants";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

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
  score: {
    label: "점수",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export interface RadarDataPoint {
  axis: MetaAxis;
  label: string;
  score: number;
}

interface NaturalTargetRadarChartProps {
  radarData: RadarDataPoint[];
  subtitle?: string;
  topLine?: string;
  subLine?: string;
}

export function NaturalTargetRadarChart({
  radarData,
  subtitle,
  topLine,
  subLine,
}: NaturalTargetRadarChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>천연물 표적 프로필</CardTitle>
        <CardDescription>{subtitle ?? "최근 기록 기반 요약"}</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <RadarChart data={radarData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="label" />
            <PolarGrid />
            <Radar
              dataKey="score"
              fill="var(--color-score)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1 text-sm">
        {topLine && <div className="font-medium">{topLine}</div>}
        {subLine && <div className="text-muted-foreground">{subLine}</div>}
      </CardFooter>
    </Card>
  );
}
