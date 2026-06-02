import { z } from "zod";

import { citationSchema } from "./evidence.schema";
import { WELLNESS_AXES } from "./wellness.schema";

export const PRESCRIPTION_INTENSITIES = ["low", "moderate", "high"] as const;
export type PrescriptionIntensity = (typeof PRESCRIPTION_INTENSITIES)[number];

export const INTENSITY_LABELS: Record<PrescriptionIntensity, string> = {
  low: "저강도",
  moderate: "중강도",
  high: "고강도",
};

/**
 * target_outcome = 처방의 "가설". 각 축에 대해 어느 방향으로 얼마만큼
 * 변할 것으로 기대하는지. 사후 측정의 적중/미적중 판정 기준이 된다.
 */
export const targetOutcomeItemSchema = z.object({
  axis: z.enum(WELLNESS_AXES),
  direction: z.enum(["increase", "decrease"]),
  expected_delta: z.number().min(0).max(9),
  note: z.string().nullable().optional(),
});

export const targetOutcomeSchema = z.array(targetOutcomeItemSchema);
export type TargetOutcome = z.infer<typeof targetOutcomeSchema>;

/**
 * 행동 계획 — "구체성 계단". 의사결정 비용을 0에 가깝게 만드는 구체 단계.
 */
export const actionPlanSchema = z.object({
  place_name: z.string().min(1),
  visit_window: z.string().min(1),
  duration_min: z.number().int().positive(),
  intensity: z.enum(PRESCRIPTION_INTENSITIES),
  steps: z.array(z.string()).default([]),
});
export type ActionPlan = z.infer<typeof actionPlanSchema>;

/**
 * 사후 측정 계획 — 어떤 축을, 언제 다시 잴지.
 */
export const postMeasurementPlanSchema = z.object({
  axes: z.array(z.enum(WELLNESS_AXES)).min(1),
  timing: z.string().min(1),
});
export type PostMeasurementPlan = z.infer<typeof postMeasurementPlanSchema>;

const prescribedPlaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  region: z.string(),
});

/**
 * 처방 페이지가 읽는 응답(폴링). recommendationResponseSchema 와 동일한
 * pending/completed/failed 패턴을 따른다.
 */
export const prescriptionResponseSchema = z.object({
  journey_token: z.string(),
  status: z.enum(["pending", "completed", "failed"]),
  place: prescribedPlaceSchema.nullable().optional(),
  ai_summary: z.string().nullable().optional(),
  caution: z.string().nullable().optional(),
  action_plan: actionPlanSchema.nullable().optional(),
  target_outcome: targetOutcomeSchema.default([]),
  post_measurement_plan: postMeasurementPlanSchema.nullable().optional(),
  citations: z.array(citationSchema).default([]),
  last_error: z.string().nullable().optional(),
});

export type PrescriptionResponse = z.infer<typeof prescriptionResponseSchema>;
