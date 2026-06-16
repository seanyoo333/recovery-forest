import { describe, expect, it } from "vitest";

import { COMFORT_INPUT_DEMO, EXPLORER_INPUT_DEMO } from "../fixtures/prescription-demo";
import { prescribeInputSchema } from "../schemas/prescribe-input.schema";

describe("처방 입력 스키마", () => {
  it("comfort/explorer 입력 예시가 통과한다", () => {
    expect(() => prescribeInputSchema.parse(COMFORT_INPUT_DEMO)).not.toThrow();
    expect(() => prescribeInputSchema.parse(EXPLORER_INPUT_DEMO)).not.toThrow();
  });

  it("데이터 활용 동의(consent.data_use_agreed)가 false 면 실패한다", () => {
    const bad = {
      ...COMFORT_INPUT_DEMO,
      consent: { data_use_agreed: false, followup_optin: false },
    };
    expect(prescribeInputSchema.safeParse(bad).success).toBe(false);
  });

  it("K-POMS-B 범위(0~12)를 벗어나면 실패한다", () => {
    const bad = {
      ...COMFORT_INPUT_DEMO,
      kpomsb_pre: { ...COMFORT_INPUT_DEMO.kpomsb_pre, 긴장: 99 },
    };
    expect(prescribeInputSchema.safeParse(bad).success).toBe(false);
  });

  it("알 수 없는 health_goal 은 실패한다", () => {
    const bad = { ...COMFORT_INPUT_DEMO, health_goal: "행복" };
    expect(prescribeInputSchema.safeParse(bad).success).toBe(false);
  });
});
