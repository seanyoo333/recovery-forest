import { describe, expect, it } from "vitest";

import { recommendationResponseSchema } from "../schemas/recommendation.schema";

describe("recommendationResponseSchema", () => {
  it("should_parse_valid_completed_response", () => {
    const sample = {
      session_id: "abc-123",
      status: "completed",
      recommended_at: "2026-05-20T10:00:00+09:00",
      ai_summary: "오늘은 미세먼지가 낮아 걷기에 좋아요.",
      results: [
        {
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
          predicted_phytoncide_pptv: 1820,
          current_pm25: 12,
          current_temp_c: 19,
          current_humidity: 58,
          current_wind_ms: 1.2,
          travel_time_min: 55,
          reason: "공기가 좋고 접근성이 우수합니다.",
          caution: "",
          recommended_activity: "30분 저강도 산책",
          programs: [],
        },
      ],
    };
    const result = recommendationResponseSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });

  it("should_reject_when_total_score_out_of_range", () => {
    const result = recommendationResponseSchema.safeParse({
      session_id: "abc",
      status: "completed",
      results: [
        {
          rank: 1,
          forest_id: "00000000-0000-0000-0000-000000000001",
          name: "x",
          type: "trail",
          region: "x",
          total_score: 150,
          scores: { air: 10, weather: 10, forest: 10, exercise: 10, accessibility: 10 },
          reason: "x",
          recommended_activity: "x",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("should_accept_failed_status_with_last_error", () => {
    const result = recommendationResponseSchema.safeParse({
      session_id: "abc",
      status: "failed",
      last_error: "weather api down",
      results: [],
    });
    expect(result.success).toBe(true);
  });
});
