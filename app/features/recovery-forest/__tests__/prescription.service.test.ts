import { describe, expect, it } from "vitest";

import type { RecommendationInput } from "../schemas/input.schema";
import {
  buildStubPrescription,
  deriveTargetOutcome,
} from "../services/prescription.service";

const baseInput: RecommendationInput = {
  user_sido: "서울",
  user_sigungu: "강북구",
  user_priorities: ["stress", "immunity"],
  user_fitness_level: "mid",
  user_travel_time_min: 60,
  user_preferred_activity: "walking",
};

describe("deriveTargetOutcome", () => {
  it("should_target_poor_axes", () => {
    const out = deriveTargetOutcome({ sleep: 4, fatigue: 7, mood: 4, stress: 7 });
    const axes = out.map((t) => t.axis);
    expect(axes).toContain("sleep");
    expect(axes).toContain("fatigue");
    expect(axes).toContain("stress");
    expect(axes).toContain("mood");
  });

  it("should_default_when_all_good", () => {
    const out = deriveTargetOutcome({ sleep: 9, fatigue: 2, mood: 9, stress: 2 });
    expect(out).toHaveLength(1);
    expect(out[0].axis).toBe("stress");
  });
});

describe("buildStubPrescription", () => {
  const wellness = { sleep: 4, fatigue: 7, mood: 5, stress: 6 };

  it("should_build_action_plan_with_place", () => {
    const p = buildStubPrescription({
      wellness,
      recommendationInput: baseInput,
      placeName: "산음휴양림",
    });
    expect(p.actionPlan.place_name).toBe("산음휴양림");
    expect(p.actionPlan.intensity).toBe("moderate");
    expect(p.actionPlan.duration_min).toBe(90);
    expect(p.actionPlan.steps.length).toBeGreaterThan(0);
  });

  it("should_map_priorities_to_mechanisms", () => {
    const p = buildStubPrescription({
      wellness,
      recommendationInput: baseInput,
      placeName: "산음휴양림",
    });
    expect(p.mechanisms).toContain("cortisol");
    expect(p.mechanisms).toContain("nk_cell");
  });

  it("should_downgrade_intensity_for_early_recovery", () => {
    const p = buildStubPrescription({
      wellness,
      recommendationInput: { ...baseInput, user_fitness_level: "high" },
      monthsSinceTreatment: 1,
      placeName: "산음휴양림",
    });
    expect(p.actionPlan.intensity).toBe("low");
    expect(p.caution).not.toBe("");
  });

  it("should_align_post_measurement_axes_with_target", () => {
    const p = buildStubPrescription({
      wellness,
      recommendationInput: baseInput,
      placeName: "산음휴양림",
    });
    expect(p.postMeasurementPlan.axes).toEqual(
      p.targetOutcome.map((t) => t.axis),
    );
  });

  it("should_default_mechanism_when_no_mapped_priority", () => {
    const p = buildStubPrescription({
      wellness,
      recommendationInput: { ...baseInput, user_priorities: ["accessibility"] },
      placeName: "산음휴양림",
    });
    expect(p.mechanisms).toContain("phytoncide");
  });
});
