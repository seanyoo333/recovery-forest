// =====================================================================
//  지역 → 대표 좌표 (Region Centroid)
// ---------------------------------------------------------------------
//  입력은 시·도/시·군·구 텍스트(좌표 없음). 거리 점수 계산을 위해
//  시·도 대표 좌표로 변환한다. 데모는 시·도 중심으로 충분하며,
//  카카오 길찾기 실제 이동시간은 함정 목록(데모 비범위)이다.
//  sigungu 는 향후 정밀화 여지를 위해 시그니처에만 둔다.
// =====================================================================
import type { LatLon } from "./forest-ranking";

/** 17개 시·도 대표 좌표(도청/시청 근방). */
export const SIDO_CENTROIDS: Record<string, LatLon> = {
  서울: { lat: 37.5665, lon: 126.978 },
  부산: { lat: 35.1796, lon: 129.0756 },
  대구: { lat: 35.8714, lon: 128.6014 },
  인천: { lat: 37.4563, lon: 126.7052 },
  광주: { lat: 35.1595, lon: 126.8526 },
  대전: { lat: 36.3504, lon: 127.3845 },
  울산: { lat: 35.5384, lon: 129.3114 },
  세종: { lat: 36.48, lon: 127.289 },
  경기: { lat: 37.4138, lon: 127.5183 },
  강원: { lat: 37.8228, lon: 128.1555 },
  충북: { lat: 36.6357, lon: 127.4917 },
  충남: { lat: 36.5184, lon: 126.8 },
  전북: { lat: 35.7175, lon: 127.153 },
  전남: { lat: 34.8679, lon: 126.991 },
  경북: { lat: 36.4919, lon: 128.8889 },
  경남: { lat: 35.4606, lon: 128.2132 },
  제주: { lat: 33.4996, lon: 126.5312 },
};

/** 미상 시·도 폴백(국토 대략 중심). */
const FALLBACK_COORDS: LatLon = { lat: 36.5, lon: 127.8 };

/**
 * 시·도 명칭을 정규화해 키를 찾는다.
 * "서울특별시" / "강원특별자치도" / "전라남도" 등 전체 명칭도 접두 매칭.
 */
function resolveSidoKey(sido: string): string | null {
  const trimmed = sido.trim();
  for (const key of Object.keys(SIDO_CENTROIDS)) {
    if (trimmed.startsWith(key)) return key;
  }
  // "전라남도" → "전남" 같은 축약형 매칭
  const aliases: Record<string, string> = {
    전라남도: "전남",
    전라북도: "전북",
    충청남도: "충남",
    충청북도: "충북",
    경상남도: "경남",
    경상북도: "경북",
    강원특별자치도: "강원",
    전북특별자치도: "전북",
    제주특별자치도: "제주",
  };
  for (const [alias, key] of Object.entries(aliases)) {
    if (trimmed.startsWith(alias)) return key;
  }
  return null;
}

/** 시·도/시·군·구 → 대표 좌표. 미상이면 국토 중심으로 폴백. */
export function userCoordsFromRegion(sido: string, _sigungu: string): LatLon {
  const key = resolveSidoKey(sido);
  return key ? SIDO_CENTROIDS[key] : FALLBACK_COORDS;
}
