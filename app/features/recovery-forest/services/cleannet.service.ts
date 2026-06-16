import { getServerEnv } from "~/lib/env.server";

import { haversineKm } from "./forest-ranking";

/**
 * 청정넷(산림 미세먼지 측정넷, 국립산림과학원) — 숲 내부 실측 PM2.5.
 * docs/cleannet-api-guide.md 기반: ① obsrrInfoWFS(지점 좌표) ② dustData(10분 실측).
 *
 * 용도: 결과 화면의 "현재 실측" 미세먼지 표시값을 숲에 매칭되는 청정넷으로 보강.
 * 예보가 없어 미래 지수 계산엔 못 쓴다 → 랭킹/지수는 에어코리아(시·도)가 담당.
 * 매칭 실패/신선도 초과/키 없음/오류 시 빈 결과 → 호출측이 에어코리아로 폴백.
 */

const META_URL = "https://apis.data.go.kr/1400377/AicanObsrrInfo/obsrrInfoWFS";
const DUST_URL = "https://apis.data.go.kr/1400377/AicanDustData/dustData";
const UA = { "User-Agent": "recovery-forest" };
const TIMEOUT_MS = 4500;

const STATIONS_TTL_MS = 6 * 60 * 60 * 1000; // 좌표는 거의 안 바뀜
const DUST_TTL_MS = 8 * 60 * 1000;
const FRESH_MAX_MIN = 60; // 9시간 stale 사례 → 신선도 가드 필수
const MATCH_KM = 15; // 숲 ↔ 청정넷 지점 매칭 임계(이내면 '현재 실측'으로 표시)

type CleannetStation = { groupCode: string; lat: number; lon: number };
type GroupReading = { pm25: number; dtm: string };

let stationsCache: { value: CleannetStation[]; at: number } | null = null;
let dustCache: { value: Map<string, GroupReading>; at: number } | null = null;

function serviceKey(): string | null {
  try {
    return getServerEnv().DATA_GO_KR_SERVICE_KEY ?? null;
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: UA, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function xmlTag(block: string, t: string): string | null {
  const m = block.match(new RegExp(`<FINDDUST:${t}>(.*?)</FINDDUST:${t}>`, "s"));
  return m ? m[1] : null;
}

function parseStations(xml: string): CleannetStation[] {
  const out: CleannetStation[] = [];
  for (const m of xml.matchAll(/<gml:featureMember>(.*?)<\/gml:featureMember>/gs)) {
    const block = m[1];
    const lat = Number(xmlTag(block, "obsrr_lttd"));
    const lon = Number(xmlTag(block, "obsrr_lngtd"));
    const groupCode = xmlTag(block, "obsrr_group_cd");
    if (!groupCode || !lat || !lon) continue; // 좌표 누락 지점 제외
    out.push({ groupCode, lat, lon });
  }
  return out;
}

async function getStations(): Promise<CleannetStation[]> {
  if (stationsCache && Date.now() - stationsCache.at < STATIONS_TTL_MS) {
    return stationsCache.value;
  }
  const key = serviceKey();
  if (!key) return [];
  const url = `${META_URL}?serviceKey=${encodeURIComponent(key)}&layers=frstre_avenue&maxFeatures=100`;
  const xml = await fetchText(url);
  const value = xml ? parseStations(xml) : [];
  if (value.length > 0) stationsCache = { value, at: Date.now() };
  return value;
}

function fmtKst(d: Date): string {
  // yyyyMMddHHmmss (KST)
  return new Date(d.getTime() + 9 * 3600 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace(/[-:T]/g, "");
}

function isFresh(dtm: string): boolean {
  // dtm: "yyyyMMddHHmm" (KST)
  if (dtm.length < 12) return false;
  const y = +dtm.slice(0, 4);
  const mo = +dtm.slice(4, 6) - 1;
  const d = +dtm.slice(6, 8);
  const h = +dtm.slice(8, 10);
  const mi = +dtm.slice(10, 12);
  const obsUtc = Date.UTC(y, mo, d, h - 9, mi); // KST→UTC
  return (Date.now() - obsUtc) / 60000 <= FRESH_MAX_MIN;
}

/** 최근 실측을 그룹코드(앞 3자리)별 최신 신선값으로 정리. */
async function getDustByGroup(): Promise<Map<string, GroupReading>> {
  if (dustCache && Date.now() - dustCache.at < DUST_TTL_MS) return dustCache.value;
  const key = serviceKey();
  if (!key) return new Map();

  const now = new Date();
  const start = fmtKst(new Date(now.getTime() - 90 * 60 * 1000));
  const end = fmtKst(now);
  const url =
    `${DUST_URL}?serviceKey=${encodeURIComponent(key)}&numOfRows=500&pageNo=1` +
    `&contentType=JSON&startDt=${start}&endDt=${end}`;

  const text = await fetchText(url);
  const map = new Map<string, GroupReading>();
  if (text) {
    try {
      const json = JSON.parse(text) as {
        items?: { obsrr_tpcd?: string; obsrt_pm25_val?: number; obsrt_dtm?: string }[];
      };
      for (const it of json.items ?? []) {
        const tpcd = it.obsrr_tpcd;
        const pm25 = Number(it.obsrt_pm25_val);
        const dtm = it.obsrt_dtm;
        if (!tpcd || !dtm || !Number.isFinite(pm25) || pm25 < 0) continue;
        const group = tpcd.slice(0, 3);
        const prev = map.get(group);
        if (!prev || dtm > prev.dtm) map.set(group, { pm25: Math.round(pm25), dtm });
      }
    } catch {
      // 파싱 실패 → 빈 맵(폴백)
    }
  }
  dustCache = { value: map, at: Date.now() };
  return map;
}

function nearestGroup(
  lat: number,
  lon: number,
  stations: CleannetStation[],
): { groupCode: string; km: number } | null {
  let best: { groupCode: string; km: number } | null = null;
  for (const s of stations) {
    const km = haversineKm({ lat, lon }, { lat: s.lat, lon: s.lon });
    if (!best || km < best.km) best = { groupCode: s.groupCode, km };
  }
  return best;
}

/** 숲들 → 매칭(≤MATCH_KM)되고 신선한 청정넷 PM2.5. id 기준 Map(미매칭은 생략). */
export async function cleannetPm25ByForest(
  forests: { id?: string; latitude: number; longitude: number }[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const [stations, dust] = await Promise.all([getStations(), getDustByGroup()]);
  if (stations.length === 0 || dust.size === 0) return result;

  for (const f of forests) {
    if (!f.id) continue;
    const near = nearestGroup(f.latitude, f.longitude, stations);
    if (!near || near.km > MATCH_KM) continue;
    const reading = dust.get(near.groupCode);
    if (reading && isFresh(reading.dtm)) result.set(f.id, reading.pm25);
  }
  return result;
}
