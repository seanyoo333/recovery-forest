import { describe, expect, it } from "vitest";

import {
  citationRowsToCitations,
  rowToPrescriptionResponse,
  type PrescriptionRow,
} from "../services/prescription.repository";
import {
  rowToReportResponse,
  type ReportRow,
} from "../services/report.repository";
import { rowToWellnessScores } from "../services/survey.repository";

describe("rowToWellnessScores", () => {
  it("should_map_scores", () => {
    expect(
      rowToWellnessScores({
        sleep_score: 4,
        fatigue_score: 7,
        mood_score: 5,
        stress_score: 6,
      }),
    ).toEqual({ sleep: 4, fatigue: 7, mood: 5, stress: 6 });
  });

  it("should_default_nulls_to_five", () => {
    expect(
      rowToWellnessScores({
        sleep_score: null,
        fatigue_score: null,
        mood_score: null,
        stress_score: null,
      }),
    ).toEqual({ sleep: 5, fatigue: 5, mood: 5, stress: 5 });
  });
});

describe("rowToPrescriptionResponse", () => {
  const baseRow: PrescriptionRow = {
    id: "p1",
    journey_id: "j1",
    forest_place_id: "f1",
    status: "completed",
    action_plan: {
      place_name: "산음휴양림",
      visit_window: "토요일 오전",
      duration_min: 90,
      intensity: "low",
      steps: [],
    },
    target_outcome: [{ axis: "sleep", direction: "increase", expected_delta: 2 }],
    post_measurement_plan: { axes: ["sleep"], timing: "3일 후" },
    ai_summary: "요약",
    caution: null,
    last_error: null,
    created_at: "2026-06-01T00:00:00Z",
    completed_at: "2026-06-01T00:01:00Z",
  };

  it("should_map_completed_row_with_place_and_citations", () => {
    const res = rowToPrescriptionResponse(baseRow, "tok-1", {
      place: { id: "f1", name: "산음휴양림", type: "recreation_forest", region: "경기" },
      citations: [{ mechanism: "phytoncide", title: "paper" }],
    });
    expect(res.status).toBe("completed");
    expect(res.place?.name).toBe("산음휴양림");
    expect(res.target_outcome).toHaveLength(1);
    expect(res.citations).toHaveLength(1);
  });

  it("should_default_target_outcome_and_citations_when_null", () => {
    const res = rowToPrescriptionResponse(
      { ...baseRow, target_outcome: null, status: "pending" },
      "tok-1",
    );
    expect(res.target_outcome).toEqual([]);
    expect(res.citations).toEqual([]);
    expect(res.place).toBeNull();
  });
});

describe("citationRowsToCitations", () => {
  it("should_flatten_joined_source", () => {
    const out = citationRowsToCitations([
      {
        mechanism: "cortisol",
        relevance_note: "코르티솔 감소",
        forest_evidence_sources: {
          title: "Park 2010",
          authors: "Park et al.",
          year: 2010,
          source_url: "https://example.com",
        },
      },
    ]);
    expect(out[0].title).toBe("Park 2010");
    expect(out[0].mechanism).toBe("cortisol");
    expect(out[0].year).toBe(2010);
  });

  it("should_handle_missing_join", () => {
    const out = citationRowsToCitations([
      { mechanism: "x", relevance_note: null, forest_evidence_sources: null },
    ]);
    expect(out[0].title).toBe("");
  });
});

describe("rowToReportResponse", () => {
  it("should_compute_hit_rate_from_hit_miss", () => {
    const row: ReportRow = {
      journey_id: "j1",
      status: "completed",
      delta_summary: [{ axis: "sleep", pre: 4, post: 6, delta: 2, improved: true }],
      hit_miss: [
        { axis: "sleep", target_delta: 2, actual_delta: 2, hit: true },
        { axis: "fatigue", target_delta: -2, actual_delta: -1, hit: false },
      ],
      narrative: "n",
      citations_snapshot: [],
      last_error: null,
    };
    const res = rowToReportResponse(row, "tok-1");
    expect(res.hit_rate).toBe(0.5);
    expect(res.deltas).toHaveLength(1);
  });

  it("should_null_hit_rate_when_no_hypothesis", () => {
    const row: ReportRow = {
      journey_id: "j1",
      status: "pending",
      delta_summary: null,
      hit_miss: null,
      narrative: null,
      citations_snapshot: null,
      last_error: null,
    };
    const res = rowToReportResponse(row, "tok-1");
    expect(res.hit_rate).toBeNull();
    expect(res.deltas).toEqual([]);
  });
});
