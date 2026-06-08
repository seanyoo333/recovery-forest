import { describe, expect, it } from "vitest";

import {
  SIDO_CENTROIDS,
  userCoordsFromRegion,
} from "../services/region-centroid";

describe("SIDO_CENTROIDS", () => {
  it("should_cover_all_17_sido", () => {
    expect(Object.keys(SIDO_CENTROIDS).length).toBe(17);
  });
});

describe("userCoordsFromRegion", () => {
  it("should_resolve_seoul_near_expected", () => {
    const { lat, lon } = userCoordsFromRegion("서울", "강북구");
    expect(lat).toBeGreaterThan(37);
    expect(lat).toBeLessThan(38);
    expect(lon).toBeGreaterThan(126);
    expect(lon).toBeLessThan(128);
  });

  it("should_resolve_full_sido_name_variants", () => {
    // "서울특별시" 같은 전체 명칭도 매칭
    const a = userCoordsFromRegion("서울특별시", "강북구");
    const b = userCoordsFromRegion("서울", "강북구");
    expect(a).toEqual(b);
  });

  it("should_fall_back_for_unknown_sido", () => {
    const coords = userCoordsFromRegion("아틀란티스", "");
    expect(typeof coords.lat).toBe("number");
    expect(typeof coords.lon).toBe("number");
  });
});
