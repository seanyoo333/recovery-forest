import { describe, expect, it } from "vitest";

import { sidoFromAddress } from "../services/region-centroid";
import { latLonToGrid } from "../services/weather.service";

describe("기상청 격자 변환", () => {
  it("서울 좌표 → 격자 (60,127)", () => {
    expect(latLonToGrid(37.5665, 126.978)).toEqual({ nx: 60, ny: 127 });
  });

  it("정수 격자를 반환한다", () => {
    const g = latLonToGrid(35.1796, 129.0756); // 부산
    expect(Number.isInteger(g.nx)).toBe(true);
    expect(Number.isInteger(g.ny)).toBe(true);
  });
});

describe("주소 → 에어코리아 시·도명", () => {
  it("다양한 표기를 단축 시·도로 정규화한다", () => {
    expect(sidoFromAddress("경기도 양평군 단월면 고북길 347")).toBe("경기");
    expect(sidoFromAddress("전남 장흥군 유치면")).toBe("전남");
    expect(sidoFromAddress("충청북도 제천시 봉양읍")).toBe("충북");
    expect(sidoFromAddress("대구광역시 달성군 가창면")).toBe("대구");
    expect(sidoFromAddress("강원도 횡성군 둔내면")).toBe("강원");
  });

  it("알 수 없는 주소는 null", () => {
    expect(sidoFromAddress("해외 어딘가")).toBeNull();
  });
});
