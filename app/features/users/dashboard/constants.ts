import type { Category, GridOptionKind } from "./types";

/**
 * Default Grid Options by Category
 *
 * 각 카테고리별 기본 그리드 옵션 정의
 */
export const DEFAULT_GRID_OPTIONS: Record<
  Category,
  Array<{ label: string; kind: GridOptionKind; sort_order: number }>
> = {
  exercise: [
    { label: "저강도", kind: "preset", sort_order: 1 },
    { label: "중강도", kind: "preset", sort_order: 2 },
    { label: "고강도", kind: "preset", sort_order: 3 },
  ],
  sleep: [
    { label: "불면", kind: "preset", sort_order: 1 },
    { label: "보통", kind: "preset", sort_order: 2 },
    { label: "숙면", kind: "preset", sort_order: 3 },
  ],
  supplement: [{ label: "섭취", kind: "preset", sort_order: 1 }],
  diet: [
    { label: "단식", kind: "preset", sort_order: 1 },
    { label: "보통", kind: "preset", sort_order: 2 },
    { label: "과식", kind: "preset", sort_order: 3 },
  ],
  therapy: [{ label: "실행", kind: "preset", sort_order: 1 }],
};

/**
 * 카테고리별 옵션 점수 정의
 */
export const CATEGORY_SCORES: Record<Category, Record<string, number>> = {
  exercise: {
    __none__: 0,
    저강도: 1,
    중강도: 2,
    고강도: 2,
    __template__: 3, // 루틴실행
  },
  sleep: {
    __none__: 0,
    불면: -1,
    보통: 2,
    숙면: 3,
    __template__: 3,
  },
  supplement: {
    __none__: 0,
    섭취: 2,
    __template__: 3,
  },
  diet: {
    __none__: 0,
    단식: 1,
    보통: 2,
    과식: -1,
    __template__: 3,
  },
  therapy: {
    __none__: 0,
    실행: 2,
    __template__: 3,
  },
};

/**
 * 카테고리별 가중치 (다음 행동 추천용)
 */
export const CATEGORY_WEIGHTS: Record<Category, number> = {
  sleep: 1.3,
  diet: 1.1,
  exercise: 1.0,
  therapy: 0.8,
  supplement: 0.9,
};

/**
 * 신호등 임계값
 */
export const TRAFFIC_LIGHT_THRESHOLDS = {
  GREEN: 1, // delta >= +1
  RED: -1, // delta <= -1
} as const;

/**
 * 기록 성공 기준
 */
export const RECORD_SUCCESS_THRESHOLD = 2; // filled_count >= 2
export const GRACE_PER_WEEK = 1; // 주 1회 보호

/**
 * 표준 혈액검사 항목 정의
 * 모든 standard_name은 소문자로 통일하여 관리
 */
export const STANDARD_BLOOD_TEST_TYPES = [
  // 일반 메트릭
  {
    standard_name: "lmr",
    unit: "",
    reference_min: null,
    reference_max: null,
    clinical_significance: null,
  },
  {
    standard_name: "nlr",
    unit: "",
    reference_min: null,
    reference_max: null,
    clinical_significance: null,
  },
  {
    standard_name: "glucose",
    unit: "mg/dL",
    reference_min: 70,
    reference_max: 100,
    clinical_significance: "정상 범위: 70-100 mg/dL",
  },
  {
    standard_name: "hgba1c",
    unit: "%",
    reference_min: 4.0,
    reference_max: 5.6,
    clinical_significance: "정상 범위: 4.0-5.6%",
  },
  {
    standard_name: "ldh",
    unit: "U/L",
    reference_min: 140,
    reference_max: 280,
    clinical_significance: "정상 범위: 140-280 U/L",
  },
  {
    standard_name: "crp",
    unit: "mg/dL",
    reference_min: 0,
    reference_max: 0.3,
    clinical_significance: "정상 범위: 0-0.3 mg/dL",
  },
  {
    standard_name: "vitamin_d3",
    unit: "ng/mL",
    reference_min: 30,
    reference_max: 100,
    clinical_significance: "정상 범위: 30-100 ng/mL",
  },
  {
    standard_name: "platelet",
    unit: "10³/µL",
    reference_min: 150,
    reference_max: 450,
    clinical_significance: "정상 범위: 150-450 10³/µL",
  },
  {
    standard_name: "ast",
    unit: "U/L",
    reference_min: 10,
    reference_max: 40,
    clinical_significance: "정상 범위: 10-40 U/L",
  },
  {
    standard_name: "alt",
    unit: "U/L",
    reference_min: 10,
    reference_max: 40,
    clinical_significance: "정상 범위: 10-40 U/L",
  },
  {
    standard_name: "egfr",
    unit: "mL/min/1.73㎡",
    reference_min: 90,
    reference_max: null,
    clinical_significance: "정상 범위: 90 이상",
  },
  {
    standard_name: "cholesterol",
    unit: "mg/dL",
    reference_min: null,
    reference_max: 200,
    clinical_significance: "정상 범위: 200 mg/dL 이하",
  },
  // 추가 OCR 항목
  {
    standard_name: "wbc",
    unit: "10³/µL",
    reference_min: 4.0,
    reference_max: 10.0,
    clinical_significance: "정상 범위: 4.0-10.0 10³/µL",
  },
  {
    standard_name: "rbc",
    unit: "10⁶/µL",
    reference_min: 4.5,
    reference_max: 5.5,
    clinical_significance: "정상 범위: 4.5-5.5 10⁶/µL",
  },
  {
    standard_name: "hgb",
    unit: "g/dL",
    reference_min: 12.0,
    reference_max: 16.0,
    clinical_significance: "정상 범위: 12.0-16.0 g/dL",
  },
  {
    standard_name: "hct",
    unit: "%",
    reference_min: 36,
    reference_max: 46,
    clinical_significance: "정상 범위: 36-46%",
  },
  {
    standard_name: "mcv",
    unit: "fL",
    reference_min: 80,
    reference_max: 100,
    clinical_significance: "정상 범위: 80-100 fL",
  },
  {
    standard_name: "mchc",
    unit: "g/dL",
    reference_min: 32,
    reference_max: 36,
    clinical_significance: "정상 범위: 32-36 g/dL",
  },
  {
    standard_name: "rdw",
    unit: "%",
    reference_min: 11.5,
    reference_max: 14.5,
    clinical_significance: "정상 범위: 11.5-14.5%",
  },
  {
    standard_name: "pdw",
    unit: "fL",
    reference_min: null,
    reference_max: null,
    clinical_significance: null,
  },
  {
    standard_name: "neutrophil",
    unit: "%",
    reference_min: 50,
    reference_max: 70,
    clinical_significance: "정상 범위: 50-70%",
  },
  {
    standard_name: "lymphocyte",
    unit: "%",
    reference_min: 20,
    reference_max: 40,
    clinical_significance: "정상 범위: 20-40%",
    descriptions: {
      description:
        "면역반응 관여 백혈구 (T림프구- 세포성 면역, B림프구-체액성면역)",
      significance: {
        up: [
          "세균성 상기도 감염",
          "바이러스 감염",
          "호르몬 질환",
          "결핵",
          "림프성 백혈병",
        ],
        down: [
          "호지킨병",
          "쿠싱증후군",
          "부신피질호르몬사용",
          "외상",
          "초기 급성 radiation syndrome",
          "화상",
          "AIDS",
          "면역억제제",
        ],
      },
    },
  },
  {
    standard_name: "monocyte",
    unit: "%",
    reference_min: 2,
    reference_max: 8,
    clinical_significance: "정상 범위: 2-8%",
  },
  {
    standard_name: "eosinophil",
    unit: "%",
    reference_min: 1,
    reference_max: 4,
    clinical_significance: "정상 범위: 1-4%",
  },
  {
    standard_name: "basophil",
    unit: "%",
    reference_min: 0,
    reference_max: 1,
    clinical_significance: "정상 범위: 0-1%",
  },
  {
    standard_name: "total_bilirubin",
    unit: "mg/dL",
    reference_min: 0.2,
    reference_max: 1.2,
    clinical_significance: "정상 범위: 0.2-1.2 mg/dL",
  },
  {
    standard_name: "gtp",
    unit: "U/L",
    reference_min: 0,
    reference_max: 50,
    clinical_significance: "정상 범위: 0-50 U/L",
  },
  {
    standard_name: "bun",
    unit: "mg/dL",
    reference_min: 7,
    reference_max: 20,
    clinical_significance: "정상 범위: 7-20 mg/dL",
  },
  {
    standard_name: "creatinine",
    unit: "mg/dL",
    reference_min: 0.6,
    reference_max: 1.2,
    clinical_significance: "정상 범위: 0.6-1.2 mg/dL",
  },
  {
    standard_name: "uric_acid",
    unit: "mg/dL",
    reference_min: 3.5,
    reference_max: 7.2,
    clinical_significance: "정상 범위: 3.5-7.2 mg/dL",
  },
  {
    standard_name: "triglyceride",
    unit: "mg/dL",
    reference_min: null,
    reference_max: 150,
    clinical_significance: "정상 범위: 150 mg/dL 이하",
  },
  {
    standard_name: "hdl",
    unit: "mg/dL",
    reference_min: 40,
    reference_max: null,
    clinical_significance: "정상 범위: 40 mg/dL 이상",
  },
  {
    standard_name: "ldl",
    unit: "mg/dL",
    reference_min: null,
    reference_max: 100,
    clinical_significance: "정상 범위: 100 mg/dL 이하",
  },
  {
    standard_name: "free_t3",
    unit: "pg/mL",
    reference_min: 2.3,
    reference_max: 4.2,
    clinical_significance: "정상 범위: 2.3-4.2 pg/mL",
  },
  {
    standard_name: "free_t4",
    unit: "ng/dL",
    reference_min: 0.9,
    reference_max: 1.7,
    clinical_significance: "정상 범위: 0.9-1.7 ng/dL",
  },
  {
    standard_name: "tsh",
    unit: "µIU/mL",
    reference_min: 0.4,
    reference_max: 4.0,
    clinical_significance: "정상 범위: 0.4-4.0 µIU/mL",
  },
  {
    standard_name: "homocysteine",
    unit: "µmol/L",
    reference_min: null,
    reference_max: 15,
    clinical_significance: "정상 범위: 15 µmol/L 이하",
  },
  // 종양표지자
  {
    standard_name: "tumor_marker_cea",
    unit: "ng/mL",
    reference_min: null,
    reference_max: 3.0,
    clinical_significance: "정상 범위: 3.0 ng/mL 이하",
  },
  {
    standard_name: "tumor_marker_ca199",
    unit: "U/mL",
    reference_min: null,
    reference_max: 37,
    clinical_significance: "정상 범위: 37 U/mL 이하",
  },
  {
    standard_name: "tumor_marker_ca125",
    unit: "U/mL",
    reference_min: null,
    reference_max: 35,
    clinical_significance: "정상 범위: 35 U/mL 이하",
  },
  {
    standard_name: "tumor_marker_ca153",
    unit: "U/mL",
    reference_min: null,
    reference_max: 30,
    clinical_significance: "정상 범위: 30 U/mL 이하",
  },
  {
    standard_name: "tumor_marker_psa",
    unit: "ng/mL",
    reference_min: null,
    reference_max: 4.0,
    clinical_significance: "정상 범위: 4.0 ng/mL 이하",
  },
  {
    standard_name: "tumor_marker_afp",
    unit: "ng/mL",
    reference_min: null,
    reference_max: 10,
    clinical_significance: "정상 범위: 10 ng/mL 이하",
  },
  {
    standard_name: "tumor_marker_ca724",
    unit: "U/mL",
    reference_min: null,
    reference_max: 6.9,
    clinical_significance: "정상 범위: 6.9 U/mL 이하",
  },
  {
    standard_name: "tumor_marker_nse",
    unit: "ng/mL",
    reference_min: null,
    reference_max: 16.3,
    clinical_significance: "정상 범위: 16.3 ng/mL 이하",
  },
  {
    standard_name: "tumor_marker_scc",
    unit: "ng/mL",
    reference_min: null,
    reference_max: 1.5,
    clinical_significance: "정상 범위: 1.5 ng/mL 이하",
  },
] as const;

/**
 * standard_name 정규화 함수 (소문자로 통일)
 */
export function normalizeStandardName(name: string): string {
  return name.toLowerCase().trim();
}
