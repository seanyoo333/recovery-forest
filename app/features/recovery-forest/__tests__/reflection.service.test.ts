import { describe, expect, it } from "vitest";

import type { TargetOutcome } from "../schemas/prescription.schema";
import type { WellnessScores } from "../schemas/wellness.schema";
import {
  aggregateHitRate,
  averageDeltaByAxis,
  buildNarrative,
  buildReport,
  computeDeltas,
  computeHitRate,
  evaluateHitMiss,
} from "../services/reflection.service";

const pre: WellnessScores = { sleep: 4, fatigue: 7, mood: 5, stress: 6 };
const post: WellnessScores = { sleep: 6, fatigue: 5, mood: 6, stress: 6 };

describe("computeDeltas", () => {
  it("should_compute_signed_deltas_for_all_axes", () => {
    const deltas = computeDeltas(pre, post);
    expect(deltas).toHaveLength(4);
    const sleep = deltas.find((d) => d.axis === "sleep")!;
    expect(sleep.delta).toBe(2);
  });

  it("should_mark_increase_axis_improved_when_score_rises", () => {
    const deltas = computeDeltas(pre, post);
    expect(deltas.find((d) => d.axis === "sleep")!.improved).toBe(true);
    expect(deltas.find((d) => d.axis === "mood")!.improved).toBe(true);
  });

  it("should_mark_decrease_axis_improved_when_score_falls", () => {
    const deltas = computeDeltas(pre, post);
    // fatigue 7 -> 5 (낮아짐 = 개선)
    expect(deltas.find((d) => d.axis === "fatigue")!.improved).toBe(true);
  });

  it("should_mark_unchanged_axis_not_improved", () => {
    const deltas = computeDeltas(pre, post);
    // stress 6 -> 6
    const stress = deltas.find((d) => d.axis === "stress")!;
    expect(stress.delta).toBe(0);
    expect(stress.improved).toBe(false);
  });
});

describe("evaluateHitMiss", () => {
  const target: TargetOutcome = [
    { axis: "sleep", direction: "increase", expected_delta: 2 },
    { axis: "fatigue", direction: "decrease", expected_delta: 3 },
  ];

  it("should_hit_when_increase_meets_target", () => {
    const hm = evaluateHitMiss(target, computeDeltas(pre, post));
    expect(hm.find((h) => h.axis === "sleep")!.hit).toBe(true);
  });

  it("should_miss_when_decrease_falls_short", () => {
    // fatigue 만 -2, 목표 -3 → 미달
    const hm = evaluateHitMiss(target, computeDeltas(pre, post));
    const fatigue = hm.find((h) => h.axis === "fatigue")!;
    expect(fatigue.target_delta).toBe(-3);
    expect(fatigue.actual_delta).toBe(-2);
    expect(fatigue.hit).toBe(false);
  });

  it("should_return_empty_for_empty_target", () => {
    expect(evaluateHitMiss([], computeDeltas(pre, post))).toEqual([]);
  });
});

describe("computeHitRate", () => {
  it("should_return_null_when_no_hypothesis", () => {
    expect(computeHitRate([])).toBeNull();
  });

  it("should_compute_ratio", () => {
    const hm = evaluateHitMiss(
      [
        { axis: "sleep", direction: "increase", expected_delta: 2 },
        { axis: "fatigue", direction: "decrease", expected_delta: 3 },
      ],
      computeDeltas(pre, post),
    );
    expect(computeHitRate(hm)).toBe(0.5);
  });
});

describe("buildNarrative", () => {
  it("should_describe_changes_without_medical_claims", () => {
    const deltas = computeDeltas(pre, post);
    const hm = evaluateHitMiss(
      [{ axis: "sleep", direction: "increase", expected_delta: 2 }],
      deltas,
    );
    const text = buildNarrative(deltas, hm);
    expect(text).toContain("자가보고");
    expect(text).toMatch(/4 → 6/);
    // 의료 단정 표현 금지
    expect(text).not.toMatch(/완치|치료 효과|낫습니다|치유됩니다/);
  });
});

describe("buildReport", () => {
  it("should_assemble_completed_report", () => {
    const report = buildReport({
      journeyToken: "tok-1",
      pre,
      post,
      targetOutcome: [{ axis: "sleep", direction: "increase", expected_delta: 2 }],
      citations: [{ mechanism: "phytoncide", title: "paper" }],
    });
    expect(report.status).toBe("completed");
    expect(report.hit_rate).toBe(1);
    expect(report.citations).toHaveLength(1);
  });
});

describe("aggregateHitRate", () => {
  it("should_return_null_rate_for_empty_cohort", () => {
    expect(aggregateHitRate([]).rate).toBeNull();
  });

  it("should_aggregate_across_journeys", () => {
    const agg = aggregateHitRate([
      [{ axis: "sleep", target_delta: 2, actual_delta: 2, hit: true }],
      [
        { axis: "sleep", target_delta: 2, actual_delta: 1, hit: false },
        { axis: "fatigue", target_delta: -2, actual_delta: -3, hit: true },
      ],
    ]);
    expect(agg.total).toBe(3);
    expect(agg.hits).toBe(2);
    expect(agg.rate).toBeCloseTo(2 / 3);
  });
});

describe("averageDeltaByAxis", () => {
  it("should_average_per_axis", () => {
    const avg = averageDeltaByAxis([
      [
        { axis: "sleep", pre: 4, post: 6, delta: 2, improved: true },
        { axis: "fatigue", pre: 7, post: 5, delta: -2, improved: true },
      ],
      [
        { axis: "sleep", pre: 5, post: 7, delta: 2, improved: true },
        { axis: "fatigue", pre: 6, post: 5, delta: -1, improved: true },
      ],
    ]);
    expect(avg.sleep).toBe(2);
    expect(avg.fatigue).toBe(-1.5);
    expect(avg.mood).toBe(0);
  });

  it("should_return_zeros_for_empty", () => {
    const avg = averageDeltaByAxis([]);
    expect(avg.sleep).toBe(0);
    expect(avg.stress).toBe(0);
  });
});
