import type { RecommendationResult } from "../schemas/recommendation.schema";

export type ScoreAxis = "air" | "weather" | "forest" | "exercise" | "accessibility";

export const SCORE_AXIS_LABELS: Record<ScoreAxis, string> = {
  air: "공기",
  weather: "기상",
  forest: "숲",
  exercise: "운동",
  accessibility: "접근성",
};

export type RadarPoint = {
  axis: ScoreAxis;
  label: string;
  value: number;
};

export function toRadarPoints(result: RecommendationResult): RadarPoint[] {
  const order: ScoreAxis[] = [
    "air",
    "weather",
    "forest",
    "exercise",
    "accessibility",
  ];
  return order.map((axis) => ({
    axis,
    label: SCORE_AXIS_LABELS[axis],
    value: clamp(result.scores[axis], 0, 100),
  }));
}

export function scoreBadgeLabel(total: number): string {
  if (total >= 85) return "오늘 매우 추천";
  if (total >= 70) return "오늘 좋아요";
  if (total >= 55) return "괜찮아요";
  return "참고용";
}

export function summarizeWeather(result: RecommendationResult): string {
  const parts: string[] = [];
  if (typeof result.current_temp_c === "number") {
    parts.push(`${Math.round(result.current_temp_c)}℃`);
  }
  if (typeof result.current_humidity === "number") {
    parts.push(`습도 ${Math.round(result.current_humidity)}%`);
  }
  if (typeof result.current_wind_ms === "number") {
    parts.push(`바람 ${result.current_wind_ms.toFixed(1)}m/s`);
  }
  return parts.join(" · ");
}

export function summarizeAir(result: RecommendationResult): string {
  const parts: string[] = [];
  if (typeof result.current_pm25 === "number") {
    parts.push(`PM2.5 ${Math.round(result.current_pm25)}`);
  }
  if (typeof result.current_pm10 === "number") {
    parts.push(`PM10 ${Math.round(result.current_pm10)}`);
  }
  if (typeof result.predicted_phytoncide_pptv === "number") {
    parts.push(`예상 피톤치드 ${Math.round(result.predicted_phytoncide_pptv)} pptv`);
  }
  return parts.join(" · ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
