import { z } from "zod";

/**
 * 처방(맞춤 추천) 입력 스키마 — docs/input.json 과 1:1.
 *
 * 엔진(prescription_engine 3축: 거리·피톤치드·미세먼지)이 숲을 "계산"하고,
 * AI가 K-POMS-B 기분상태를 "해석"해 개인화 처방을 만든다. 이 스키마는 그 입력.
 * (기존 input.schema.ts 의 5축 모델과 별개 — 새 /prescribe 흐름 전용)
 */

export const USER_TYPES = ["comfort", "explorer"] as const;
export type UserType = (typeof USER_TYPES)[number];

export const HEALTH_GOALS = [
  "수면",
  "스트레스",
  "피로",
  "우울",
  "면역",
  "일반",
] as const;
export type HealthGoal = (typeof HEALTH_GOALS)[number];

export const TRANSPORT_MODES = ["transit", "car", "walk"] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export const COMPANIONS = ["solo", "family", "group"] as const;
export type Companion = (typeof COMPANIONS)[number];

/** K-POMS-B 6개 기분 지표. 활력만 높을수록 좋음, 나머지는 낮을수록 좋음. */
export const KPOMSB_AXES = [
  "긴장",
  "우울",
  "분노",
  "활력",
  "피로",
  "혼란",
] as const;
export type KpomsbAxis = (typeof KPOMSB_AXES)[number];

/**
 * K-POMS-B 점수 범위/방향.
 * 18문항(하위척도당 3문항 × 0~4) → 하위척도 합산 0~12.
 * 활력만 높을수록 좋고, 나머지는 낮을수록 좋다.
 */
export const KPOMSB_MIN = 0;
export const KPOMSB_MAX = 12;
export const KPOMSB_AXIS_META: Record<
  KpomsbAxis,
  { higherIsBetter: boolean; hint: string }
> = {
  긴장: { higherIsBetter: false, hint: "낮을수록 편안" },
  우울: { higherIsBetter: false, hint: "낮을수록 편안" },
  분노: { higherIsBetter: false, hint: "낮을수록 편안" },
  활력: { higherIsBetter: true, hint: "높을수록 좋아요" },
  피로: { higherIsBetter: false, hint: "낮을수록 편안" },
  혼란: { higherIsBetter: false, hint: "낮을수록 편안" },
};

/** 정밀 입력용 5단계("전혀~매우") → 0~12 매핑. */
export const KPOMSB_LEVELS = [
  { label: "전혀", value: 0 },
  { label: "조금", value: 3 },
  { label: "보통", value: 6 },
  { label: "꽤", value: 9 },
  { label: "매우", value: 12 },
] as const;

const kpomsbScore = z.number().min(KPOMSB_MIN).max(KPOMSB_MAX);

export const kpomsbSchema = z.object({
  긴장: kpomsbScore,
  우울: kpomsbScore,
  분노: kpomsbScore,
  활력: kpomsbScore,
  피로: kpomsbScore,
  혼란: kpomsbScore,
});
export type KpomsbScores = z.infer<typeof kpomsbSchema>;

export const prescribeInputSchema = z.object({
  session_id: z.string().optional(),
  submitted_at: z.string().optional(),
  user_type: z.enum(USER_TYPES),
  health_goal: z.enum(HEALTH_GOALS),
  location: z.object({
    lat: z.number(),
    lon: z.number(),
    label: z.string().optional(),
  }),
  visit_plan: z.object({
    date: z.string().min(1, "방문 희망일을 선택해주세요"),
    arrival_hour: z.number().int().min(0).max(23),
  }),
  transport: z.object({
    mode: z.enum(TRANSPORT_MODES),
    needs_route: z.boolean(),
    max_travel_minutes: z.number().int().positive().optional(),
  }),
  preferences: z.object({
    wants_program: z.boolean(),
    wants_food: z.boolean(),
    wants_nearby: z.boolean(),
    companions: z.enum(COMPANIONS).optional(),
  }),
  kpomsb_pre: kpomsbSchema,
  consent: z.object({
    // 데이터 활용 동의는 필수(true 여야 통과).
    data_use_agreed: z.literal(true),
    followup_optin: z.boolean(),
  }),
});
export type PrescribeInput = z.infer<typeof prescribeInputSchema>;

// ---- 표시용 라벨 ----
export const USER_TYPE_LABELS: Record<UserType, string> = {
  comfort: "편안함형",
  explorer: "근거형",
};
export const USER_TYPE_TAGLINES: Record<UserType, string> = {
  comfort: "가깝고 편안한 회복이 우선",
  explorer: "거리보다 숲의 질·근거가 우선",
};

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  transit: "대중교통",
  car: "자가용",
  walk: "도보",
};

export const COMPANION_LABELS: Record<Companion, string> = {
  solo: "혼자",
  family: "가족",
  group: "그룹",
};

/** 데모용 출발지 프리셋(좌표 동봉). input.json 예시 좌표 포함. */
export const PRESET_LOCATIONS: ReadonlyArray<{
  label: string;
  lat: number;
  lon: number;
}> = [
  { label: "서울 강남구", lat: 37.5012, lon: 127.0396 },
  { label: "서울 중구", lat: 37.5547, lon: 126.9706 },
  { label: "경기 수원시", lat: 37.2636, lon: 127.0286 },
  { label: "부산 해운대구", lat: 35.1631, lon: 129.1635 },
];

/**
 * "오늘 어떤 휴식이 필요하세요?" 간단 3택.
 * 핵심 설계: 회복이 필요한 사용자는 이 한 문항만 답해도 된다.
 * AI/엔진이 user_type·health_goal·대략적 기분 패턴을 여기서 추론(최소 입력 → AI 추론 극대화).
 * 정밀 입력(K-POMS-B)은 원하는 사람만 펼쳐서 보정한다.
 */
export const SIMPLE_MOODS = [
  {
    key: "tired",
    label: "많이 지쳐 있어요",
    desc: "잠이 부족하고, 쉬어가고 싶어요",
    userType: "comfort",
    healthGoal: "수면",
  },
  {
    key: "calm",
    label: "한숨 돌리고 싶어요",
    desc: "마음의 긴장을 천천히 풀고 싶어요",
    userType: "comfort",
    healthGoal: "스트레스",
  },
  {
    key: "explore",
    label: "숲을 깊이 느껴보고 싶어요",
    desc: "여유 있게 좋은 숲을 경험하고 싶어요",
    userType: "explorer",
    healthGoal: "일반",
  },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  desc: string;
  userType: UserType;
  healthGoal: HealthGoal;
}>;

export type SimpleMoodKey = (typeof SIMPLE_MOODS)[number]["key"];
