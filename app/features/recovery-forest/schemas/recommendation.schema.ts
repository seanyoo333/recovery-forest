import { z } from "zod";

export const FOREST_TYPES = [
  "healing_forest",
  "recreation_forest",
  "urban_forest",
  "trail",
] as const;
export type ForestType = (typeof FOREST_TYPES)[number];

export const FOREST_TYPE_LABELS: Record<ForestType, string> = {
  healing_forest: "치유의숲",
  recreation_forest: "자연휴양림",
  urban_forest: "도시숲",
  trail: "둘레길",
};

const scoreBreakdownSchema = z.object({
  air: z.number().min(0).max(100),
  weather: z.number().min(0).max(100),
  forest: z.number().min(0).max(100),
  exercise: z.number().min(0).max(100),
  accessibility: z.number().min(0).max(100),
});

export const recommendationProgramSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const recommendationResultSchema = z.object({
  rank: z.number().int().min(1).max(20),
  forest_id: z.string().uuid(),
  name: z.string(),
  type: z.enum(FOREST_TYPES),
  region: z.string(),
  total_score: z.number().min(0).max(100),
  scores: scoreBreakdownSchema,
  predicted_phytoncide_pptv: z.number().nullable().optional(),
  current_pm25: z.number().nullable().optional(),
  current_pm10: z.number().nullable().optional(),
  current_temp_c: z.number().nullable().optional(),
  current_humidity: z.number().nullable().optional(),
  current_wind_ms: z.number().nullable().optional(),
  travel_time_min: z.number().int().nullable().optional(),
  reason: z.string(),
  caution: z.string().nullable().optional(),
  recommended_activity: z.string(),
  programs: z.array(recommendationProgramSchema).default([]),
});

export type RecommendationResult = z.infer<typeof recommendationResultSchema>;

export const recommendationResponseSchema = z.object({
  session_id: z.string(),
  status: z.enum(["pending", "completed", "failed"]),
  recommended_at: z.string().nullable().optional(),
  ai_summary: z.string().nullable().optional(),
  results: z.array(recommendationResultSchema).default([]),
  last_error: z.string().nullable().optional(),
});

export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;
