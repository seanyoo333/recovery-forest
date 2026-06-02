import { z } from "zod";

export const HEALTH_PRIORITIES = [
  "air",
  "stress",
  "accessibility",
  "immunity",
  "rest",
  "convenience",
  "exercise",
] as const;
export type HealthPriority = (typeof HEALTH_PRIORITIES)[number];

export const FITNESS_LEVELS = ["low", "mid", "high"] as const;
export type FitnessLevel = (typeof FITNESS_LEVELS)[number];

export const TRAVEL_TIMES = [30, 60, 120] as const;
export type TravelTime = (typeof TRAVEL_TIMES)[number];

export const PREFERRED_ACTIVITIES = [
  "walking",
  "meditation",
  "program",
  "free",
] as const;
export type PreferredActivity = (typeof PREFERRED_ACTIVITIES)[number];

export const recommendationInputSchema = z.object({
  user_sido: z.string().min(1, "시·도를 선택해주세요"),
  user_sigungu: z.string().min(1, "시·군·구를 선택해주세요"),
  user_priorities: z
    .array(z.enum(HEALTH_PRIORITIES))
    .min(1, "관심사를 최소 1개 선택해주세요")
    .max(3, "관심사는 최대 3개까지 선택할 수 있어요"),
  user_fitness_level: z.enum(FITNESS_LEVELS),
  user_travel_time_min: z.union([z.literal(30), z.literal(60), z.literal(120)]),
  user_preferred_activity: z.enum(PREFERRED_ACTIVITIES),
});

export type RecommendationInput = z.infer<typeof recommendationInputSchema>;

export const PRIORITY_LABELS: Record<HealthPriority, string> = {
  air: "공기",
  stress: "스트레스 완화",
  accessibility: "접근성",
  immunity: "면역 관심",
  rest: "휴식",
  convenience: "편리함",
  exercise: "운동",
};

export const FITNESS_LABELS: Record<FitnessLevel, string> = {
  low: "낮음",
  mid: "보통",
  high: "높음",
};

export const ACTIVITY_LABELS: Record<PreferredActivity, string> = {
  walking: "산책",
  meditation: "명상",
  program: "체험 프로그램",
  free: "자유",
};
