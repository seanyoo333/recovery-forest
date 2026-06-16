import { getServerEnv } from "~/lib/env.server";

/**
 * 단기예보 기온·습도·풍속 — 기상청 VilageFcstInfoService_2.0(data.go.kr).
 *
 * lat/lon → 기상청 5km 격자(nx,ny) 변환(Lambert Conformal Conic, 순수 수식) 후
 * getVilageFcst 로 방문일·시각의 TMP/REH/WSD 를 읽어 피톤치드 기상보정에 쓴다.
 * 키 없음/실패/예보범위(~3일) 밖이면 null → 엔진이 폴백 상수 사용.
 */

const BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const TTL_MS = 20 * 60 * 1000;
const TIMEOUT_MS = 4500;

export type Weather = { tempC: number; humidityPct: number; windMs: number };

type Cache = { value: Weather | null; at: number };
const cache = new Map<string, Cache>();

function serviceKey(): string | null {
  try {
    return getServerEnv().KMA_API_KEY ?? getServerEnv().DATA_GO_KR_SERVICE_KEY ?? null;
  } catch {
    return null;
  }
}

/** 기상청 격자 변환(dfs_xy_conv). 상수는 기상청 공식 사양. */
export function latLonToGrid(lat: number, lon: number): { nx: number; ny: number } {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

function nowKST(): Date {
  return new Date(Date.now() + 9 * 3600 * 1000);
}

function fmtYmd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** 가장 최근 발표 base_date/base_time(02·05·08·11·14·17·20·23시, 발표 지연 마진). */
function baseDateTime(): { base_date: string; base_time: string } {
  const slots = [23, 20, 17, 14, 11, 8, 5, 2];
  const d = nowKST();
  const effHour = d.getUTCMinutes() < 15 ? d.getUTCHours() - 1 : d.getUTCHours();
  const chosen = slots.find((s) => s <= effHour);
  if (chosen === undefined) {
    const prev = new Date(d.getTime() - 24 * 3600 * 1000);
    return { base_date: fmtYmd(prev), base_time: "2300" };
  }
  return { base_date: fmtYmd(d), base_time: String(chosen).padStart(2, "0") + "00" };
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

type FcstItem = { category: string; fcstDate: string; fcstTime: string; fcstValue: string };

export async function getWeather(
  lat: number,
  lon: number,
  visitDate: string,
  hour: number,
): Promise<Weather | null> {
  const key = serviceKey();
  if (!key) return null;

  const { nx, ny } = latLonToGrid(lat, lon);
  const targetYmd = visitDate ? visitDate.replace(/-/g, "") : fmtYmd(nowKST());
  const targetTime = String(Math.max(0, Math.min(23, hour))).padStart(2, "0") + "00";
  const cacheKey = `${nx},${ny}:${targetYmd}:${targetTime}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const { base_date, base_time } = baseDateTime();
  const enc = encodeURIComponent(key);
  const url =
    `${BASE}/getVilageFcst?dataType=JSON&base_date=${base_date}&base_time=${base_time}` +
    `&nx=${nx}&ny=${ny}&numOfRows=800&pageNo=1&serviceKey=${enc}`;
  const json = (await fetchJson(url)) as
    | { response?: { body?: { items?: { item?: FcstItem[] } } } }
    | null;
  const items = json?.response?.body?.items?.item;

  let value: Weather | null = null;
  if (Array.isArray(items)) {
    // 방문 시각이 예보에 없으면(범위 밖) 그 날짜의 가장 이른 예보 시각으로 폴백.
    let useTime: string | undefined = targetTime;
    if (!items.some((it) => it.fcstDate === targetYmd && it.fcstTime === targetTime)) {
      useTime = items
        .filter((it) => it.fcstDate === targetYmd)
        .map((it) => it.fcstTime)
        .sort()[0];
    }
    if (useTime) {
      const pick = (cat: string) =>
        Number(
          items.find(
            (it) => it.category === cat && it.fcstDate === targetYmd && it.fcstTime === useTime,
          )?.fcstValue,
        );
      const tempC = pick("TMP");
      const humidityPct = pick("REH");
      const windMs = pick("WSD");
      if (Number.isFinite(tempC) && Number.isFinite(humidityPct) && Number.isFinite(windMs)) {
        value = { tempC, humidityPct, windMs };
      }
    }
  }

  cache.set(cacheKey, { value, at: Date.now() });
  return value;
}
