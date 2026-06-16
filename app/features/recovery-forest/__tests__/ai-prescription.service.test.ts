import { afterEach, describe, expect, it, vi } from "vitest";

// env.server 를 모킹해 OPENAI_API_KEY 만 제공(실제 전체 env 불필요).
vi.mock("~/lib/env.server", () => ({
  getServerEnv: () => ({ OPENAI_API_KEY: "test-key" }),
}));

import { generatePrescriptionNarrative } from "../services/ai-prescription.service";

const PAYLOAD = {
  user: {
    user_type: "comfort" as const,
    health_goal: "수면",
    free_text: "조용히 쉬고 싶어요",
    kpomsb_pre: { 긴장: 10, 우울: 6, 분노: 3, 활력: 4, 피로: 10, 혼란: 6 },
  },
  engine_pick: {
    name: "잣향기 푸른숲",
    score: 67,
    phytoncide_index: 52,
    distance_km: 48,
    pm25: 18,
    air_label: "양호",
    species: "잣나무",
    visit_time_tip: "오전 9~11시",
  },
};

function mockFetchOnce(content: string, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: async () => ({ choices: [{ message: { content } }] }),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AI 처방 서술 (LLM)", () => {
  it("유효한 JSON 응답을 Narrative 로 파싱한다", async () => {
    mockFetchOnce(
      JSON.stringify({
        state_reading: "긴장과 피로가 높은 편으로 보입니다.",
        why_this_forest: "가깝고 조용해 잘 맞습니다. 무리 없이 머물 수 있습니다.",
        personal_plan: ["잣나무 그늘에서 천천히 걷기", "호흡 고르기"],
        note: "오전 방문을 권합니다.",
      }),
    );
    const out = await generatePrescriptionNarrative(PAYLOAD);
    expect(out).not.toBeNull();
    expect(out?.personal_plan.length).toBeGreaterThanOrEqual(1);
    expect(out?.state_reading).toContain("긴장");
  });

  it("금지어(진단·치료 단정)가 섞이면 null 로 폴백한다", async () => {
    mockFetchOnce(
      JSON.stringify({
        state_reading: "우울증입니다.",
        why_this_forest: "이 숲이 완치시킵니다. 두번째 문장.",
        personal_plan: ["걷기"],
        note: "치료됩니다.",
      }),
    );
    expect(await generatePrescriptionNarrative(PAYLOAD)).toBeNull();
  });

  it("HTTP 오류 시 null 을 반환한다", async () => {
    mockFetchOnce("{}", false);
    expect(await generatePrescriptionNarrative(PAYLOAD)).toBeNull();
  });
});
