import { z } from "zod";

import { USER_TYPES } from "./prescribe-input.schema";

/**
 * 처방(맞춤 추천) 출력 스키마 — docs/output.json 기반(+순위별 상세 확장).
 *
 * engine_* = 엔진 계산(규칙), ai_* = AI 추론(개인화).
 * 모든 순위가 자체 일정(detail)을 가져, 2·3위도 1위처럼 펼쳐 확인할 수 있다.
 */

export const engineBreakdownSchema = z.object({
  distance_km: z.number(), // [엔진/API]
  phytoncide_index: z.number(), // [엔진] 0~100 상대 잠재력
  pm25: z.number(), // [API] ㎍/㎥ — 화면 표시용 현재 실측
  air_label: z.string(), // 쾌적/양호/주의
  pm25_source: z.string().optional(), // 청정넷 숲내 실측 / 에어코리아 시·도
  species: z.string(),
});
export type EngineBreakdown = z.infer<typeof engineBreakdownSchema>;

export const itineraryStepSchema = z.object({
  time: z.string(), // HH:MM
  activity: z.string(),
  place: z.string(),
  link: z.string().optional(),
});
export type ItineraryStep = z.infer<typeof itineraryStepSchema>;

export const recommendedProgramSchema = z.object({
  title: z.string(),
  is_example: z.boolean(), // true면 "(예시)" 배지
});

/** "오늘의 회복 포인트" 4칸 — 점수 대신 혜택을 감성적으로(상태·수종 기반 규칙 생성). */
export const recoveryPointSchema = z.object({
  icon: z.string(), // "tree" | "walk" | "meditation" | "camera" 등
  title: z.string(),
  desc: z.string(),
});
export type RecoveryPoint = z.infer<typeof recoveryPointSchema>;

export const nearbyFoodSchema = z.object({
  name: z.string(),
  category: z.string(),
  rating: z.number(),
  link: z.string().optional(),
});
export type NearbyFood = z.infer<typeof nearbyFoodSchema>;

/** 순위 공통 상세(2·3위도 동일하게 일정 제공). */
export const forestDetailSchema = z.object({
  ai_personal_plan: z.array(z.string()), // [AI 추론] 맞춤 실천
  recommended_program: recommendedProgramSchema,
  itinerary: z.object({
    date: z.string(),
    steps: z.array(itineraryStepSchema),
  }),
  ai_note: z.string(), // [AI 추론] 근거+시점
  recovery_points: z.array(recoveryPointSchema).optional(),
  tradeoff: z.string().optional(), // 정직성 한 줄(약한 축 솔직 안내)
});
export type ForestDetail = z.infer<typeof forestDetailSchema>;

export const rankingItemSchema = z.object({
  rank: z.number().int().min(1),
  engine_score: z.number(), // [엔진] 종합점수
  forest_name: z.string(),
  engine_breakdown: engineBreakdownSchema,
  ai_reason: z.string(), // [AI 추론]
  // 2·3위 상세 일정. 1위는 top_pick_detail 을 사용한다.
  detail: forestDetailSchema.optional(),
});
export type RankingItem = z.infer<typeof rankingItemSchema>;

export const topPickDetailSchema = z.object({
  forest_name: z.string(),
  ai_personal_plan: z.array(z.string()),
  recommended_program: recommendedProgramSchema,
  itinerary: z.object({
    date: z.string(),
    steps: z.array(itineraryStepSchema),
  }),
  nearby_food: z.array(nearbyFoodSchema),
  ai_note: z.string(),
  cta: z.string(),
  recovery_points: z.array(recoveryPointSchema).optional(),
  tradeoff: z.string().optional(),
});
export type TopPickDetail = z.infer<typeof topPickDetailSchema>;

export const userSummarySchema = z.object({
  user_type: z.enum(USER_TYPES),
  health_goal: z.string(),
  ai_state_reading: z.string(), // [AI 추론] K-POMS-B 패턴 해석(진단 아님)
});
export type UserSummary = z.infer<typeof userSummarySchema>;

export const prescribeOutputSchema = z.object({
  session_id: z.string(),
  generated_at: z.string(),
  user_summary: userSummarySchema,
  ranking: z.array(rankingItemSchema).min(1),
  top_pick_detail: topPickDetailSchema,
  disclaimers: z.array(z.string()),
});
export type PrescribeOutput = z.infer<typeof prescribeOutputSchema>;
