import { describe, expect, it } from "vitest";

import { postSurveySchema } from "../schemas/post-survey.schema";
import { preSurveySchema } from "../schemas/pre-survey.schema";

const validRecommendationPart = {
  user_sido: "서울",
  user_sigungu: "강북구",
  user_priorities: ["air", "stress"] as const,
  user_fitness_level: "low" as const,
  user_travel_time_min: 60 as const,
  user_preferred_activity: "walking" as const,
};

describe("preSurveySchema", () => {
  const validPre = {
    ...validRecommendationPart,
    sleep_score: 4,
    fatigue_score: 7,
    mood_score: 5,
    stress_score: 6,
    months_since_treatment: 12,
  };

  it("should_accept_valid_pre_survey", () => {
    expect(preSurveySchema.safeParse(validPre).success).toBe(true);
  });

  it("should_allow_null_months_since_treatment", () => {
    const result = preSurveySchema.safeParse({
      ...validPre,
      months_since_treatment: null,
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_wellness_score_out_of_range", () => {
    const result = preSurveySchema.safeParse({ ...validPre, sleep_score: 11 });
    expect(result.success).toBe(false);
  });

  it("should_reject_non_integer_wellness_score", () => {
    const result = preSurveySchema.safeParse({ ...validPre, fatigue_score: 5.5 });
    expect(result.success).toBe(false);
  });

  it("should_reject_when_recommendation_part_invalid", () => {
    const result = preSurveySchema.safeParse({ ...validPre, user_sido: "" });
    expect(result.success).toBe(false);
  });
});

describe("postSurveySchema", () => {
  const validPost = {
    sleep_score: 6,
    fatigue_score: 5,
    mood_score: 7,
    stress_score: 4,
    impression: "한결 가벼워졌어요",
  };

  it("should_accept_valid_post_survey", () => {
    expect(postSurveySchema.safeParse(validPost).success).toBe(true);
  });

  it("should_accept_empty_impression", () => {
    const result = postSurveySchema.safeParse({ ...validPost, impression: "" });
    expect(result.success).toBe(true);
  });

  it("should_reject_score_below_one", () => {
    const result = postSurveySchema.safeParse({ ...validPost, mood_score: 0 });
    expect(result.success).toBe(false);
  });
});
