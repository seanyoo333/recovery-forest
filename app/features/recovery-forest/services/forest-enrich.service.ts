import { getPm25BySido } from "./air-quality.service";
import type { RankableForest } from "./forest-ranking";
import { getWeather, type Weather } from "./weather.service";

/**
 * 38개 숲에 실시간/예보 미세먼지·기상을 주입한다(엔진 입력 보강).
 *
 * - 미세먼지: 시·도 단위(에어코리아 시·도 평균/예보). 에어코리아는 도시 측정소라
 *   산속 숲에 "최근접"을 붙여도 도시값이라 가짜 정밀도 → 시·도 평균이 더 정직·안정.
 * - 기상: 숲별 최근접 격자(기상청 5km 격자는 산악 포함 → 숲 자기 좌표가 의미 있음).
 *
 * 각 호출은 자체 폴백(null)이라, 실패한 숲은 엔진 폴백 상수로 계산된다.
 * getWeather 는 격자 키로 내부 캐시 → 같은 격자 숲은 호출이 묶인다.
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

  // 미세먼지(시·도) + 기상(숲별 격자)을 모두 병렬로.
  const [, wx] = await Promise.all([
    Promise.all(
      sidos.map((sido) =>
        getPm25BySido(sido, visitDate)
          .then((v) => pm.set(sido, v))
          .catch(() => pm.set(sido, null)),
      ),
    ),
    Promise.all(
      forests.map((f) =>
        getWeather(f.latitude, f.longitude, visitDate, hour).catch(
          () => null as Weather | null,
        ),
      ),
    ),
  ]);

  return forests.map((f, i) => {
    const p = f.sido ? pm.get(f.sido) : null;
    const w = wx[i];
    return {
      ...f,
      pm25: p ?? f.pm25 ?? null,
      tempC: w?.tempC ?? f.tempC ?? null,
      humidityPct: w?.humidityPct ?? f.humidityPct ?? null,
      windMs: w?.windMs ?? f.windMs ?? null,
    };
  });
}
