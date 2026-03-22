import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import type {
  Category,
  RoutineDailyGridLog,
  RoutineGridOption,
  RoutineTemplate,
  SectionTemplate,
} from "./types";

import {
  type BloodTestDescription,
  normalizeBloodTestDescriptions,
} from "./blood-test-metadata";

import { normalizeStandardName } from "./constants";

export type { BloodTestDescription } from "./blood-test-metadata";

export type MedicalRecordTranscriptEntry = {
  test_date: string;
  test_content: string;
  clinical_information: string;
  finding: string;
  conclusion: string;
};

export type PatientHealthProfile = {
  age: number;
  gender: "M" | "F";
  disease: string;
  disease_status: string | null;
  treatment_status: "ongoing" | "completed" | "follow_up";
  medication_status: "none" | "active";
  medication_name: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  medical_record_transcripts?: MedicalRecordTranscriptEntry[] | null;
};

export type BloodTestChartPoint = {
  date: string;
  [metric: string]: string | number;
};

export type BloodTestSummary = {
  metric: string;
  label: string;
  value: number | null;
  unit: string;
  testDate: string;
  clinicalSignificance: string | null;
  referenceMin: number | null;
  referenceMax: number | null;
  /** 기본 참고범위에 대한 주의(성별·연령·기관별 차이 등) */
  referenceNote: string | null;
  isDerivedMetric: boolean;
  derivedFormula: string | null;
  evidenceSourceIds: string[];
  descriptions: BloodTestDescription;
};

export type BloodTestOverview = {
  chartData: BloodTestChartPoint[];
  availableMetrics: string[];
  latestSummary: BloodTestSummary[];
  lastTestDate: string | null;
  referenceRanges: Record<string, { min: number | null; max: number | null }>;
  summariesByDate: Record<string, BloodTestSummary[]>;
  availableDates: string[];
};

// 종양표지자 타입 정의
export const TUMOR_MARKER_TYPES = {
  cea: { label: "CEA", standardName: "tumor_marker_cea", unit: "ng/mL" },
  ca199: { label: "CA19-9", standardName: "tumor_marker_ca199", unit: "U/mL" },
  ca125: { label: "CA125", standardName: "tumor_marker_ca125", unit: "U/mL" },
  ca153: { label: "CA15-3", standardName: "tumor_marker_ca153", unit: "U/mL" },
  psa: { label: "PSA", standardName: "tumor_marker_psa", unit: "ng/mL" },
  afp: { label: "AFP", standardName: "tumor_marker_afp", unit: "ng/mL" },
  ca724: { label: "CA72-4", standardName: "tumor_marker_ca724", unit: "U/mL" },
  nse: { label: "NSE", standardName: "tumor_marker_nse", unit: "ng/mL" },
  scc: { label: "SCC", standardName: "tumor_marker_scc", unit: "ng/mL" },
} as const;

export const METRIC_DEFINITIONS = {
  tumor_marker_cea: {
    label: "CEA (종양 표지자)",
    color: "hsl(0, 72%, 51%)",
    unit: "ng/mL",
  },
  tumor_marker_ca199: {
    label: "CA19-9 (종양 표지자)",
    color: "hsl(24, 95%, 53%)",
    unit: "U/mL",
  },
  tumor_marker_ca125: {
    label: "CA125 (종양 표지자)",
    color: "hsl(46, 97%, 45%)",
    unit: "U/mL",
  },
  tumor_marker_ca153: {
    label: "CA15-3 (종양 표지자)",
    color: "hsl(142, 76%, 36%)",
    unit: "U/mL",
  },
  tumor_marker_psa: {
    label: "PSA (종양 표지자)",
    color: "hsl(199, 89%, 48%)",
    unit: "ng/mL",
  },
  tumor_marker_afp: {
    label: "AFP (종양 표지자)",
    color: "hsl(262, 83%, 58%)",
    unit: "ng/mL",
  },
  tumor_marker_ca724: {
    label: "CA72-4 (종양 표지자)",
    color: "hsl(291, 64%, 42%)",
    unit: "U/mL",
  },
  tumor_marker_nse: {
    label: "NSE (종양 표지자)",
    color: "hsl(340, 75%, 55%)",
    unit: "ng/mL",
  },
  tumor_marker_scc: {
    label: "SCC (종양 표지자)",
    color: "hsl(15, 100%, 50%)",
    unit: "ng/mL",
  },
  lmr: {
    label: "림프구 대비 단핵구 비율",
    color: "hsl(199, 89%, 48%)",
    unit: "",
  },
  nlr: {
    label: "호중구 대비 림프구 비율",
    color: "hsl(142, 76%, 36%)",
    unit: "",
  },
  glucose: { label: "혈당", color: "hsl(24, 95%, 53%)", unit: "mg/dL" },
  hgba1c: { label: "당화혈색소", color: "hsl(340, 75%, 55%)", unit: "%" },
  ldh: { label: "젖산탈수소효소", color: "hsl(262, 83%, 58%)", unit: "U/L" },
  crp: { label: "C 반응성 단백질", color: "hsl(191, 94%, 29%)", unit: "mg/dL" },
  vitamin_d3: {
    label: "Vitamin D3",
    color: "hsl(84, 81%, 44%)",
    unit: "ng/mL",
  },
  platelet: { label: "혈소판", color: "hsl(224, 76%, 48%)", unit: "10³/µL" },
  ast: {
    label: "아스파르테이트 아미노전달효소",
    color: "hsl(15, 100%, 50%)",
    unit: "U/L",
  },
  alt: {
    label: "알라닌 아미노전달달효소",
    color: "hsl(286, 72%, 45%)",
    unit: "U/L",
  },
  egfr: {
    label: "추정 사구체 여과율",
    color: "hsl(46, 97%, 45%)",
    unit: "mL/min/1.73㎡",
  },
} as const;

// 표시 순서 정의 (종양표지자는 동적으로 추가됨)
export const METRIC_DISPLAY_ORDER: Array<keyof typeof METRIC_DEFINITIONS> = [
  "lmr",
  "nlr",
  "glucose",
  "hgba1c",
  "ldh",
  "crp",
  "vitamin_d3",
  "platelet",
  "ast",
  "alt",
  "egfr",
];

export const PRIMARY_METRICS: Array<keyof typeof METRIC_DEFINITIONS> = [
  "glucose",
  "hgba1c",
  "crp",
];

type SupabaseClientType = SupabaseClient<Database>;

export async function getPatientHealthProfile(
  client: SupabaseClientType,
  userId: string,
): Promise<PatientHealthProfile | null> {
  // medical_record_transcripts 컬럼은 마이그레이션 0105에서 추가됨
  // 마이그레이션 미적용 시에도 기본 프로필 로드가 되도록 fallback
  const columnsWithMedical = `age, gender, disease, disease_status, treatment_status, medication_status, medication_name, height_cm, weight_kg, medical_record_transcripts`;
  const columnsBase = `age, gender, disease, disease_status, treatment_status, medication_status, medication_name, height_cm, weight_kg`;

  const { data, error } = await client
    .from("patient_health_profiles")
    .select(columnsWithMedical)
    .eq("patient_id", userId)
    .maybeSingle();

  if (error) {
    const isMissingColumn =
      typeof error.message === "string" &&
      (error.message.includes("medical_record_transcripts") ||
        error.message.includes("does not exist"));
    if (isMissingColumn) {
      const { data: fallbackData, error: fallbackError } = await client
        .from("patient_health_profiles")
        .select(columnsBase)
        .eq("patient_id", userId)
        .maybeSingle();
      if (fallbackError) throw fallbackError;
      return fallbackData as PatientHealthProfile | null;
    }
    throw error;
  }

  return data as PatientHealthProfile | null;
}

type RawBloodTestResult =
  Database["public"]["Tables"]["blood_test_results"]["Row"] & {
    blood_test_types:
      | Array<{
          standard_name: string;
          unit: string | null;
          clinical_significance: string | null;
          reference_min: number | null;
          reference_max: number | null;
        }>
      | {
          standard_name: string;
          unit: string | null;
          clinical_significance: string | null;
          reference_min: number | null;
          reference_max: number | null;
        }
      | null;
  };

export async function getBloodTestOverview(
  client: SupabaseClientType,
  userId: string,
): Promise<BloodTestOverview> {
  // VIEW를 사용하여 중복 제거된 결과를 직접 조회
  // Note: VIEW 타입이 database.types.ts에 추가되면 타입 단언 제거 가능
  const { data, error } = await (client as any)
    .from("blood_test_results_summary_view")
    .select("*")
    .eq("patient_id", userId)
    .order("test_date", { ascending: true });

  if (error) {
    throw error;
  }

  // VIEW에서 이미 중복 제거가 되어 있으므로, 데이터 변환만 수행
  const parsedResults =
    (data as any[])?.flatMap((item: any) => {
      if (!item.standard_name) {
        return [];
      }
      // standard_name을 소문자로 정규화
      const metricKey = normalizeStandardName(
        item.standard_name,
      ) as keyof typeof METRIC_DEFINITIONS;
      const isTumorMarker = metricKey.startsWith("tumor_marker_");
      if (isTumorMarker || metricKey in METRIC_DEFINITIONS) {
        const definition = isTumorMarker
          ? METRIC_DEFINITIONS[metricKey]
          : METRIC_DEFINITIONS[metricKey];
        if (!definition) {
          return [];
        }
        const unit =
          item.result_unit ?? item.type_unit ?? definition?.unit ?? null;
        const evidenceRaw = item.type_evidence_source_ids;
        const evidenceSourceIds = Array.isArray(evidenceRaw)
          ? evidenceRaw.map(String)
          : [];
        return [
          {
            test_date: item.test_date,
            metricKey,
            value: item.result_value,
            unit,
            clinical_significance: item.clinical_significance ?? null,
            reference_min: item.reference_min ?? null,
            reference_max: item.reference_max ?? null,
            reference_note: item.type_reference_note ?? null,
            is_derived_metric: Boolean(item.type_is_derived_metric),
            derived_formula: item.type_derived_formula ?? null,
            evidence_source_ids: evidenceSourceIds,
            descriptions: normalizeBloodTestDescriptions(item.type_descriptions),
          },
        ];
      }
      return [];
    }) ?? [];

  const deduplicatedResults = parsedResults;

  const metricsByDate = new Map<
    string,
    Record<string, { value: number; unit: string | null }>
  >();

  const latestValues = new Map<
    string,
    {
      value: number;
      unit: string | null;
      test_date: string;
      clinical_significance: string | null;
      reference_min: number | null;
      reference_max: number | null;
      reference_note: string | null;
      is_derived_metric: boolean;
      derived_formula: string | null;
      evidence_source_ids: string[];
      descriptions: BloodTestDescription;
    }
  >();

  deduplicatedResults.forEach((result) => {
    const metricKey = result.metricKey;
    const dateKey = result.test_date;
    if (!metricsByDate.has(dateKey)) {
      metricsByDate.set(dateKey, {});
    }

    metricsByDate.get(dateKey)![metricKey] = {
      value: result.value,
      unit: result.unit,
    };

    const existing = latestValues.get(metricKey);
    if (!existing || existing.test_date <= dateKey) {
      latestValues.set(metricKey, {
        value: result.value,
        unit: result.unit,
        test_date: dateKey,
        clinical_significance: result.clinical_significance ?? null,
        reference_min: result.reference_min ?? null,
        reference_max: result.reference_max ?? null,
        reference_note: result.reference_note ?? null,
        is_derived_metric: result.is_derived_metric,
        derived_formula: result.derived_formula ?? null,
        evidence_source_ids: result.evidence_source_ids,
        descriptions: result.descriptions,
      });
    }
  });

  let chartData: BloodTestChartPoint[] = Array.from(metricsByDate.entries())
    .map(([date, values]) => ({
      date,
      ...Object.fromEntries(
        Object.entries(values).map(([metric, value]) => [metric, value.value]),
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 누락된 값 보간: 앞뒤 값이 있으면 평균값으로 채우기
  const allDates = chartData.map((point) => point.date);
  const availableMetrics = new Set<string>();
  chartData.forEach((entry) => {
    Object.keys(entry).forEach((key) => {
      if (key !== "date") {
        availableMetrics.add(key);
      }
    });
  });

  // 각 metric에 대해 누락된 값 보간
  chartData = chartData.map((point) => {
    const interpolatedPoint: BloodTestChartPoint = { ...point };
    availableMetrics.forEach((metric) => {
      const currentValue = point[metric];
      // 값이 없거나 undefined인 경우 보간 시도
      if (currentValue === undefined || currentValue === null) {
        const currentIndex = allDates.indexOf(point.date);
        // 앞쪽에서 가장 가까운 값 찾기
        let prevValue: number | null = null;
        for (let i = currentIndex - 1; i >= 0; i--) {
          const prevPoint = chartData[i];
          const prevMetricValue = prevPoint[metric];
          if (prevMetricValue !== undefined && prevMetricValue !== null) {
            prevValue =
              typeof prevMetricValue === "number"
                ? prevMetricValue
                : Number(prevMetricValue);
            break;
          }
        }
        // 뒤쪽에서 가장 가까운 값 찾기
        let nextValue: number | null = null;
        for (let i = currentIndex + 1; i < chartData.length; i++) {
          const nextPoint = chartData[i];
          const nextMetricValue = nextPoint[metric];
          if (nextMetricValue !== undefined && nextMetricValue !== null) {
            nextValue =
              typeof nextMetricValue === "number"
                ? nextMetricValue
                : Number(nextMetricValue);
            break;
          }
        }
        // 앞뒤 값이 모두 있으면 평균값으로 보간
        if (prevValue !== null && nextValue !== null) {
          interpolatedPoint[metric] = (prevValue + nextValue) / 2;
        }
      }
    });
    return interpolatedPoint;
  });

  const lastTestDate = chartData.at(-1)?.date ?? null;

  // 종양표지자들을 먼저 수집하고 정렬
  const tumorMarkers = Array.from(latestValues.keys())
    .filter((key) => key.startsWith("tumor_marker_"))
    .sort();

  // 최신 요약 생성: 종양표지자 먼저, 그 다음 METRIC_DISPLAY_ORDER
  const latestSummary: BloodTestSummary[] = [];

  // 종양표지자 추가
  tumorMarkers.forEach((metric) => {
    const summary = latestValues.get(metric);
    if (summary) {
      latestSummary.push({
        metric,
        value: summary.value,
        unit:
          summary.unit ??
          METRIC_DEFINITIONS[metric as keyof typeof METRIC_DEFINITIONS]?.unit ??
          "",
        label:
          METRIC_DEFINITIONS[metric as keyof typeof METRIC_DEFINITIONS]
            ?.label ?? metric,
        testDate: summary.test_date,
        clinicalSignificance: summary.clinical_significance,
        referenceMin: summary.reference_min,
        referenceMax: summary.reference_max,
        referenceNote: summary.reference_note,
        isDerivedMetric: summary.is_derived_metric,
        derivedFormula: summary.derived_formula,
        evidenceSourceIds: summary.evidence_source_ids,
        descriptions: summary.descriptions,
      });
    }
  });

  // 나머지 메트릭 추가
  METRIC_DISPLAY_ORDER.forEach((metric) => {
    const summary = latestValues.get(metric);
    if (summary) {
      latestSummary.push({
        metric,
        value: summary.value,
        unit: summary.unit ?? METRIC_DEFINITIONS[metric]?.unit ?? "",
        label: METRIC_DEFINITIONS[metric]?.label ?? metric,
        testDate: summary.test_date,
        clinicalSignificance: summary.clinical_significance,
        referenceMin: summary.reference_min,
        referenceMax: summary.reference_max,
        referenceNote: summary.reference_note,
        isDerivedMetric: summary.is_derived_metric,
        derivedFormula: summary.derived_formula,
        evidenceSourceIds: summary.evidence_source_ids,
        descriptions: summary.descriptions,
      });
    }
  });

  // reference 범위 정보를 metric별로 수집
  const referenceRanges: Record<
    string,
    { min: number | null; max: number | null }
  > = {};
  Array.from(latestValues.entries()).forEach(([metric, summary]) => {
    referenceRanges[metric] = {
      min: summary.reference_min,
      max: summary.reference_max,
    };
  });

  // 날짜별 summary 생성 (모든 가능한 metric 포함)
  const summariesByDate: Record<string, BloodTestSummary[]> = {};
  const availableDatesSet = new Set<string>();

  deduplicatedResults.forEach((result) => {
    const dateKey = result.test_date;
    availableDatesSet.add(dateKey);
  });

  // 각 날짜에 대해 모든 metric을 포함한 summary 생성
  // 종양표지자 먼저, 그 다음 METRIC_DISPLAY_ORDER
  availableDatesSet.forEach((dateKey) => {
    const dateSummary: BloodTestSummary[] = [];

    // 해당 날짜의 종양표지자 수집
    const dateTumorMarkers = deduplicatedResults
      .filter(
        (r) =>
          r.test_date === dateKey && r.metricKey.startsWith("tumor_marker_"),
      )
      .map((r) => r.metricKey)
      .filter((key, index, self) => self.indexOf(key) === index) // 중복 제거
      .sort();

    // 종양표지자 추가
    dateTumorMarkers.forEach((metricKey) => {
      const result = deduplicatedResults.find(
        (r) => r.test_date === dateKey && r.metricKey === metricKey,
      );
      const definition =
        METRIC_DEFINITIONS[metricKey as keyof typeof METRIC_DEFINITIONS];

      if (result) {
        dateSummary.push({
          metric: metricKey,
          value: result.value,
          unit: result.unit ?? definition?.unit ?? "",
          label: definition?.label ?? metricKey,
          testDate: dateKey,
          clinicalSignificance: result.clinical_significance,
          referenceMin: result.reference_min,
          referenceMax: result.reference_max,
          referenceNote: result.reference_note,
          isDerivedMetric: result.is_derived_metric,
          derivedFormula: result.derived_formula,
          evidenceSourceIds: result.evidence_source_ids,
          descriptions: result.descriptions,
        });
      }
    });

    // METRIC_DISPLAY_ORDER 순서대로 추가
    METRIC_DISPLAY_ORDER.forEach((metricKey) => {
      const result = deduplicatedResults.find(
        (r) => r.test_date === dateKey && r.metricKey === metricKey,
      );
      const definition = METRIC_DEFINITIONS[metricKey];

      if (result) {
        dateSummary.push({
          metric: metricKey,
          value: result.value,
          unit: result.unit ?? definition?.unit ?? "",
          label: definition?.label ?? metricKey,
          testDate: dateKey,
          clinicalSignificance: result.clinical_significance,
          referenceMin: result.reference_min,
          referenceMax: result.reference_max,
          referenceNote: result.reference_note,
          isDerivedMetric: result.is_derived_metric,
          derivedFormula: result.derived_formula,
          evidenceSourceIds: result.evidence_source_ids,
          descriptions: result.descriptions,
        });
      } else {
        // 값이 없는 경우, latestValues에서 reference 정보 가져오기
        const latestValue = latestValues.get(metricKey);
        dateSummary.push({
          metric: metricKey,
          value: null, // 값이 없음을 나타냄
          unit: definition?.unit ?? "",
          label: definition?.label ?? metricKey,
          testDate: dateKey,
          clinicalSignificance: latestValue?.clinical_significance ?? null,
          referenceMin: latestValue?.reference_min ?? null,
          referenceMax: latestValue?.reference_max ?? null,
          referenceNote: latestValue?.reference_note ?? null,
          isDerivedMetric: latestValue?.is_derived_metric ?? false,
          derivedFormula: latestValue?.derived_formula ?? null,
          evidenceSourceIds: latestValue?.evidence_source_ids ?? [],
          descriptions:
            latestValue?.descriptions ??
            normalizeBloodTestDescriptions(null),
        });
      }
    });

    summariesByDate[dateKey] = dateSummary;
  });

  const availableDates = Array.from(availableDatesSet).sort((a, b) =>
    b.localeCompare(a),
  );

  return {
    chartData,
    availableMetrics: Array.from(availableMetrics),
    latestSummary,
    lastTestDate,
    referenceRanges,
    summariesByDate,
    availableDates,
  };
}

export const getBloodTestImageByHash = async (
  client: SupabaseClientType,
  {
    patientId,
    imageHash,
  }: {
    patientId: string;
    imageHash: string;
  },
) => {
  const { data, error } = await client
    .from("blood_test_images")
    .select("image_id, test_date")
    .eq("patient_id", patientId)
    .eq("image_hash", imageHash)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

type BloodTestResultWithType = {
  result_value: number;
  result_unit: string | null;
  test_date: string;
  blood_test_types: {
    standard_name: string;
  } | null;
};

export const getBloodTestResultsByImageId = async (
  client: SupabaseClientType,
  {
    patientId,
    imageId,
  }: {
    patientId: string;
    imageId: number;
  },
) => {
  const { data, error } = await client
    .from("blood_test_results")
    .select(
      `
      result_value,
      result_unit,
      test_date,
      blood_test_types!inner(standard_name)
    `,
    )
    .eq("patient_id", patientId)
    .eq("image_id", imageId)
    .order("test_date", { ascending: false });

  if (error) {
    throw error;
  }

  return data as BloodTestResultWithType[] | null;
};

export const getBloodTestTypesByStandardNames = async (
  client: SupabaseClientType,
  {
    standardNames,
  }: {
    standardNames: string[];
  },
) => {
  // standard_name을 소문자로 정규화하여 조회
  const normalizedNames = standardNames.map((name) =>
    normalizeStandardName(name),
  );

  const { data, error } = await client
    .from("blood_test_types")
    .select("test_id, standard_name")
    .in("standard_name", normalizedNames);

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 루틴 그리드 옵션 조회
 */
export async function getRoutineGridOptions(
  client: SupabaseClient<Database>,
  userId: string,
  category?: Category,
) {
  let query = client
    .from("routine_grid_options")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RoutineGridOption[];
}

// 하위 호환성을 위한 별칭
export const getGridOptions = getRoutineGridOptions;

/**
 * 루틴 일일 그리드 로그 조회
 */
export async function getRoutineDailyGridLogs(
  client: SupabaseClient<Database>,
  userId: string,
  logDate: string,
) {
  const { data, error } = await client
    .from("routine_daily_grid_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", logDate);

  if (error) throw error;
  return (data ?? []) as RoutineDailyGridLog[];
}

// 하위 호환성을 위한 별칭
export const getDailyGridLogs = getRoutineDailyGridLogs;

/**
 * 기간별 일일 그리드 로그 조회
 */
export async function getRoutineDailyGridLogsByDateRange(
  client: SupabaseClient<Database>,
  userId: string,
  startDate: string,
  endDate: string,
) {
  const { data, error } = await client
    .from("routine_daily_grid_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as RoutineDailyGridLog[];
}

// 하위 호환성을 위한 별칭
export const getDailyGridLogsByDateRange = getRoutineDailyGridLogsByDateRange;

/**
 * 루틴 템플릿 조회 (아이템 포함)
 */
export async function getRoutineTemplates(
  client: SupabaseClient<Database>,
  userId: string,
  sectionType?: Category,
) {
  let query = client
    .from("routine_templates")
    .select(
      `
      *,
      routine_items (*)
    `,
    )
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (sectionType) {
    query = query.eq("section_type", sectionType);
  }

  const { data, error } = await query;
  if (error) throw error;

  // routine_items를 배열로 변환
  return (data ?? []).map((template: any) => ({
    ...template,
    items: (template.routine_items ?? []) as RoutineTemplate["items"],
  })) as RoutineTemplate[];
}

// 하위 호환성을 위한 별칭
export const getSectionTemplates = getRoutineTemplates;

/**
 * 사용자 입력 label을 정규화하여 매칭에 사용
 */
function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\d+/g, "") // 숫자 제거
    .replace(/\s*(mg|g|ml|mcg|iu|%|mg\/g|mg\/ml|g\/ml)\s*/gi, "") // 단위 제거
    .replace(/[()\[\]{}]/g, "") // 특수문자 제거
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 두 문자열의 유사도 계산
 */
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeLabel(str1);
  const normalized2 = normalizeLabel(str2);

  // 정확한 매칭
  if (normalized1 === normalized2) return 1.0;

  // 한쪽이 다른 쪽을 포함하는 경우
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const longer = Math.max(normalized1.length, normalized2.length);
    const shorter = Math.min(normalized1.length, normalized2.length);
    return longer > 0 ? shorter / longer : 0;
  }

  // 공통 단어 개수 기반 유사도
  const words1 = normalized1.split(/\s+/).filter((w) => w.length > 1);
  const words2 = normalized2.split(/\s+/).filter((w) => w.length > 1);

  if (words1.length === 0 || words2.length === 0) return 0;

  const commonWords = words1.filter((w) => words2.includes(w));
  return commonWords.length / Math.max(words1.length, words2.length);
}

/**
 * routine_items.label을 natural_ingredients와 매칭
 */
async function matchLabelToIngredient(
  client: SupabaseClient<Database>,
  label: string,
): Promise<string | null> {
  const { data: ingredients, error } = await client
    .from("natural_ingredients")
    .select("id, display_name, slug, synonyms");

  if (error || !ingredients) {
    console.error(`[매칭] natural_ingredients 조회 실패:`, error);
    return null;
  }

  const normalizedLabel = normalizeLabel(label);
  let bestMatch: { id: string; score: number; matchType: string } | null =
    null;

  for (const ingredient of ingredients) {
    // display_name 정확한 매칭
    const displayNameNorm = normalizeLabel(ingredient.display_name || "");
    if (displayNameNorm === normalizedLabel) {
      return ingredient.id;
    }

    // display_name 부분 매칭
    const displayNameScore = calculateSimilarity(
      label,
      ingredient.display_name || "",
    );
    if (
      displayNameScore > 0.7 &&
      (!bestMatch || displayNameScore > bestMatch.score)
    ) {
      bestMatch = {
        id: ingredient.id,
        score: displayNameScore,
        matchType: "display_name",
      };
    }

    // slug 매칭
    const slugNorm = normalizeLabel(ingredient.slug || "");
    if (slugNorm === normalizedLabel) {
      return ingredient.id;
    }
    const slugScore = calculateSimilarity(label, ingredient.slug || "");
    if (slugScore > 0.7 && (!bestMatch || slugScore > bestMatch.score)) {
      bestMatch = { id: ingredient.id, score: slugScore, matchType: "slug" };
    }

    // synonyms 매칭
    if (ingredient.synonyms && Array.isArray(ingredient.synonyms)) {
      for (const synonym of ingredient.synonyms) {
        if (!synonym) continue;

        const synonymNorm = normalizeLabel(synonym);
        if (synonymNorm === normalizedLabel) {
          return ingredient.id;
        }

        const synonymScore = calculateSimilarity(label, synonym);
        if (
          synonymScore > 0.7 &&
          (!bestMatch || synonymScore > bestMatch.score)
        ) {
          bestMatch = {
            id: ingredient.id,
            score: synonymScore,
            matchType: "synonym",
          };
        }
      }
    }
  }

  // 최고 점수가 0.7 이상이면 매칭 성공
  if (bestMatch && bestMatch.score >= 0.7) {
    return bestMatch.id;
  }

  return null;
}

/**
 * 오늘 복용한 천연물의 표적-메타축 매핑 데이터 조회
 * dose_count (하루 복용 이벤트 수) 포함
 */
export async function getTodayIngredientEvidence(
  client: SupabaseClient<Database>,
  userId: string,
  logDate: string,
) {
  // 오늘 복용한 보조제 기록 (template_id와 time_block 포함)
  const { data: todayLogs, error: logsError } = await client
    .from("routine_daily_grid_logs")
    .select("template_id, time_block")
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .eq("category", "supplement")
    .not("template_id", "is", null);

  if (logsError) {
    throw logsError;
  }

  if (!todayLogs || todayLogs.length === 0) {
    return [];
  }

  const templateIds = todayLogs
    .map((log) => log.template_id)
    .filter((id): id is string => id !== null);

  if (templateIds.length === 0) {
    return [];
  }

  // 템플릿의 아이템들 조회 (label 포함, ingredient_id 필터 제거)
  const { data: routineItems, error: itemsError } = await client
    .from("routine_items")
    .select("id, ingredient_id, template_id, label")
    .in("template_id", templateIds);

  if (itemsError) {
    throw itemsError;
  }

  if (!routineItems || routineItems.length === 0) {
    return [];
  }

  // ingredient_id가 없는 항목들을 label로 매칭
  const labelToIngredientId = new Map<string, string>();
  const itemsNeedingMatch = routineItems.filter((item) => !item.ingredient_id);

  if (itemsNeedingMatch.length > 0) {
    // 각 label을 natural_ingredients와 매칭
    for (const item of itemsNeedingMatch) {
      const matchedId = await matchLabelToIngredient(client, item.label);
      if (matchedId) {
        labelToIngredientId.set(item.label, matchedId);
      }
    }
  }

  // ingredient별로 dose_count 계산 (아침/점심/저녁/자기전 중 실제 등장 횟수)
  const ingredientDoseCount = new Map<string, number>();

  for (const item of routineItems) {
    // ingredient_id가 있으면 사용, 없으면 매칭 결과 사용
    const ingredientId =
      item.ingredient_id || labelToIngredientId.get(item.label);

    if (!ingredientId) {
      continue;
    }

    // 이 ingredient가 포함된 template들이 오늘 몇 번 복용되었는지 계산
    const templateIdsWithIngredient = routineItems
      .filter((ri) => {
        const riIngredientId =
          ri.ingredient_id || labelToIngredientId.get(ri.label);
        return riIngredientId === ingredientId;
      })
      .map((ri) => ri.template_id);

    const timeBlocks = new Set<string>();
    todayLogs.forEach((log) => {
      if (
        log.template_id &&
        templateIdsWithIngredient.includes(log.template_id)
      ) {
        if (log.time_block) {
          timeBlocks.add(log.time_block);
        }
      }
    });

    const currentCount = ingredientDoseCount.get(ingredientId) ?? 0;
    ingredientDoseCount.set(
      ingredientId,
      Math.max(currentCount, timeBlocks.size),
    );
  }

  const ingredientIds = Array.from(ingredientDoseCount.keys());

  if (ingredientIds.length === 0) {
    return [];
  }

  // VIEW를 사용하여 성분 → 표적 → 메타축 조인 쿼리 단순화
  // Note: VIEW 타입이 database.types.ts에 추가되면 타입 단언 제거 가능
  const { data, error } = await (client as any)
    .from("ingredient_target_evidence_full_view")
    .select("*")
    .in("ingredient_id", ingredientIds);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // 데이터 변환 (dose_count 포함)
  const result: Array<{
    ingredient_id: string;
    ingredient_name: string;
    target_slug: string;
    strength: number;
    study_type:
      | "systematic_review"
      | "rct"
      | "human_observational"
      | "case_report"
      | "animal"
      | "cell"
      | "mechanistic";
    meta_axis: string;
    axis_weight: number;
    dose_count: number;
  }> = [];

  const viewData = data as Array<{
    ingredient_id: string;
    ingredient_name: string;
    target_slug: string;
    strength: number;
    study_type: string;
    meta_axis: string;
    axis_weight: number;
  }>;

  for (const row of viewData) {
    const doseCount = ingredientDoseCount.get(row.ingredient_id) ?? 0;

    result.push({
      ingredient_id: row.ingredient_id,
      ingredient_name: row.ingredient_name,
      target_slug: row.target_slug,
      strength: row.strength,
      study_type: row.study_type as
        | "systematic_review"
        | "rct"
        | "human_observational"
        | "case_report"
        | "animal"
        | "cell"
        | "mechanistic",
      meta_axis: row.meta_axis,
      axis_weight: row.axis_weight,
      dose_count: doseCount,
    });
  }

  return result;
}

/**
 * 날짜 범위로 복용한 천연물의 표적-메타축 매핑 데이터 조회
 * 각 날짜별로 그룹화하여 반환 (기준선 계산용)
 */
export async function getIngredientEvidenceByDateRange(
  client: SupabaseClient<Database>,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<
  Array<{
    log_date: string;
    ingredient_id: string;
    ingredient_name: string;
    target_slug: string;
    strength: number;
    study_type:
      | "systematic_review"
      | "rct"
      | "human_observational"
      | "case_report"
      | "animal"
      | "cell"
      | "mechanistic";
    meta_axis: string;
    axis_weight: number;
    dose_count: number;
  }>
> {
  // 날짜 범위 내 보조제 기록 조회
  const { data: logs, error: logsError } = await client
    .from("routine_daily_grid_logs")
    .select("template_id, time_block, log_date")
    .eq("user_id", userId)
    .eq("category", "supplement")
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .not("template_id", "is", null);

  if (logsError) throw logsError;
  if (!logs || logs.length === 0) {
    return [];
  }

  const templateIds = logs
    .map((log) => log.template_id)
    .filter((id): id is string => id !== null);

  if (templateIds.length === 0) {
    return [];
  }

  // 템플릿의 아이템들 조회 (label 포함, ingredient_id 필터 제거)
  const { data: routineItems, error: itemsError } = await client
    .from("routine_items")
    .select("id, ingredient_id, template_id, label")
    .in("template_id", templateIds);

  if (itemsError) throw itemsError;
  if (!routineItems || routineItems.length === 0) {
    return [];
  }

  // ingredient_id가 없는 항목들을 label로 매칭
  const labelToIngredientId = new Map<string, string>();
  const itemsNeedingMatch = routineItems.filter((item) => !item.ingredient_id);

  if (itemsNeedingMatch.length > 0) {
    // 각 label을 natural_ingredients와 매칭
    for (const item of itemsNeedingMatch) {
      const matchedId = await matchLabelToIngredient(client, item.label);
      if (matchedId) {
        labelToIngredientId.set(item.label, matchedId);
      }
    }
  }

  // 날짜별, ingredient별로 dose_count 계산
  const dateIngredientDoseCount = new Map<string, Map<string, number>>();

  for (const log of logs) {
    if (!log.template_id || !log.log_date) continue;

    const date = log.log_date;
    if (!dateIngredientDoseCount.has(date)) {
      dateIngredientDoseCount.set(date, new Map());
    }

    const ingredientCounts = dateIngredientDoseCount.get(date)!;

    // 이 날짜에 복용한 template에 포함된 ingredient들 찾기
    const templateItems = routineItems.filter(
      (ri) => ri.template_id === log.template_id,
    );

    for (const item of templateItems) {
      const ingredientId =
        item.ingredient_id || labelToIngredientId.get(item.label);
      if (!ingredientId) continue;

      const currentCount = ingredientCounts.get(ingredientId) ?? 0;
      // 같은 날짜에 같은 ingredient가 여러 time_block에 등장하면 최대값 사용
      ingredientCounts.set(ingredientId, Math.max(currentCount, 1));
    }
  }

  // 모든 날짜의 ingredient ID 수집
  const allIngredientIds = new Set<string>();
  for (const ingredientCounts of dateIngredientDoseCount.values()) {
    for (const ingredientId of ingredientCounts.keys()) {
      allIngredientIds.add(ingredientId);
    }
  }

  if (allIngredientIds.size === 0) {
    return [];
  }

  // VIEW를 사용하여 성분 → 표적 → 메타축 조인 쿼리
  const { data, error } = await (client as any)
    .from("ingredient_target_evidence_full_view")
    .select("*")
    .in("ingredient_id", Array.from(allIngredientIds));

  if (error) throw error;
  if (!data || data.length === 0) {
    return [];
  }

  // 결과 생성: 날짜별로 그룹화
  const result: Array<{
    log_date: string;
    ingredient_id: string;
    ingredient_name: string;
    target_slug: string;
    strength: number;
    study_type:
      | "systematic_review"
      | "rct"
      | "human_observational"
      | "case_report"
      | "animal"
      | "cell"
      | "mechanistic";
    meta_axis: string;
    axis_weight: number;
    dose_count: number;
  }> = [];

  const viewData = data as Array<{
    ingredient_id: string;
    ingredient_name: string;
    target_slug: string;
    strength: number;
    study_type: string;
    meta_axis: string;
    axis_weight: number;
  }>;

  for (const date of dateIngredientDoseCount.keys()) {
    const ingredientCounts = dateIngredientDoseCount.get(date)!;

    for (const row of viewData) {
      const doseCount = ingredientCounts.get(row.ingredient_id) ?? 0;
      if (doseCount === 0) continue;

      result.push({
        log_date: date,
        ingredient_id: row.ingredient_id,
        ingredient_name: row.ingredient_name,
        target_slug: row.target_slug,
        strength: row.strength,
        study_type: row.study_type as
          | "systematic_review"
          | "rct"
          | "human_observational"
          | "case_report"
          | "animal"
          | "cell"
          | "mechanistic",
        meta_axis: row.meta_axis,
        axis_weight: row.axis_weight,
        dose_count: doseCount,
      });
    }
  }

  return result;
}

/**
 * 사용자의 스트릭 정보 조회
 */
export async function getStreak(
  client: SupabaseClientType,
  userId: string,
): Promise<{
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null;
  updated_at: string;
} | null> {
  const { data, error } = await client
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
