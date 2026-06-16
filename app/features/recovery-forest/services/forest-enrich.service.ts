import { getPm25BySido } from "./air-quality.service";
import type { RankableForest } from "./forest-ranking";
import { SIDO_CENTROIDS } from "./region-centroid";
import { getWeather, type Weather } from "./weather.service";

/**
 * 38개 숲에 실시간/예보 미세먼지·기상을 주입한다(엔진 입력 보강).
 * 시·도 단위로 묶어 호출(시·도 ~13개) → 시·도별 PM2.5 + 대표 좌표 기상.
 * 각 호출은 자체 폴백(null)이라, 실패한 숲은 엔진 폴백 상수로 계산된다.
 */
export async function enrichForests(
  forests: RankableForest[],
  visitDate: string,
  hour: number,
): Promise<RankableForest[]> {
  const sidos = Array.from(
    new Set(forests.map((f) => f.sido).filter((s): s is string => !!s)),
  );

  const pm = new Map<string, number | null>();
  const wx = new Map<string, Weather | null>();

  await Promise.all(
    sidos.flatMap((sido) => {
      const centroid = SIDO_CENTROIDS[sido];
      return [
        getPm25BySido(sido, visitDate)
          .then((v) => pm.set(sido, v))
          .catch(() => pm.set(sido, null)),
        centroid
          ? getWeather(centroid.lat, centroid.lon, visitDate, hour)
              .then((v) => wx.set(sido, v))
              .catch(() => wx.set(sido, null))
          : Promise.resolve(),
      ];
    }),
  );

  return forests.map((f) => {
    const p = f.sido ? pm.get(f.sido) : null;
    const w = f.sido ? wx.get(f.sido) : null;
    return {
      ...f,
      pm25: p ?? f.pm25 ?? null,
      tempC: w?.tempC ?? f.tempC ?? null,
      humidityPct: w?.humidityPct ?? f.humidityPct ?? null,
      windMs: w?.windMs ?? f.windMs ?? null,
    };
  });
}
