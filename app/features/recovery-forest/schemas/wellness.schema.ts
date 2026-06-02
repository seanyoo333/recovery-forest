import { z } from "zod";

/**
 * 자가보고 웰니스 축. 사전/사후 설문, 처방의 target_outcome,
 * 리포트의 델타 계산이 모두 이 축 정의를 공유한다.
 */
export const WELLNESS_AXES = ["sleep", "fatigue", "mood", "stress"] as const;
export type WellnessAxis = (typeof WELLNESS_AXES)[number];

export const WELLNESS_AXIS_LABELS: Record<WellnessAxis, string> = {
  sleep: "수면",
  fatigue: "피로",
  mood: "기분",
  stress: "스트레스",
};

/**
 * 축별 "개선" 방향. 점수가 1~10일 때,
 * - increase: 점수가 오를수록 좋아짐 (수면, 기분)
 * - decrease: 점수가 내릴수록 좋아짐 (피로, 스트레스)
 */
export const WELLNESS_AXIS_IMPROVEMENT: Record<
  WellnessAxis,
  "increase" | "decrease"
> = {
  sleep: "increase",
  mood: "increase",
  fatigue: "decrease",
  stress: "decrease",
};

/** 단일 웰니스 점수 (1~10 정수) */
export const wellnessScore = z.number().int().min(1).max(10);

/** 네 축 전체 점수 묶음 */
export const wellnessScoresSchema = z.object({
  sleep: wellnessScore,
  fatigue: wellnessScore,
  mood: wellnessScore,
  stress: wellnessScore,
});

export type WellnessScores = z.infer<typeof wellnessScoresSchema>;
