import { describe, expect, it } from "vitest";

import { recommendationInputSchema } from "../schemas/input.schema";

describe("recommendationInputSchema", () => {
  const validInput = {
    user_sido: "서울",
    user_sigungu: "강북구",
    user_priorities: ["air", "stress"] as const,
    user_fitness_level: "low" as const,
    user_travel_time_min: 60 as const,
    user_preferred_activity: "walking" as const,
  };

  it("should_accept_valid_input", () => {
    const result = recommendationInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should_reject_when_priorities_empty", () => {
    const result = recommendationInputSchema.safeParse({
      ...validInput,
      user_priorities: [],
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_when_priorities_exceed_three", () => {
    const result = recommendationInputSchema.safeParse({
      ...validInput,
      user_priorities: ["air", "stress", "accessibility", "immunity"],
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_when_sido_missing", () => {
    const result = recommendationInputSchema.safeParse({
      ...validInput,
      user_sido: "",
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_invalid_travel_time", () => {
    const result = recommendationInputSchema.safeParse({
      ...validInput,
      user_travel_time_min: 45,
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_invalid_fitness_level", () => {
    const result = recommendationInputSchema.safeParse({
      ...validInput,
      user_fitness_level: "extreme",
    });
    expect(result.success).toBe(false);
  });

  it("should_accept_missing_user_type", () => {
    // user_type 미지정도 유효(랭킹 단계에서 comfort 로 해석)
    const result = recommendationInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.user_type).toBeUndefined();
  });

  it("should_accept_explorer_user_type", () => {
    const result = recommendationInputSchema.safeParse({
      ...validInput,
      user_type: "explorer",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.user_type).toBe("explorer");
  });

  it("should_reject_invalid_user_type", () => {
    const result = recommendationInputSchema.safeParse({
      ...validInput,
      user_type: "tourist",
    });
    expect(result.success).toBe(false);
  });
});
