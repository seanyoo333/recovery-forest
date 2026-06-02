import type { Citation } from "../schemas/evidence.schema";
import type { TargetOutcome } from "../schemas/prescription.schema";
import type {
  DeltaItem,
  HitMissItem,
  ReportResponse,
} from "../schemas/report.schema";
import {
  WELLNESS_AXES,
  WELLNESS_AXIS_IMPROVEMENT,
  WELLNESS_AXIS_LABELS,
  type WellnessAxis,
  type WellnessScores,
} from "../schemas/wellness.schema";

/**
 * Reflection 체인 (Learn) — 순수 함수. 외부 의존 없음.
 * 사전/사후 자가보고를 비교해 변화량과 가설 적중을 계산하고,
 * 의료 단정 없는 서술형 리포트를 만든다.
 */

/** 축별 사전→사후 변화량과 개선 여부(방향 반영) 계산 */
export function computeDeltas(
  pre: WellnessScores,
  post: WellnessScores,
): DeltaItem[] {
  return WELLNESS_AXES.map((axis) => {
    const delta = post[axis] - pre[axis];
    const improved =
      WELLNESS_AXIS_IMPROVEMENT[axis] === "increase" ? delta > 0 : delta < 0;
    return { axis, pre: pre[axis], post: post[axis], delta, improved };
  });
}

/** 가설(target_outcome)을 부호 있는 기대 변화량으로 환산 */
function signedTarget(
  direction: "increase" | "decrease",
  expectedDelta: number,
): number {
  return direction === "increase" ? expectedDelta : -expectedDelta;
}

/** 가설 적중 여부 판정 */
export function evaluateHitMiss(
  targetOutcome: TargetOutcome,
  deltas: DeltaItem[],
): HitMissItem[] {
  const deltaByAxis = new Map<WellnessAxis, number>(
    deltas.map((d) => [d.axis, d.delta]),
  );
  return targetOutcome.map((t) => {
    const actualDelta = deltaByAxis.get(t.axis) ?? 0;
    const target = signedTarget(t.direction, t.expected_delta);
    const hit =
      t.direction === "increase"
        ? actualDelta >= target
        : actualDelta <= target;
    return { axis: t.axis, target_delta: target, actual_delta: actualDelta, hit };
  });
}

/** 적중률(0~1). 가설이 없으면 null */
export function computeHitRate(hitMiss: HitMissItem[]): number | null {
  if (hitMiss.length === 0) return null;
  const hits = hitMiss.filter((h) => h.hit).length;
  return hits / hitMiss.length;
}

/**
 * 서술형 리포트. 자가보고 수치의 변화만 기술하고,
 * 진단·치료·완치 등 의료 단정 표현은 쓰지 않는다.
 */
export function buildNarrative(
  deltas: DeltaItem[],
  hitMiss: HitMissItem[],
): string {
  const improvedAxes = deltas
    .filter((d) => d.improved)
    .map((d) => WELLNESS_AXIS_LABELS[d.axis]);

  const lines: string[] = [];
  if (improvedAxes.length > 0) {
    lines.push(
      `자가보고 기준으로 ${improvedAxes.join(", ")} 항목에서 긍정적인 변화가 나타났어요.`,
    );
  } else {
    lines.push("이번에는 자가보고 점수에서 뚜렷한 변화가 관찰되지 않았어요.");
  }

  for (const d of deltas) {
    const label = WELLNESS_AXIS_LABELS[d.axis];
    const sign = d.delta > 0 ? `+${d.delta}` : `${d.delta}`;
    lines.push(`${label}: ${d.pre} → ${d.post} (${sign})`);
  }

  const hitRate = computeHitRate(hitMiss);
  if (hitRate !== null) {
    const hits = hitMiss.filter((h) => h.hit).length;
    lines.push(
      `처방 시 세운 예측 ${hitMiss.length}개 중 ${hits}개가 자가보고 결과와 일치했어요.`,
    );
  }

  lines.push(
    "본 리포트는 자가보고 데이터를 정리한 것으로 의학적 진단이 아니며, 건강 상태 판단은 전문의와 상담하세요.",
  );
  return lines.join("\n");
}

/**
 * 완성된 리포트 응답 조립(코드 내 오프라인 생성).
 * citations 는 처방 시 인용된 근거를 그대로 스냅샷.
 */
export function buildReport(input: {
  journeyToken: string;
  pre: WellnessScores;
  post: WellnessScores;
  targetOutcome: TargetOutcome;
  citations?: Citation[];
}): ReportResponse {
  const deltas = computeDeltas(input.pre, input.post);
  const hitMiss = evaluateHitMiss(input.targetOutcome, deltas);
  return {
    journey_token: input.journeyToken,
    status: "completed",
    deltas,
    hit_miss: hitMiss,
    hit_rate: computeHitRate(hitMiss),
    narrative: buildNarrative(deltas, hitMiss),
    citations: input.citations ?? [],
  };
}

/**
 * 코호트 적중률 — "데이터 축적이 품질을 높인다" 데모용.
 * 여러 여정의 hit_miss 를 모아 전체 적중률을 계산한다.
 */
export function aggregateHitRate(
  hitMissPerJourney: HitMissItem[][],
): { total: number; hits: number; rate: number | null } {
  const all = hitMissPerJourney.flat();
  if (all.length === 0) return { total: 0, hits: 0, rate: null };
  const hits = all.filter((h) => h.hit).length;
  return { total: all.length, hits, rate: hits / all.length };
}

/**
 * 축별 평균 변화량 — insights 대시보드용.
 * 여러 여정의 delta 를 축별로 평균낸다.
 */
export function averageDeltaByAxis(
  deltasPerJourney: DeltaItem[][],
): Record<WellnessAxis, number> {
  const sums = {} as Record<WellnessAxis, number>;
  const counts = {} as Record<WellnessAxis, number>;
  for (const axis of WELLNESS_AXES) {
    sums[axis] = 0;
    counts[axis] = 0;
  }
  for (const deltas of deltasPerJourney) {
    for (const d of deltas) {
      sums[d.axis] += d.delta;
      counts[d.axis] += 1;
    }
  }
  const out = {} as Record<WellnessAxis, number>;
  for (const axis of WELLNESS_AXES) {
    out[axis] = counts[axis] === 0 ? 0 : sums[axis] / counts[axis];
  }
  return out;
}
