import { describe, expect, it } from "vitest";

import type { RecommendationResult } from "../schemas/recommendation.schema";
import {
  scoreBadgeLabel,
  summarizeAir,
  summarizeWeather,
  toRadarPoints,
} from "../services/score-formatter";

const baseResult: RecommendationResult = {
  rank: 1,
  forest_id: "00000000-0000-0000-0000-000000000001",
  name: "○○치유의숲",
  type: "healing_forest",
  region: "경기 가평",
  total_score: 86,
  scores: {
    air: 92,
    weather: 80,
    forest: 75,
    exercise: 88,
    accessibility: 95,
  },
  reason: "...",
  recommended_activity: "...",
  programs: [],
};

describe("toRadarPoints", () => {
  it("should_return_five_axes_in_fixed_order", () => {
    const points = toRadarPoints(baseResult);
    expect(points.map((p) => p.axis)).toEqual([
      "air",
      "weather",
      "forest",
      "exercise",
      "accessibility",
    ]);
  });

  it("should_clamp_values_into_0_100_range", () => {
    const out = toRadarPoints({
      ...baseResult,
      scores: { air: 150, weather: -10, forest: 50, exercise: 50, accessibility: 50 },
    });
    expect(out[0].value).toBe(100);
    expect(out[1].value).toBe(0);
  });
});

describe("scoreBadgeLabel", () => {
  it.each([
    [90, "오늘 매우 추천"],
    [75, "오늘 좋아요"],
    [60, "괜찮아요"],
    [30, "참고용"],
  ])("should_return_badge_for_total_%i", (total, expected) => {
    expect(scoreBadgeLabel(total)).toBe(expected);
  });
});

describe("summarizeWeather", () => {
  it("should_join_only_present_fields", () => {
    expect(
      summarizeWeather({
        ...baseResult,
        current_temp_c: 19.3,
        current_humidity: 58,
      }),
    ).toBe("19℃ · 습도 58%");
  });

  it("should_return_empty_string_when_no_data", () => {
    expect(summarizeWeather(baseResult)).toBe("");
  });
});

describe("summarizeAir", () => {
  it("should_include_phytoncide_when_present", () => {
    expect(
      summarizeAir({
        ...baseResult,
        current_pm25: 12,
        predicted_phytoncide_pptv: 1820,
      }),
    ).toContain("피톤치드");
  });
});
