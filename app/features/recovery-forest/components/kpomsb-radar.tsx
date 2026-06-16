import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import {
  KPOMSB_AXES,
  KPOMSB_MAX,
  type KpomsbScores,
} from "../schemas/prescribe-input.schema";

/**
 * K-POMS-B 6각 기분 레이더(0~20). 결과 헤더에서 AI 상태해석을 시각 보조.
 * indigo 톤으로 "AI 추론" 영역과 색을 맞춘다. (score-radar.tsx 패턴 복제)
 */
export function KpomsbRadar({
  scores,
  size = 200,
}: {
  scores: KpomsbScores;
  size?: number;
}) {
  const data = KPOMSB_AXES.map((axis) => ({ axis, value: scores[axis] }));
  return (
    <div
      style={{ width: "100%", height: size }}
      aria-label="K-POMS-B 기분 상태 레이더 차트"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, KPOMSB_MAX]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="기분상태"
            dataKey="value"
            stroke="#6366f1"
            fill="#818cf8"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
