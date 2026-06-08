import { describe, expect, it } from "vitest";

import {
  SAMPLE_FORESTS,
  WEIGHTS,
  distanceScore,
  prescribe,
  rankForests,
  type RankableForest,
} from "../services/forest-ranking";

const seoul = { lat: 37.55, lon: 126.97 };

// 가까운 잣나무 숲 vs 먼 편백 숲 — 인터뷰가 정한 정반대 선호를 가르는 표본
const nutNear: RankableForest = {
  name: "잣향기 푸른숲",
  latitude: 37.83,
  longitude: 127.39,
  treeSpecies: ["잣나무"],
  pm25: 18,
  tempC: 25,
  humidityPct: 65,
  windMs: 1.5,
};

const hinokiFar: RankableForest = {
  name: "축령산 편백 치유의 숲",
  latitude: 35.42,
  longitude: 126.86,
  treeSpecies: ["편백"],
  pm25: 10,
  tempC: 26,
  humidityPct: 70,
  windMs: 1.0,
};

const forests = [nutNear, hinokiFar];
const ctx = { month: 7, hour: 10 };

describe("WEIGHTS (3축)", () => {
  it("should_each_sum_to_one", () => {
    for (const type of ["comfort", "explorer"] as const) {
      const sum = Object.values(WEIGHTS[type]).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it("should_have_no_program_axis", () => {
    for (const type of ["comfort", "explorer"] as const) {
      expect(Object.keys(WEIGHTS[type]).sort()).toEqual(["air", "distance", "phyto"]);
    }
  });
});

describe("distanceScore", () => {
  it("should_reward_closer_forests", () => {
    const near = distanceScore(seoul, nutNear);
    const far = distanceScore(seoul, hinokiFar);
    expect(near.score).toBeGreaterThan(far.score);
    expect(near.km).toBeLessThan(far.km);
  });
});

describe("rankForests — comfort vs explorer 분기 (발표 클라이맥스)", () => {
  it("should_pick_near_forest_for_comfort", () => {
    const ranked = rankForests({ user: seoul, userType: "comfort", forests, ...ctx });
    expect(ranked[0].forest.name).toBe("잣향기 푸른숲");
  });

  it("should_pick_high_phytoncide_forest_for_explorer", () => {
    const ranked = rankForests({ user: seoul, userType: "explorer", forests, ...ctx });
    expect(ranked[0].forest.name).toBe("축령산 편백 치유의 숲");
  });

  it("should_only_expose_three_component_axes", () => {
    const top = rankForests({ user: seoul, userType: "comfort", forests, ...ctx })[0];
    expect(Object.keys(top.components).sort()).toEqual([
      "air",
      "distance",
      "distanceKm",
      "phyto",
    ]);
  });
});

describe("prescribe — 네이티브 엔진 계약 (prescription_engine.py 동등)", () => {
  it("should_pick_near_forest_for_comfort_over_sample", () => {
    const rx = prescribe({
      goal: "수면",
      lat: seoul.lat,
      lon: seoul.lon,
      user_type: "comfort",
      month: 7,
      hour: 10,
    });
    expect(rx.pick).toBe("잣향기 푸른숲");
    expect(rx.why).toContain("km");
    expect(rx.target_outcome).toContain("수면");
    expect(rx.visit_time).toContain("오전");
    expect(rx.ranking.length).toBe(SAMPLE_FORESTS.length);
  });

  it("should_pick_hinoki_for_explorer_with_citation", () => {
    const rx = prescribe({
      goal: "스트레스",
      lat: seoul.lat,
      lon: seoul.lon,
      user_type: "explorer",
      month: 7,
      hour: 10,
    });
    expect(rx.pick).toContain("편백");
    expect(rx.why).toContain("국립산림과학원");
  });

  it("should_flip_top_pick_between_types", () => {
    const base = { goal: "수면", lat: seoul.lat, lon: seoul.lon, month: 7, hour: 10 } as const;
    const comfortTop = prescribe({ ...base, user_type: "comfort" }).pick;
    const explorerTop = prescribe({ ...base, user_type: "explorer" }).pick;
    expect(comfortTop).not.toBe(explorerTop);
  });

  it("should_not_use_medical_claim_terms_in_why", () => {
    const rx = prescribe({
      goal: "스트레스",
      lat: seoul.lat,
      lon: seoul.lon,
      user_type: "explorer",
      month: 7,
      hour: 10,
    });
    for (const banned of ["치료", "효능", "진단"]) {
      expect(rx.why).not.toContain(banned);
    }
  });
});
