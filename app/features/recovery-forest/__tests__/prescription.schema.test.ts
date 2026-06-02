import { describe, expect, it } from "vitest";

import {
  prescriptionResponseSchema,
  targetOutcomeSchema,
} from "../schemas/prescription.schema";

describe("targetOutcomeSchema", () => {
  it("should_accept_valid_hypothesis", () => {
    const result = targetOutcomeSchema.safeParse([
      { axis: "sleep", direction: "increase", expected_delta: 2 },
      { axis: "fatigue", direction: "decrease", expected_delta: 2, note: "저강도 산책" },
    ]);
    expect(result.success).toBe(true);
  });

  it("should_reject_unknown_axis", () => {
    const result = targetOutcomeSchema.safeParse([
      { axis: "energy", direction: "increase", expected_delta: 2 },
    ]);
    expect(result.success).toBe(false);
  });
});

describe("prescriptionResponseSchema", () => {
  it("should_parse_completed_prescription_with_citations", () => {
    const sample = {
      journey_token: "tok-123",
      status: "completed",
      place: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "국립산음자연휴양림",
        type: "recreation_forest",
        region: "경기 양평",
      },
      ai_summary: "토요일 오전 저강도 산책을 권합니다.",
      caution: "",
      action_plan: {
        place_name: "국립산음자연휴양림",
        visit_window: "토요일 오전 9-11시",
        duration_min: 90,
        intensity: "low",
        steps: ["A코스 입구 집결", "90분 저강도 산책", "벤치 호흡 10분"],
      },
      target_outcome: [
        { axis: "sleep", direction: "increase", expected_delta: 2 },
      ],
      post_measurement_plan: { axes: ["sleep", "fatigue"], timing: "방문 3일 후" },
      citations: [
        {
          mechanism: "phytoncide",
          title: "Forest bathing and NK cell activity",
          year: 2022,
          relevance_note: "피톤치드 노출과 면역 지표",
        },
      ],
    };
    expect(prescriptionResponseSchema.safeParse(sample).success).toBe(true);
  });

  it("should_default_empty_arrays_when_pending", () => {
    const result = prescriptionResponseSchema.safeParse({
      journey_token: "tok-1",
      status: "pending",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.target_outcome).toEqual([]);
      expect(result.data.citations).toEqual([]);
    }
  });

  it("should_accept_failed_with_last_error", () => {
    const result = prescriptionResponseSchema.safeParse({
      journey_token: "tok-1",
      status: "failed",
      last_error: "n8n timeout",
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_invalid_intensity", () => {
    const result = prescriptionResponseSchema.safeParse({
      journey_token: "tok-1",
      status: "completed",
      action_plan: {
        place_name: "x",
        visit_window: "x",
        duration_min: 30,
        intensity: "extreme",
        steps: [],
      },
    });
    expect(result.success).toBe(false);
  });
});
