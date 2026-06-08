import { describe, expect, it } from "vitest";

import {
  consistencyCheck,
  dominantSpecies,
  phytoncidePotentialIndex,
} from "../services/phytoncide-index";

const baseWeather = { tempC: 20, humidityPct: 65, windMs: 1.0 };

describe("consistencyCheck", () => {
  it("should_reproduce_report_species_ranking", () => {
    // 보고서 순위(편백>소나무>낙엽송>잣>활엽수) 재현 = 발표 방어선
    expect(consistencyCheck()).toBe(true);
  });
});

describe("phytoncidePotentialIndex — 수종 순위", () => {
  const cond = { ...baseWeather, month: 7, hour: 10 };

  it("should_rank_hinoki_highest", () => {
    const hinoki = phytoncidePotentialIndex({ species: "편백", ...cond });
    const pine = phytoncidePotentialIndex({ species: "소나무", ...cond });
    const larch = phytoncidePotentialIndex({ species: "낙엽송", ...cond });
    const nut = phytoncidePotentialIndex({ species: "잣나무", ...cond });
    const broadleaf = phytoncidePotentialIndex({ species: "기타활엽수", ...cond });
    expect(hinoki).toBeGreaterThan(pine);
    expect(pine).toBeGreaterThan(larch);
    expect(larch).toBeGreaterThan(nut);
    expect(nut).toBeGreaterThan(broadleaf);
  });

  it("should_fall_back_to_default_for_unknown_species", () => {
    const unknown = phytoncidePotentialIndex({ species: "미상수종", ...cond });
    const broadleaf = phytoncidePotentialIndex({ species: "기타활엽수", ...cond });
    // 미상(DEFAULT_BASE 28) > 기타활엽수(22)
    expect(unknown).toBeGreaterThan(broadleaf);
  });
});

describe("phytoncidePotentialIndex — 계절 예외 (보고서 p.79~80)", () => {
  it("should_peak_hinoki_in_march", () => {
    const w = { tempC: 12, humidityPct: 60, windMs: 1.0, hour: 10 };
    const march = phytoncidePotentialIndex({ species: "편백", month: 3, ...w });
    const july = phytoncidePotentialIndex({ species: "편백", month: 7, ...w });
    expect(march).toBeGreaterThan(july);
  });

  it("should_peak_larch_in_may", () => {
    const w = { tempC: 18, humidityPct: 60, windMs: 1.0, hour: 10 };
    const may = phytoncidePotentialIndex({ species: "낙엽송", month: 5, ...w });
    const august = phytoncidePotentialIndex({ species: "낙엽송", month: 8, ...w });
    expect(may).toBeGreaterThan(august);
  });
});

describe("phytoncidePotentialIndex — 시간 (여름 정오 최저)", () => {
  it("should_dip_at_summer_noon", () => {
    const w = { species: "소나무", ...baseWeather, month: 7 };
    const morning = phytoncidePotentialIndex({ ...w, hour: 10 });
    const noon = phytoncidePotentialIndex({ ...w, hour: 12 });
    expect(noon).toBeLessThan(morning);
  });
});

describe("phytoncidePotentialIndex — 기상 방향 (p.88, p<.01)", () => {
  const cond = { species: "소나무", month: 5, hour: 10 };

  it("should_increase_with_temp", () => {
    const cool = phytoncidePotentialIndex({ ...cond, tempC: 10, humidityPct: 60, windMs: 1.0 });
    const warm = phytoncidePotentialIndex({ ...cond, tempC: 28, humidityPct: 60, windMs: 1.0 });
    expect(warm).toBeGreaterThan(cool);
  });

  it("should_increase_with_humidity", () => {
    const dry = phytoncidePotentialIndex({ ...cond, tempC: 18, humidityPct: 40, windMs: 1.0 });
    const humid = phytoncidePotentialIndex({ ...cond, tempC: 18, humidityPct: 85, windMs: 1.0 });
    expect(humid).toBeGreaterThan(dry);
  });

  it("should_decrease_with_wind", () => {
    const calm = phytoncidePotentialIndex({ ...cond, tempC: 18, humidityPct: 60, windMs: 0.5 });
    const windy = phytoncidePotentialIndex({ ...cond, tempC: 18, humidityPct: 60, windMs: 4.0 });
    expect(calm).toBeGreaterThan(windy);
  });
});

describe("dominantSpecies — tree_species 배열 어댑터", () => {
  it("should_pick_highest_base_species", () => {
    expect(dominantSpecies(["편백", "신갈나무"])).toBe("편백");
    expect(dominantSpecies(["잣나무", "소나무"])).toBe("소나무");
  });

  it("should_default_for_empty_array", () => {
    expect(dominantSpecies([])).toBe("기타활엽수");
  });
});
