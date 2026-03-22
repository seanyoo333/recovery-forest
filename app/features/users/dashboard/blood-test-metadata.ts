/**
 * 혈액검사 타입(blood_test_types) 메타데이터 — DB JSON·상수·UI에서 공통 사용
 */

export type BloodTestDescription = {
  description: string | null;
  significance: {
    up: string[];
    down: string[];
  };
  interpretation_cautions: string[];
};

export type StandardBloodTestType = {
  standard_name: string;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
  /** reference_min/max는 기본 참고범위일 뿐 절대 기준이 아님을 안내 */
  reference_note: string | null;
  clinical_significance: string | null;
  descriptions: BloodTestDescription;
  is_derived_metric: boolean;
  derived_formula: string | null;
  /** evidence_sources.id (uuid 문자열) */
  evidence_source_ids: string[];
};

export function emptyBloodTestDescription(): BloodTestDescription {
  return {
    description: null,
    significance: { up: [], down: [] },
    interpretation_cautions: [],
  };
}

/** DB/상수에서 온 부분 descriptions를 전체 구조로 병합 */
export function mergeBloodTestDescriptions(
  partial?: Partial<BloodTestDescription> | null,
): BloodTestDescription {
  const base = emptyBloodTestDescription();
  if (!partial) return base;
  return {
    description: partial.description ?? base.description,
    significance: {
      up: partial.significance?.up ?? base.significance.up,
      down: partial.significance?.down ?? base.significance.down,
    },
    interpretation_cautions:
      partial.interpretation_cautions ?? base.interpretation_cautions,
  };
}

/** VIEW의 type_descriptions JSON → 정규화 */
export function normalizeBloodTestDescriptions(
  raw: unknown,
): BloodTestDescription {
  if (!raw || typeof raw !== "object") {
    return emptyBloodTestDescription();
  }
  const o = raw as Record<string, unknown>;
  const sig =
    o.significance && typeof o.significance === "object"
      ? (o.significance as Record<string, unknown>)
      : {};
  const up = Array.isArray(sig.up) ? sig.up.map(String) : [];
  const down = Array.isArray(sig.down) ? sig.down.map(String) : [];
  const cautions = Array.isArray(o.interpretation_cautions)
    ? o.interpretation_cautions.map(String)
    : [];
  return {
    description: typeof o.description === "string" ? o.description : null,
    significance: { up, down },
    interpretation_cautions: cautions,
  };
}

export function hasBloodTestTooltipContent(input: {
  clinicalSignificance: string | null;
  referenceNote: string | null;
  descriptions: BloodTestDescription | null;
  isDerivedMetric: boolean;
  derivedFormula: string | null;
  evidenceSourceIds: string[];
}): boolean {
  const d = input.descriptions;
  const hasDesc =
    d &&
    (!!d.description?.trim() ||
      d.significance.up.length > 0 ||
      d.significance.down.length > 0 ||
      d.interpretation_cautions.length > 0);
  return !!(
    input.clinicalSignificance?.trim() ||
    input.referenceNote?.trim() ||
    hasDesc ||
    (input.isDerivedMetric && !!input.derivedFormula?.trim()) ||
    input.evidenceSourceIds.length > 0
  );
}

/** STANDARD_BLOOD_TEST_TYPES 항목 생성용 */
export function standardBloodTestType(
  row: Pick<StandardBloodTestType, "standard_name" | "unit"> &
    Partial<
      Omit<StandardBloodTestType, "standard_name" | "unit" | "descriptions">
    > & {
      descriptions?: Partial<BloodTestDescription> | null;
    },
): StandardBloodTestType {
  return {
    reference_min: null,
    reference_max: null,
    reference_note: null,
    clinical_significance: null,
    is_derived_metric: false,
    derived_formula: null,
    evidence_source_ids: [],
    ...row,
    descriptions: mergeBloodTestDescriptions(row.descriptions),
  };
}
