import { z } from "zod";

import { recommendationInputSchema } from "./input.schema";
import { wellnessScore } from "./wellness.schema";

/**
 * 사전 설문 = 자가보고 웰니스 + 추천 입력(장소 매칭용).
 * 기존 recommendationInputSchema 를 그대로 확장해 한 폼으로 받는다.
 */
export const preSurveySchema = recommendationInputSchema.extend({
  sleep_score: wellnessScore,
  fatigue_score: wellnessScore,
  mood_score: wellnessScore,
  stress_score: wellnessScore,
  // 항암 치료 종료 후 경과 개월 (선택). 0 = 치료 중/직후.
  months_since_treatment: z
    .number()
    .int()
    .min(0)
    .max(600)
    .nullable()
    .optional(),
});

export type PreSurveyInput = z.infer<typeof preSurveySchema>;
