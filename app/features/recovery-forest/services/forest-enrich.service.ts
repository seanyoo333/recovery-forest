import { getPm25BySido } from "./air-quality.service";
import { cleannetPm25ByForest } from "./cleannet.service";
import type { RankableForest } from "./forest-ranking";
import { getWeather, type Weather } from "./weather.service";

/**
 * 38개 숲에 실시간/예보 미세먼지·기상을 주입한다(엔진 입력 보강).
 *
 * - 랭킹·지수용 pm25: 시·도(에어코리아 당일 실시간/미래 예보). 에어코리아는 도시
 *   측정소라 산속 숲 "최근접"은 가짜 정밀도 → 시·도 평균이 더 정직·안정.
 * - 기상: 숲별 최근접 격자(기상청 5km 격자는 산악 포함 → 숲 자기 좌표가 의미 있음).
 * - 화면 표시용 observedPm25: "현재 실측" — 청정넷(숲내 측정) 매칭+신선 시 청정넷,
 *   아니면 에어코리아 시·도 현재. (랭킹엔 미사용 — 숲별 기준 혼합 방지)
 *
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
  const pmRank = new Map<string, number | null>(); // 랭킹용(방문일 기준)
  const pmNow = new Map<string, number | null>(); // 표시용(현재 실시간)

  const [, , wx, cleannet] = await Promise.all([
    // 랭킹용 시·도 PM2.5(당일=실시간, 미래=예보)
    Promise.all(
      sidos.map((sido) =>
        getPm25BySido(sido, visitDate)
          .then((v) => pmRank.set(sido, v))
          .catch(() => pmRank.set(sido, null)),
      ),
    ),
    // 표시용 시·도 현재 실시간(빈 문자열 → 항상 realtime)
    Promise.all(
      sidos.map((sido) =>
        getPm25BySido(sido, "")
          .then((v) => pmNow.set(sido, v))
          .catch(() => pmNow.set(sido, null)),
      ),
    ),
    // 숲별 최근접 격자 기상
    Promise.all(
      forests.map((f) =>
        getWeather(f.latitude, f.longitude, visitDate, hour).catch(
          () => null as Weather | null,
        ),
      ),
    ),
    // 청정넷(숲내 실측) 매칭 — 미매칭은 생략
    cleannetPm25ByForest(forests).catch(() => new Map<string, number>()),
  ]);

  return forests.map((f, i) => {
    const sidoRank = f.sido ? pmRank.get(f.sido) : null;
    const sidoNow = f.sido ? pmNow.get(f.sido) : null;
    const w = wx[i];
    const cn = f.id ? cleannet.get(f.id) : undefined;

    const observedPm25 = cn ?? sidoNow ?? f.pm25 ?? null;
    const pm25Source =
      cn != null ? "청정넷 숲내 실측" : sidoNow != null ? "에어코리아 시·도" : undefined;

    return {
      ...f,
      pm25: sidoRank ?? f.pm25 ?? null,
      tempC: w?.tempC ?? f.tempC ?? null,
      humidityPct: w?.humidityPct ?? f.humidityPct ?? null,
      windMs: w?.windMs ?? f.windMs ?? null,
      observedPm25,
      pm25Source,
    };
  });
}
