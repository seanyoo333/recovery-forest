import { getServerEnv } from "~/lib/env.server";

/**
 * 실시간/예보 미세먼지(PM2.5) — 한국환경공단 에어코리아(data.go.kr).
 *
 * - 당일 방문: getCtprvnRltmMesureDnsty(시·도 실시간) → 시·도 측정소 평균 PM2.5.
 * - 미래 방문: getMinuDustFrcstDspth(시·도 예보 등급) → 등급을 대표 PM2.5 로 환산.
 * 키(DATA_GO_KR_SERVICE_KEY) 없음/실패/시간초과 시 null → 엔진이 폴백 상수 사용.
 * 시·도 단위 캐시(TTL)로 호출량을 묶는다(38개 숲이라도 시·도는 ~13개).
 *
 * 한계: 시·도 평균이라 같은 시·도 내 숲은 동일 PM2.5. (청정넷 숲내 센서는 V2.)
 */

const BASE = "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc";
const TTL_MS = 20 * 60 * 1000;
const TIMEOUT_MS = 4500;

// 예보 등급 → 대표 PM2.5(㎍/㎥). 지수 입력용 근사값.
const GRADE_PM25: Record<string, number> = {
  좋음: 10,
  보통: 25,
  나쁨: 55,
  매우나쁨: 90,
};

type Cache = { value: number | null; at: number };
const cache = new Map<string, Cache>();

function serviceKey(): string | null {
  try {
    return getServerEnv().DATA_GO_KR_SERVICE_KEY ?? null;
  } catch {
    return null;
  }
}

function todayKST(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

async function fetchJson(url: string): Promise<unknown | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseGradeForSido(informGrade: unknown, sido: string): string | null {
  if (typeof informGrade !== "string") return null;
  for (const part of informGrade.split(",")) {
    const [region, grade] = part.split(":").map((s) => s.trim());
    if (region === sido && grade) return grade;
  }
  return null;
}

/** 시·도(에어코리아 sidoName) + 방문일 → PM2.5(㎍/㎥) 또는 null. */
export async function getPm25BySido(
  sido: string,
  visitDate: string,
): Promise<number | null> {
  const key = serviceKey();
  if (!key) return null;

  const isToday = visitDate === "" || visitDate === todayKST();
  const cacheKey = `${sido}:${isToday ? "now" : "fc"}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const enc = encodeURIComponent(key);
  let value: number | null = null;

  if (isToday) {
    const url =
      `${BASE}/getCtprvnRltmMesureDnsty?sidoName=${encodeURIComponent(sido)}` +
      `&returnType=json&numOfRows=100&pageNo=1&ver=1.3&serviceKey=${enc}`;
    const json = (await fetchJson(url)) as
      | { response?: { body?: { items?: { pm25Value?: string }[] } } }
      | null;
    const items = json?.response?.body?.items;
    if (Array.isArray(items)) {
      const vals = items
        .map((it) => Number(it.pm25Value))
        .filter((n) => Number.isFinite(n) && n >= 0 && n < 500);
      if (vals.length > 0) {
        value = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      }
    }
  } else {
    const url =
      `${BASE}/getMinuDustFrcstDspth?searchDate=${todayKST()}` +
      `&returnType=json&numOfRows=20&pageNo=1&InformCode=PM25&serviceKey=${enc}`;
    const json = (await fetchJson(url)) as
      | { response?: { body?: { items?: { informGrade?: string }[] } } }
      | null;
    const items = json?.response?.body?.items;
    if (Array.isArray(items) && items.length > 0) {
      // 마지막 항목이 가장 최근 발표.
      const grade = parseGradeForSido(items[items.length - 1]?.informGrade, sido);
      if (grade) value = GRADE_PM25[grade] ?? null;
    }
  }

  cache.set(cacheKey, { value, at: Date.now() });
  return value;
}
