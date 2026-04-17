import type { Category, GridOptionKind, TimeBlock } from "./types";
import {
  AXIS_LABEL,
  META_AXES,
  type MetaAxis,
} from "~/core/meta-axis";

export { AXIS_LABEL, META_AXES, type MetaAxis };

/**
 * 카테고리별 허용 시간대 정의
 *
 * 각 카테고리에서 UI에 표시할 시간대를 제한
 */
export const CATEGORY_ALLOWED_TIME_BLOCKS: Record<Category, TimeBlock[]> = {
  exercise: ["am", "noon", "pm"], // 운동: 아침, 점심, 저녁만
  sleep: ["bed"], // 수면: 자기전만
  supplement: ["am", "noon", "pm", "bed"], // 보조제: 모든 시간대
  diet: ["am", "noon", "pm"], // 식단: 아침, 점심, 저녁만
  therapy: ["am", "noon", "pm", "bed"], // 보조요법: 모든 시간대
};

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
    { label: "없음", kind: "preset", sort_order: 0 },
    { label: "저강도", kind: "preset", sort_order: 1 },
    { label: "중강도", kind: "preset", sort_order: 2 },
    { label: "고강도", kind: "preset", sort_order: 3 },
  ],
  sleep: [
    { label: "없음", kind: "preset", sort_order: 0 },
    { label: "불면", kind: "preset", sort_order: 1 },
    { label: "보통", kind: "preset", sort_order: 2 },
    { label: "숙면", kind: "preset", sort_order: 3 },
  ],
  supplement: [
    { label: "없음", kind: "preset", sort_order: 0 },
    { label: "섭취", kind: "preset", sort_order: 1 },
  ],
  diet: [
    { label: "없음", kind: "preset", sort_order: 0 },
    { label: "보통", kind: "preset", sort_order: 1 },
    { label: "과식", kind: "preset", sort_order: 2 },
  ],
  therapy: [
    { label: "없음", kind: "preset", sort_order: 0 },
    { label: "실행", kind: "preset", sort_order: 1 },
  ],
};

/**
 * 카테고리별 옵션 점수 정의
 */
export const CATEGORY_SCORES: Record<Category, Record<string, number>> = {
  exercise: {
    __none__: 0,
    저강도: 2,
    중강도: 2,
    고강도: 2,
    __template__: 3, // 최저 0, 최고 9
  },
  sleep: {
    __none__: -1, // 수면의 "없음"은 -1점
    불면: -1,
    보통: 2,
    숙면: 3,
    __template__: 3, // 최저 -1, 최고 3
  },
  supplement: {
    __none__: 0,
    섭취: 2,
    __template__: 3, // 최저 0, 최고 12
  },
  diet: {
    __none__: 0,
    보통: 2,
    과식: -1,
    __template__: 3, // 최저 -3, 최고 9
  },
  therapy: {
    __none__: 0,
    실행: 2,
    __template__: 3, // 최저 0, 최고 12
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
 * 생활습관 카테고리 → 메타축 가중치 매핑 (5축)
 * 가중치는 "각 카테고리 점수가 어떤 축에 얼마나 기여하냐"를 의미
 */
export const HABIT_TO_AXIS_WEIGHT: Record<
  Category,
  Partial<Record<MetaAxis, number>>
> = {
  exercise: {
    metabolic_stability: 0.35,
    immune_balance: 0.3,
    abnormal_signals: 0.1,
    neuro_stress: 0.15,
    recovery: 0.1,
  },
  sleep: {
    metabolic_stability: 0.1,
    immune_balance: 0.25,
    abnormal_signals: 0.1,
    neuro_stress: 0.4,
    recovery: 0.15,
  },
  diet: {
    metabolic_stability: 0.45,
    immune_balance: 0.25,
    abnormal_signals: 0.2,
    neuro_stress: 0.05,
    recovery: 0.05,
  },
  therapy: {
    metabolic_stability: 0.1,
    immune_balance: 0.2,
    abnormal_signals: 0.2,
    neuro_stress: 0.4,
    recovery: 0.1,
  },
  supplement: {
    // supplement는 생활습관 점수에 포함되지 않음 (천연물 점수로만 계산)
    metabolic_stability: 0,
    immune_balance: 0,
    abnormal_signals: 0,
    neuro_stress: 0,
    recovery: 0,
  },
};

/**
 * 카테고리별 최대값 (정규화용)
 */
export const CATEGORY_MAX: Record<Category, number> = {
  exercise: 9, // 아침/점심/저녁 3칸 × 3점
  sleep: 3, // 최저 -1 최고 3
  diet: 9, // 최저 -3 최고 9
  therapy: 12, // 최저 0 최고 12
  supplement: 12, // 보조제는 생활습관 점수에 사용 안 함
};

/**
 * 천연물 점수 계산 상수
 */
export const SUPPLEMENT_CALCULATION_CONSTANTS = {
  // 신뢰도 포화 상수
  KC: 0.35, // confidence 포화 상수
  // 복용량 포화 상수
  KD: 0.6, // dose factor 포화 상수
  // 롱테일 반영률
  ALPHA: 0.25, // 롱테일 반영률 (0.15~0.30 추천)
  // 축 포화 변환 상수
  KS: 0.9, // rawAxis를 0~100으로 변환하는 포화 상수
  // TopK 개수
  TOP_K: 2, // 핵심 표적 개수
} as const;

/**
 * 타겟 슬러그 → 메타축 매핑 (5축)
 * 
 * 각 타겟이 어떤 메타축에 속하는지 정의
 * - metabolic_stability: 대사 안정화 관련 타겟
 * - immune_balance: 면역 균형 관련 타겟
 * - abnormal_signals: 비정상 신호조절 관련 타겟
 * - neuro_stress: 신경·스트레스 관련 타겟 (현재 타겟 없음)
 * - recovery: 회복증진 관련 타겟
 */
export const TARGET_TO_META_AXIS: Record<string, MetaAxis> = {
  // 대사 안정화 (metabolic_stability)
  insulin: "metabolic_stability",
  igf1: "metabolic_stability",
  glut1: "metabolic_stability",
  aerobic_glycolysis: "metabolic_stability",
  pppathway: "metabolic_stability",
  hexokinase2: "metabolic_stability",
  oxphos: "metabolic_stability",
  complex1: "metabolic_stability",
  pdh: "metabolic_stability",
  pdk: "metabolic_stability",
  ampk: "metabolic_stability",
  ldha: "metabolic_stability",
  lactate: "metabolic_stability",
  acetyl_coa: "metabolic_stability",
  mct1: "metabolic_stability",
  mct4: "metabolic_stability",
  g6pd: "metabolic_stability",
  mtor: "metabolic_stability",
  glutaminolysis: "metabolic_stability",
  glutamine_transport: "metabolic_stability",
  glutaminase: "metabolic_stability",
  gls: "metabolic_stability",
  asct2: "metabolic_stability",
  gdh_kgdh: "metabolic_stability",
  autophagy_nucleoside_salvage: "metabolic_stability",
  macropinocytosis: "metabolic_stability",
  nucleoside_salvage: "metabolic_stability",
  gln_oxphos: "metabolic_stability",
  srebp1: "metabolic_stability",
  srebp2: "metabolic_stability",
  acly: "metabolic_stability",
  fas: "metabolic_stability",
  fasn: "metabolic_stability",
  mevalonate: "metabolic_stability",
  hmgcr: "metabolic_stability",
  fao: "metabolic_stability",
  cpt1: "metabolic_stability",
  ldlr: "metabolic_stability",
  acss2: "metabolic_stability",
  "acetate-srebp-1": "metabolic_stability",
  "mevalonate-srebp-2": "metabolic_stability",

  // 면역 균형 (immune_balance)
  il1: "immune_balance",
  il6: "immune_balance",
  cox: "immune_balance",
  pge2: "immune_balance",
  tgfb: "immune_balance",
  tlr4: "immune_balance",
  tlr9: "immune_balance",
  il10: "immune_balance",
  ido: "immune_balance",
  ido1: "immune_balance",
  ifng: "immune_balance",
  il2: "immune_balance",
  ccr5: "immune_balance",
  pd1: "immune_balance",
  pdl1: "immune_balance",
  ctla4: "immune_balance",
  ox40: "immune_balance",
  treg: "immune_balance",
  mdsc: "immune_balance",
  tams: "immune_balance",
  m2_macrophage: "immune_balance",
  sting: "immune_balance",
  nk_cells: "immune_balance",
  th1: "immune_balance",
  th2: "immune_balance",
  microbiome: "immune_balance",
  gut_microbiome: "immune_balance",
  acidic_tumor_microenvironment: "immune_balance",
  cox2: "immune_balance",
  arginase: "immune_balance",
  complement_c4_function: "immune_balance",
  neutrophil_function: "immune_balance",

  // 비정상 신호조절 (abnormal_signals)
  hedgehog: "abnormal_signals",
  wnt_beta_catenin: "abnormal_signals",
  notch: "abnormal_signals",
  stat3: "abnormal_signals",
  nfkb: "abnormal_signals",
  ras: "abnormal_signals",
  akt: "abnormal_signals",
  cmyc: "abnormal_signals",
  cyclin_d1: "abnormal_signals",
  mir_34a: "abnormal_signals",
  integrins: "abnormal_signals",
  estrogen_receptor: "abnormal_signals",
  egfr: "abnormal_signals",
  her2: "abnormal_signals",
  jak2: "abnormal_signals",
  pi3k: "abnormal_signals",
  beta_catenin: "abnormal_signals",
  sonic_hedgehog: "abnormal_signals",
  bfgf: "abnormal_signals",
  fgf: "abnormal_signals",
  fgfr: "abnormal_signals",
  emt: "abnormal_signals",
  angiogenesis: "abnormal_signals",
  progesterone_receptor: "abnormal_signals",
  androgen_receptor: "abnormal_signals",
  mmp2: "abnormal_signals",
  mmp3: "abnormal_signals",
  mmp9: "abnormal_signals",
  vegf: "abnormal_signals",
  pdgf: "abnormal_signals",
  hif: "abnormal_signals",

  // 신경·스트레스 (neuro_stress)
  beta_adrenergic_receptor: "neuro_stress",
  beta2_adrenergic_receptor: "neuro_stress",
  epinephrine: "neuro_stress",
  norepinephrine: "neuro_stress",
  cortisol: "neuro_stress",
  glucocorticoid_receptor: "neuro_stress",
  hpa_axis: "neuro_stress",
  autonomic_nervous_system: "neuro_stress",
  sympathetic_tone: "neuro_stress",
  parasympathetic_tone: "neuro_stress",
  hrv: "neuro_stress",
  circadian_rhythm: "neuro_stress",
  melatonin: "neuro_stress",

  // 회복증진 (recovery)
  ros: "recovery",
  glutathione: "recovery",
  caspases: "recovery",
  bcl2_bax: "recovery",
  fas_receptor: "recovery",
  caspase3: "recovery",
  dnmt: "recovery",
  dnmt1: "recovery",
  dnmt3a: "recovery",
  dnmt3b: "recovery",
  tet: "recovery",
  hdac: "recovery",
  hats: "recovery",
  histone_acetylation: "recovery",
  dna_methylation: "recovery",
  mitochondria: "recovery",
  mitochondrial_function: "recovery",
  redox: "recovery",
  nrf2: "recovery",
  thioredoxin: "recovery",
  gpx: "recovery",
  catalase: "recovery",
  sod: "recovery",
  nadph: "recovery",
  oxidative_stress: "recovery",
  cytochrome_c: "recovery",
  bax: "recovery",
  bad: "recovery",
  bak: "recovery",
  bclxl: "recovery",
  apoptosis: "recovery",
  caspase8: "recovery",
  caspase9: "recovery",
  p53: "recovery",
  ascorbate_recycling: "recovery",
} as const;

/**
 * 논문 strength 기본값 (study_type별)
 */
export const STUDY_TYPE_STRENGTH: Record<
  | "systematic_review"
  | "rct"
  | "human_observational"
  | "case_report"
  | "animal"
  | "cell"
  | "mechanistic",
  number
> = {
  systematic_review: 1.0, // Systematic review / Meta-analysis
  rct: 0.95, // RCT (인간)
  human_observational: 0.85, // Human observational / clinical
  case_report: 0.6, // Case report
  animal: 0.7, // Animal in vivo
  cell: 0.45, // Cell line / in vitro
  mechanistic: 0.3, // Mechanistic only / hypothesis
};

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
