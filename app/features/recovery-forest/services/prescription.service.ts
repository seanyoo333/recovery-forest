import type { HealthPriority, RecommendationInput } from "../schemas/input.schema";
import {
  INTENSITY_LABELS,
  type ActionPlan,
  type PostMeasurementPlan,
  type PrescriptionIntensity,
  type TargetOutcome,
} from "../schemas/prescription.schema";
import type { WellnessScores } from "../schemas/wellness.schema";

/**
 * STUB 처방 생성기 — 순수 함수. PRESCRIPTION_MODE=stub 에서 외부 API 없이
 * 자가보고 + 추천 입력만으로 "가설을 가진 처방"을 만든다. n8n 경로가 준비되면
 * 동일한 출력 형태를 n8n 이 채운다.
 */

const INTENSITY_BY_FITNESS: Record<
  RecommendationInput["user_fitness_level"],
  PrescriptionIntensity
> = {
  low: "low",
  mid: "moderate",
  high: "high",
};

const DURATION_BY_INTENSITY: Record<PrescriptionIntensity, number> = {
  low: 60,
  moderate: 90,
  high: 120,
};

/** 관심사 → 근거 메커니즘 (forest_evidence_sources.mechanism 과 매칭) */
const PRIORITY_MECHANISMS: Partial<Record<HealthPriority, string>> = {
  stress: "cortisol",
  immunity: "nk_cell",
  rest: "parasympathetic",
  air: "phytoncide",
  exercise: "blood_pressure",
};

export type StubPrescription = {
  actionPlan: ActionPlan;
  targetOutcome: TargetOutcome;
  postMeasurementPlan: PostMeasurementPlan;
  aiSummary: string;
  caution: string;
  mechanisms: string[];
};

/** 자가보고 점수에서 개선 가설(target_outcome) 도출 */
export function deriveTargetOutcome(wellness: WellnessScores): TargetOutcome {
  const out: TargetOutcome = [];
  if (wellness.sleep <= 5)
    out.push({ axis: "sleep", direction: "increase", expected_delta: 2 });
  if (wellness.fatigue >= 6)
    out.push({ axis: "fatigue", direction: "decrease", expected_delta: 2 });
  if (wellness.stress >= 6)
    out.push({ axis: "stress", direction: "decrease", expected_delta: 2 });
  if (wellness.mood <= 5)
    out.push({ axis: "mood", direction: "increase", expected_delta: 1 });
  // 모든 축이 양호하면 가벼운 스트레스 완화 가설을 기본으로 둔다.
  if (out.length === 0)
    out.push({ axis: "stress", direction: "decrease", expected_delta: 1 });
  return out;
}

export function buildStubPrescription(input: {
  wellness: WellnessScores;
  recommendationInput: RecommendationInput;
  monthsSinceTreatment?: number | null;
  placeName: string;
}): StubPrescription {
  const { wellness, recommendationInput, monthsSinceTreatment, placeName } =
    input;

  const recoveryEarly =
    monthsSinceTreatment != null && monthsSinceTreatment < 3;

  // 치료 직후(3개월 미만)에는 강도를 저강도로 내린다.
  const intensity: PrescriptionIntensity = recoveryEarly
    ? "low"
    : INTENSITY_BY_FITNESS[recommendationInput.user_fitness_level];

  const duration = DURATION_BY_INTENSITY[intensity];
  const intensityLabel = INTENSITY_LABELS[intensity];

  const targetOutcome = deriveTargetOutcome(wellness);

  const mechanisms = Array.from(
    new Set(
      recommendationInput.user_priorities
        .map((p) => PRIORITY_MECHANISMS[p])
        .filter((m): m is string => Boolean(m)),
    ),
  );
  // 최소 한 개 메커니즘은 보장 (피톤치드)
  if (mechanisms.length === 0) mechanisms.push("phytoncide");

  const actionPlan: ActionPlan = {
    place_name: placeName,
    visit_window: "이번 주 오전 9-11시",
    duration_min: duration,
    intensity,
    steps: [
      `${placeName} 입구에서 출발`,
      `${duration}분 ${intensityLabel} 산책`,
      "벤치에서 5분 호흡 정리",
      "활동 후 따뜻한 물 한 잔",
    ],
  };

  const postMeasurementPlan: PostMeasurementPlan = {
    axes: targetOutcome.map((t) => t.axis),
    timing: "방문 3일 후",
  };

  const aiSummary = `${placeName}에서 ${intensityLabel} 산책 ${duration}분을 권해요. 방문 전후 자가보고 점수의 변화를 함께 살펴봐요.`;

  const caution = recoveryEarly
    ? "치료 종료 직후에는 무리하지 않는 저강도 활동을 권장해요. 컨디션이 좋지 않으면 휴식을 우선하세요."
    : "";

  return {
    actionPlan,
    targetOutcome,
    postMeasurementPlan,
    aiSummary,
    caution,
    mechanisms,
  };
}
