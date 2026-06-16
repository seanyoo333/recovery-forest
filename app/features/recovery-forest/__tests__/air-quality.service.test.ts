import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/env.server", () => ({
  getServerEnv: () => ({ DATA_GO_KR_SERVICE_KEY: "test-key" }),
}));

import { getPm25BySido } from "../services/air-quality.service";

function todayKST(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function stub(json: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok, json: async () => json }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("에어코리아 PM2.5", () => {
  it("실시간: 시·도 측정소 평균(결측 '-' 제외)", async () => {
    stub({
      response: {
        body: { items: [{ pm25Value: "10" }, { pm25Value: "20" }, { pm25Value: "-" }] },
      },
    });
    expect(await getPm25BySido("경기", todayKST())).toBe(15);
  });

  it("예보(미래일): 시·도 등급을 대표 PM2.5로 환산", async () => {
    stub({
      response: { body: { items: [{ informGrade: "서울 : 보통,강원 : 나쁨,경기 : 좋음" }] } },
    });
    expect(await getPm25BySido("강원", "2099-01-01")).toBe(55); // 나쁨 → 55
  });

  it("HTTP 실패 시 null(엔진 폴백)", async () => {
    stub({}, false);
    expect(await getPm25BySido("부산", todayKST())).toBeNull();
  });
});
