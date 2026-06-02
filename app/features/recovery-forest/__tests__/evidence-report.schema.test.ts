import { describe, expect, it } from "vitest";

import { evidenceSourceSchema } from "../schemas/evidence.schema";
import { reportResponseSchema } from "../schemas/report.schema";

describe("evidenceSourceSchema", () => {
  it("should_accept_minimal_source", () => {
    const result = evidenceSourceSchema.safeParse({
      mechanism: "phytoncide",
      title: "Forest environments and NK cells",
    });
    expect(result.success).toBe(true);
  });

  it("should_accept_full_source_with_ites_seam", () => {
    const result = evidenceSourceSchema.safeParse({
      mechanism: "cortisol",
      title: "Forest bathing lowers salivary cortisol",
      authors: "Park et al.",
      year: 2010,
      source_url: "https://example.com/paper",
      summary: "산림 노출과 코르티솔 감소",
      external_ites_id: "ites-4821",
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_missing_mechanism", () => {
    const result = evidenceSourceSchema.safeParse({ title: "x" });
    expect(result.success).toBe(false);
  });

  it("should_reject_invalid_source_url", () => {
    const result = evidenceSourceSchema.safeParse({
      mechanism: "x",
      title: "x",
      source_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("reportResponseSchema", () => {
  it("should_parse_completed_report", () => {
    const sample = {
      journey_token: "tok-1",
      status: "completed",
      deltas: [
        { axis: "sleep", pre: 4, post: 6, delta: 2, improved: true },
        { axis: "fatigue", pre: 7, post: 5, delta: -2, improved: true },
      ],
      hit_miss: [
        { axis: "sleep", target_delta: 2, actual_delta: 2, hit: true },
      ],
      hit_rate: 1,
      narrative: "수면이 목표만큼 개선되었습니다.",
      citations: [],
    };
    expect(reportResponseSchema.safeParse(sample).success).toBe(true);
  });

  it("should_default_arrays_when_pending", () => {
    const result = reportResponseSchema.safeParse({
      journey_token: "tok-1",
      status: "pending",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deltas).toEqual([]);
      expect(result.data.hit_miss).toEqual([]);
    }
  });

  it("should_reject_hit_rate_above_one", () => {
    const result = reportResponseSchema.safeParse({
      journey_token: "tok-1",
      status: "completed",
      hit_rate: 1.5,
    });
    expect(result.success).toBe(false);
  });
});
