import { describe, expect, it } from "vitest";

import { prescribeOutputSchema } from "../schemas/prescribe-output.schema";
import {
  rankForests,
  SAMPLE_FORESTS,
  type UserType,
} from "../services/forest-ranking";
import { buildPrescribeOutput } from "../services/prescribe-output.builder";

const KPOMSB = { 긴장: 9, 우울: 6, 분노: 3, 활력: 4, 피로: 10, 혼란: 6 };

function build(userType: UserType, note = "조용히 쉬고 싶어요") {
  const scored = rankForests({
    user: { lat: 37.55, lon: 126.97 }, // 서울
    userType,
    forests: SAMPLE_FORESTS,
    month: 7,
    hour: 10,
  });
  return buildPrescribeOutput({
    scored,
    userType,
    healthGoal: "수면",
    visitDate: "2026-06-20",
    month: 6,
    arrivalHour: 10,
    note,
    kpomsb: KPOMSB,
  });
}

describe("처방 출력 빌더 (엔진 → 화면 스키마)", () => {
  it("엔진 랭킹을 출력 스키마에 맞게 매핑한다", () => {
    const out = build("comfort");
    expect(() => prescribeOutputSchema.parse(out)).not.toThrow();
    expect(out.ranking[0].rank).toBe(1);
    expect(out.ranking[0].engine_breakdown.species).toBeTruthy();
    expect(out.top_pick_detail.forest_name).toBe(out.ranking[0].forest_name);
  });

  it("주관식 입력이 상태 해석에 공감 반영된다", () => {
    const out = build("comfort");
    expect(out.user_summary.ai_state_reading).toContain("조용히 쉬고 싶어요");
  });

  it("유형 가중치 분기로 1순위가 갈린다(편안함형 vs 근거형)", () => {
    const comfort = build("comfort").ranking[0].forest_name;
    const explorer = build("explorer").ranking[0].forest_name;
    // 편안함형=거리 지배(가까운 경기 숲), 근거형=피톤치드 지배(편백 숲) → 다른 1순위.
    expect(comfort).not.toBe(explorer);
  });

  it("2·3위는 펼침 상세(detail)를 가지고 1위는 top_pick_detail 을 쓴다", () => {
    const out = build("comfort");
    expect(out.ranking[0].detail).toBeUndefined();
    if (out.ranking.length > 1) {
      expect(out.ranking[1].detail).toBeTruthy();
    }
  });
});
