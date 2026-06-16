import { describe, expect, it } from "vitest";

import { COMFORT_DEMO, EXPLORER_DEMO, pickDemoOutput } from "../fixtures/prescription-demo";
import { prescribeOutputSchema } from "../schemas/prescribe-output.schema";

describe("처방 출력 픽스처 ↔ 스키마 정합", () => {
  it("COMFORT_DEMO 가 출력 스키마를 통과한다", () => {
    expect(() => prescribeOutputSchema.parse(COMFORT_DEMO)).not.toThrow();
  });

  it("EXPLORER_DEMO 가 출력 스키마를 통과한다", () => {
    expect(() => prescribeOutputSchema.parse(EXPLORER_DEMO)).not.toThrow();
  });

  it("두 예시 모두 랭킹 3개와 1위 상세를 가진다", () => {
    for (const demo of [COMFORT_DEMO, EXPLORER_DEMO]) {
      expect(demo.ranking).toHaveLength(3);
      expect(demo.ranking[0].rank).toBe(1);
      // 1위 상세의 숲명은 랭킹 1위와 일치해야 한다.
      expect(demo.top_pick_detail.forest_name).toBe(demo.ranking[0].forest_name);
      expect(demo.top_pick_detail.ai_personal_plan.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("pickDemoOutput 은 user_type 으로 올바른 처방을 고른다", () => {
    expect(pickDemoOutput("comfort").user_summary.user_type).toBe("comfort");
    expect(pickDemoOutput("explorer").user_summary.user_type).toBe("explorer");
    // 알 수 없는 값은 comfort 로 폴백.
    expect(pickDemoOutput("???").user_summary.user_type).toBe("comfort");
  });
});
