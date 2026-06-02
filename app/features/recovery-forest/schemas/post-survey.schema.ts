import { z } from "zod";

import { wellnessScore } from "./wellness.schema";

/**
 * 사후 설문 = 사전과 동일한 웰니스 축(델타 계산 가능) + 한 줄 인상.
 */
export const postSurveySchema = z.object({
  sleep_score: wellnessScore,
  fatigue_score: wellnessScore,
  mood_score: wellnessScore,
  stress_score: wellnessScore,
  impression: z.string().trim().max(200).optional().or(z.literal("")),
});

export type PostSurveyInput = z.infer<typeof postSurveySchema>;
