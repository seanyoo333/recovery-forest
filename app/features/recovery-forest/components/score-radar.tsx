import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import type { RadarPoint } from "../services/score-formatter";

type Props = {
  points: RadarPoint[];
  size?: number;
};

export function ScoreRadar({ points, size = 180 }: Props) {
  return (
    <div style={{ width: "100%", height: size }} aria-label="5축 회복점수 레이더 차트">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={points} outerRadius="75%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="회복점수"
            dataKey="value"
            stroke="#059669"
            fill="#10b981"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
