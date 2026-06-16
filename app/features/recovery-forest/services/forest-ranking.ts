// =====================================================================
//  회복의 숲 처방 엔진 (Prescription Engine) — v1 (3축)
// ---------------------------------------------------------------------
//  prescription_engine.py 의 TS 포팅(이 스펙대로 동작, /api/prescribe 가 래핑).
//
//  설계 근거(인터뷰 2명, 2026-06): 두 사용자가 정반대 선호 →
//  단일 랭킹 불가, 유형별 가중치 분기가 필요하다.
//    · comfort(편안함형, 디폴트·일반 타겟): 거리가 결정의 전부, 잠/편안함 중심
//    · explorer(근거형):                    거리 무관, 차별성·과학적 근거 중심
//
//  점수 축 3개(각 0~100): ① 거리(접근성)  ② 피톤치드 잠재력 지수  ③ 미세먼지 안전
//   ※ ④ 프로그램 매칭은 제외(2026-06 결정). 산림교육/산림복지전문업/산림복지
//     세 소스 모두 위치 비구조화·치유 매칭 불가·정적 데이터로 부적합 → V2.
//  유형이 ①~③ 가중치를 바꾼다. (핵심 분기 = WEIGHTS 한 곳)
//
//  운영시 forest_places(38개) + 청정넷 실시간을 RankableForest 로 주입한다.
//  SAMPLE_FORESTS 는 엔진 동작 시연용 표본(좌표·기상은 예시값).
// =====================================================================
import { dominantSpecies, phytoncidePotentialIndex } from "./phytoncide-index";

export type UserType = "comfort" | "explorer";

export type AxisWeights = {
  distance: number;
  phyto: number;
  air: number;
};

/** 유형별 가중치(합=1.0). ④ 프로그램(.15/.30) 제거분을 ①③에 재분배. */
export const WEIGHTS: Record<UserType, AxisWeights> = {
  comfort: { distance: 0.5, phyto: 0.2, air: 0.3 }, // 편안함형: 거리 지배
  explorer: { distance: 0.1, phyto: 0.6, air: 0.3 }, // 근거형: 피톤치드 지배
};

/** forest_places 행에서 랭킹에 필요한 부분 + 실시간 기상(없으면 폴백). */
export type RankableForest = {
  id?: string;
  name: string;
  region?: string;
  /** 단축 시·도(에어코리아 sidoName) — 실시간 미세먼지·기상 최근접 조회용. */
  sido?: string;
  latitude: number;
  longitude: number;
  treeSpecies: string[];
  // 에어코리아/기상청 최근접(시·도) 실시간·예보(없으면 폴백값 사용). 랭킹·지수용.
  pm25?: number | null;
  tempC?: number | null;
  humidityPct?: number | null;
  windMs?: number | null;
  // 화면 표시용 "현재 실측" PM2.5(청정넷 매칭 시 청정넷, 아니면 에어코리아 현재). 랭킹엔 미사용.
  observedPm25?: number | null;
  pm25Source?: string;
};

export type LatLon = { lat: number; lon: number };

export type ForestScore = {
  forest: RankableForest;
  total: number;
  components: {
    distance: number;
    distanceKm: number;
    air: number;
    phyto: number;
  };
};

export type RankParams = {
  user: LatLon;
  userType: UserType;
  forests: RankableForest[];
  month: number;
  hour: number;
};

// 실시간 기상 결측 시 폴백(보고서 대상지 평균 근방)
export const FALLBACK_PM25 = 20;
const FALLBACK_TEMP_C = 20;
const FALLBACK_HUMIDITY = 60;
const FALLBACK_WIND = 1.0;

const EARTH_RADIUS_KM = 6371.0;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * 거리 점수: 가까울수록 가점(지수 감쇠).
 * 운영시 카카오 길찾기 '실제 이동시간'으로 교체 권장(데모는 직선거리).
 */
export function distanceScore(user: LatLon, forest: RankableForest): {
  score: number;
  km: number;
} {
  const km = haversineKm(user, { lat: forest.latitude, lon: forest.longitude });
  return { score: round1(100 * Math.exp(-km / 150)), km: Math.round(km) };
}

/** 미세먼지 안전 점수: PM2.5 낮을수록 가점(>35는 추천 회피 신호). */
export function airQualityScore(pm25: number): number {
  return round1(Math.max(0, 100 - pm25 * 1.8));
}

function phytoScore(forest: RankableForest, month: number, hour: number): number {
  return phytoncidePotentialIndex({
    species: dominantSpecies(forest.treeSpecies),
    tempC: forest.tempC ?? FALLBACK_TEMP_C,
    humidityPct: forest.humidityPct ?? FALLBACK_HUMIDITY,
    windMs: forest.windMs ?? FALLBACK_WIND,
    month,
    hour,
  });
}

/** 3축 점수화 → 유형별 가중 합 → 내림차순 랭킹. */
export function rankForests(params: RankParams): ForestScore[] {
  const { user, userType, forests, month, hour } = params;
  const w = WEIGHTS[userType];

  const rows: ForestScore[] = forests.map((forest) => {
    const { score: distance, km } = distanceScore(user, forest);
    const air = airQualityScore(forest.pm25 ?? FALLBACK_PM25);
    const phyto = phytoScore(forest, month, hour);
    const total = round1(w.distance * distance + w.air * air + w.phyto * phyto);
    return {
      forest,
      total,
      components: { distance, distanceKm: km, air, phyto },
    };
  });

  return rows.sort((a, b) => b.total - a.total);
}

// =====================================================================
//  처방 = 점수화 → 랭킹 → 처방전(왜 + 시점 + 목표 + 측정)
//  prescription_engine.py prescribe() 의 네이티브 계약 그대로.
// =====================================================================

/** 시연용 표본 숲 (운영시 Supabase forest_places 38개로 대체). */
export const SAMPLE_FORESTS: RankableForest[] = [
  { name: "장흥 편백 치유의 숲", region: "전남", latitude: 34.68, longitude: 126.91, treeSpecies: ["편백"], pm25: 12, tempC: 27, humidityPct: 72, windMs: 1.2 },
  { name: "축령산 편백 치유의 숲", region: "전남", latitude: 35.42, longitude: 126.86, treeSpecies: ["편백"], pm25: 10, tempC: 26, humidityPct: 70, windMs: 1.0 },
  { name: "잣향기 푸른숲", region: "경기", latitude: 37.83, longitude: 127.39, treeSpecies: ["잣나무"], pm25: 18, tempC: 25, humidityPct: 65, windMs: 1.5 },
  { name: "산음 치유의 숲", region: "경기", latitude: 37.65, longitude: 127.70, treeSpecies: ["혼효림"], pm25: 16, tempC: 25, humidityPct: 66, windMs: 1.4 },
  { name: "대관령 치유의 숲", region: "강원", latitude: 37.68, longitude: 128.72, treeSpecies: ["소나무"], pm25: 9, tempC: 23, humidityPct: 68, windMs: 2.2 },
  { name: "부산 치유의 숲", region: "부산", latitude: 35.27, longitude: 129.14, treeSpecies: ["기타활엽수"], pm25: 22, tempC: 28, humidityPct: 74, windMs: 1.8 },
];

export type PrescribeInput = {
  goal: string;
  lat: number;
  lon: number;
  user_type: UserType;
  month: number;
  hour: number;
};

export type PrescribeResult = {
  user_type: UserType;
  goal: string;
  pick: string;
  score: number;
  visit_time: string;
  why: string;
  target_outcome: string;
  post_measure: {
    "방문 전": string[];
    "방문 직후": string[];
    "3일 후": string[];
  };
  ranking: { name: string; total: number; phyto: number; distance_km: number }[];
};

const TARGET_OUTCOMES: Record<string, string> = {
  수면: "수면질 향상(주관 수면점수 +20%)",
  스트레스: "긴장 완화·안정감 증가",
};

const POST_MEASURE = {
  "방문 전": ["수면점수(1-10)", "피로도(1-10)"],
  "방문 직후": ["회복감(1-10)", "한 줄 기분"],
  "3일 후": ["수면점수(1-10)"],
} as const;

/** 피톤치드 시점 근거(보고서 p.79~80): 여름 정오 회피, 오전 권장. */
export function optimalTime(species: string, month: number): string {
  if (month >= 6 && month <= 9) return "오전 9~11시 (여름 정오는 농도 최저라 회피)";
  if (species === "편백" && month >= 2 && month <= 4)
    return "오전, 3월 전후가 편백 피톤치드 연중 최고";
  return "오전 9~11시";
}

export function airLabel(pm25: number): string {
  return pm25 <= 15 ? "쾌적" : pm25 <= 35 ? "양호" : "주의";
}

/**
 * "왜 이 숲인가" 근거 문구. 유형별 강조점이 다르다.
 * 의료 단정 표현(치료/효능/진단) 금지 — 데이터·근거 기반 서술만.
 */
export function buildWhy(pick: ForestScore, userType: UserType): string {
  const { forest, components } = pick;
  const species = dominantSpecies(forest.treeSpecies);
  const pm25 = forest.pm25 ?? FALLBACK_PM25;
  const aq = airLabel(pm25);
  if (userType === "comfort") {
    return (
      `집에서 약 ${components.distanceKm}km로 가깝고, 현재 초미세먼지 ${pm25}㎍/㎥로 ` +
      `${aq}한 환경입니다 (${species}림).`
    );
  }
  return (
    `피톤치드 잠재력 지수 ${components.phyto}점(상위)으로 ${species}림의 강점이 ` +
    `뚜렷하고, 초미세먼지 ${pm25}㎍/㎥로 ${aq}합니다. ` +
    `농도 근거: 국립산림과학원 연구(편백>소나무>낙엽송>잣, p<.01).`
  );
}

/**
 * 처방: 3축 랭킹으로 숲을 고르고 처방전을 만든다.
 * prescription_engine.py prescribe() 와 동일 계약.
 */
export function prescribe(
  input: PrescribeInput,
  forests: RankableForest[] = SAMPLE_FORESTS,
): PrescribeResult {
  const ranking = rankForests({
    user: { lat: input.lat, lon: input.lon },
    userType: input.user_type,
    forests,
    month: input.month,
    hour: input.hour,
  });
  const top = ranking[0];
  const species = dominantSpecies(top.forest.treeSpecies);
  return {
    user_type: input.user_type,
    goal: input.goal,
    pick: top.forest.name,
    score: top.total,
    visit_time: optimalTime(species, input.month),
    why: buildWhy(top, input.user_type),
    target_outcome: TARGET_OUTCOMES[input.goal] ?? "회복감 증가",
    post_measure: {
      "방문 전": [...POST_MEASURE["방문 전"]],
      "방문 직후": [...POST_MEASURE["방문 직후"]],
      "3일 후": [...POST_MEASURE["3일 후"]],
    },
    ranking: ranking.map((r) => ({
      name: r.forest.name,
      total: r.total,
      phyto: r.components.phyto,
      distance_km: r.components.distanceKm,
    })),
  };
}
