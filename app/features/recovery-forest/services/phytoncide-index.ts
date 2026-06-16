// =====================================================================
//  피톤치드 잠재력 지수 (Phytoncide Potential Index, PPI)
// ---------------------------------------------------------------------
//  근거: 국립산림과학원,「산림치유자원 연구보고서 — 기상환경과 임분특성에
//        따른 피톤치드 농도 경향분석」(전국 30개 지역 117개 지점, 2017~2024)
//
//  ★ 핵심 원칙
//   - 이 지수는 '절대 농도(pptv) 예측'이 아니라, 보고서가 통계적으로 검증한
//     '순위(ordinal)와 방향'에 기반한 투명한 상대 지수(0~100)다.
//   - 본 지수가 산출하는 수종 순위는 보고서 순위(편백>소나무>낙엽송>잣)와
//     일치해야 한다(consistencyCheck 로 고정).
//   - 모든 가중치에 보고서 출처를 주석으로 명시 → 발표 방어용.
//   - 수종 '순위'는 보고서 근거, 점수 '간격'은 조정 가능한 설계값(튜닝 대상).
//
//  prescription_engine 등에서 호출하는 순수 함수 모듈(외부 의존 없음).
// =====================================================================

/**
 * 1) 수종 기본점수 — dominant_species 단일 enum(8값)으로만 결정한다.
 *    근거(4종): 보고서 결론(p.13, p.88) "수종별 피톤치드 농도는
 *      편백림 > 소나무림 > 낙엽송림 > 잣나무림 순"(편백은 동일 기온서도 최고).
 *    설계값(4종): 기타침엽수·기타활엽수·혼효림·미상 은 보고서가 개별 측정하지 않은
 *      보조분류 값(낮은 확신도). 근거 강도는 species_base_scores.note 로 구분한다.
 *    개별 활엽수(참나무류·자작나무 등)는 모두 기타활엽수로, 리기다소나무·곰솔 등은
 *      기타침엽수로, 우점 불명확은 혼효림으로 통합한다(8 enum 외 자유입력 금지).
 */
export const SPECIES_BASE: Record<string, number> = {
  편백: 85, // 보고서 순위 1위 (p.88)
  소나무: 65, // 보고서 순위 2위
  기타침엽수: 50, // 설계값 (침엽 중간, 보고서 미측정)
  낙엽송: 48, // 보고서 순위 3위
  잣나무: 40, // 보고서 순위 4위
  혼효림: 35, // 설계값 (침활 중간)
  미상: 30, // 중립 기본값
  기타활엽수: 22, // 설계값 (활엽, 보고서 미측정)
};

/** 미매핑/미상 수종 = 중립 기본값(미상과 동일). */
export const DEFAULT_BASE = 30;

/** 배열이 비었을 때의 폴백 수종(미상). */
const FALLBACK_SPECIES = "미상";

export type Weather = {
  tempC: number;
  humidityPct: number;
  windMs: number;
};

export type PhytoncideInput = Weather & {
  species: string;
  month: number;
  hour: number;
  /** true 면 0~100 으로 캡. 랭킹은 raw 기준이 정확. */
  normalize?: boolean;
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 2) 기상 보정
 *    근거: 보고서 결론(p.13, p.88, p<.01)
 *          "기온과 습도는 높을수록, 풍속은 낮을수록 높은 농도".
 *    기준점: 산림 대상지 평균(표19~21) — 기온 ~15℃, 습도 ~60%, 풍속 낮음.
 *    각 인자를 완만한 배수로(±). 종 기본점수가 주(主) 동인이 되도록 폭 제한.
 */
export function weatherModifier({ tempC, humidityPct, windMs }: Weather): number {
  let t = 1.0 + 0.02 * (tempC - 15); // 15℃=1.0, 25℃≈1.20, 5℃≈0.80
  let h = 1.0 + 0.004 * (humidityPct - 60); // 60%=1.0, 80%≈1.08, 40%≈0.92
  let w = 1.0 - 0.05 * windMs; // 0m/s=1.0, 4m/s≈0.80
  // 과도한 보정 방지 클램프
  t = clamp(t, 0.7, 1.4);
  h = clamp(h, 0.85, 1.15);
  w = clamp(w, 0.7, 1.05);
  return t * h * w;
}

/**
 * 3) 시점 보정 (계절 × 시간)
 *    근거: 보고서 p.79~80
 *      - 대부분 수종 여름(6,7,8월) 최고
 *      - 편백림은 3월 최고 / 낙엽송림은 5월 최고 (예외)
 *      - 6~9월 정오(12시 전후) 농도 최저(산화반응), 야간 높음
 */
export function timingModifier(species: string, month: number, hour: number): number {
  let season: number;
  if (species === "편백") {
    season =
      month === 3 ? 1.2 : month === 2 || month === 4 ? 1.1 : month >= 5 && month <= 8 ? 1.0 : 0.9;
  } else if (species === "낙엽송") {
    season =
      month === 5 ? 1.2 : month === 4 || month === 6 ? 1.1 : month === 7 || month === 8 ? 1.0 : 0.9;
  } else {
    season =
      month >= 6 && month <= 8 ? 1.15 : month === 4 || month === 5 || month === 9 ? 1.0 : 0.85;
  }

  let tod: number;
  if (month >= 6 && month <= 9 && hour >= 11 && hour <= 14) {
    tod = 0.85; // 여름 정오 최저
  } else if (hour >= 9 && hour <= 17) {
    tod = 1.0; // 주간
  } else {
    tod = 1.1; // 야간/이른아침 높음
  }

  return season * tod;
}

/**
 * 종합 지수: 수종 + 실시간 기상 + 시점 → 피톤치드 잠재력 상대 지수(0~100).
 * normalize=false 면 raw(랭킹용으로 더 정확).
 */
export function phytoncidePotentialIndex(input: PhytoncideInput): number {
  const { species, tempC, humidityPct, windMs, month, hour, normalize = true } = input;
  const base = SPECIES_BASE[species] ?? DEFAULT_BASE;
  const raw =
    base * weatherModifier({ tempC, humidityPct, windMs }) * timingModifier(species, month, hour);
  return normalize ? round1(Math.min(raw, 100)) : round1(raw);
}

/**
 * tree_species 배열(혼효림 다수종)에서 대표 수종을 고른다.
 * 기본점수가 가장 높은 수종 채택 → 시점 예외(편백 3월 등)가 올바로 적용된다.
 * 빈 배열이면 기타활엽수로 폴백.
 */
export function dominantSpecies(treeSpecies: string[]): string {
  if (treeSpecies.length === 0) return FALLBACK_SPECIES;
  return treeSpecies.reduce((best, current) => {
    const bestBase = SPECIES_BASE[best] ?? DEFAULT_BASE;
    const currentBase = SPECIES_BASE[current] ?? DEFAULT_BASE;
    return currentBase > bestBase ? current : best;
  });
}

/**
 * 내장 정합성 체크: 동일 조건에서 수종 순위가 보고서와 일치하는지.
 * 발표 방어선 — 테스트로 고정한다.
 */
export function consistencyCheck(): boolean {
  const cond = { tempC: 20, humidityPct: 65, windMs: 1.0, month: 7, hour: 10 };
  const order = ["편백", "소나무", "낙엽송", "잣나무", "기타활엽수"];
  const scores = order.map((species) => phytoncidePotentialIndex({ species, ...cond }));
  return scores.every((score, i) => i === 0 || scores[i - 1] >= score);
}
