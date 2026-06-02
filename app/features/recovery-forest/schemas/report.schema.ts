import { z } from "zod";

import { citationSchema } from "./evidence.schema";
import { WELLNESS_AXES } from "./wellness.schema";

/**
 * 축별 사전/사후 변화. improved 는 방향(WELLNESS_AXIS_IMPROVEMENT) 반영 결과.
 */
export const deltaItemSchema = z.object({
  axis: z.enum(WELLNESS_AXES),
  pre: z.number().int().min(1).max(10),
  post: z.number().int().min(1).max(10),
  delta: z.number().int(), // post - pre (음수 가능)
  improved: z.boolean(),
});
export type DeltaItem = z.infer<typeof deltaItemSchema>;

/**
 * 가설(target_outcome) 적중 여부.
 */
export const hitMissItemSchema = z.object({
  axis: z.enum(WELLNESS_AXES),
  target_delta: z.number(),
  actual_delta: z.number(),
  hit: z.boolean(),
});
export type HitMissItem = z.infer<typeof hitMissItemSchema>;

/**
 * 리포트 페이지가 읽는 응답(폴링). 사전/사후 비교 + 가설 적중 + 근거.
 */
export const reportResponseSchema = z.object({
  journey_token: z.string(),
  status: z.enum(["pending", "completed", "failed"]),
  deltas: z.array(deltaItemSchema).default([]),
  hit_miss: z.array(hitMissItemSchema).default([]),
  hit_rate: z.number().min(0).max(1).nullable().optional(),
  narrative: z.string().nullable().optional(),
  citations: z.array(citationSchema).default([]),
  last_error: z.string().nullable().optional(),
});

export type ReportResponse = z.infer<typeof reportResponseSchema>;
