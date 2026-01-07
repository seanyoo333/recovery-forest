import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import type {
  Category,
  DailyGridLog,
  GridOption,
  SectionTemplate,
} from "./types";

import { normalizeStandardName } from "./constants";

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
  descriptions: {
    description?: string;
    significance?: {
      up?: string[];
      down?: string[];
    };
  } | null;
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
  const { data, error } = await client
    .from("patient_health_profiles")
    .select(
      `age,
       gender,
       disease,
       disease_status,
       treatment_status,
       medication_status,
       medication_name,
       height_cm,
       weight_kg`,
    )
    .eq("patient_id", userId)
    .maybeSingle();

  if (error) {
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
  const { data, error } = await client
    .from("blood_test_results")
    .select(
      `result_id,
       test_date,
       result_value,
       result_unit,
       blood_test_types!inner(standard_name, unit, clinical_significance, reference_min, reference_max, descriptions)`,
    )
    .eq("patient_id", userId)
    .order("test_date", { ascending: true })
    .order("result_id", { ascending: false }); // 같은 날짜 내에서 최신 값 우선

  if (error) {
    throw error;
  }

  // 같은 날짜, 같은 메트릭에 대한 중복 제거 (result_id가 큰 값, 즉 최신 값 우선)
  const parsedResultsWithId =
    data?.flatMap((item: any) => {
      const types = Array.isArray(item.blood_test_types)
        ? item.blood_test_types
        : item.blood_test_types
          ? [item.blood_test_types]
          : [];
      const typeInfo = types[0];
      if (!typeInfo?.standard_name) {
        return [];
      }
      // standard_name을 소문자로 정규화
      const metricKey = normalizeStandardName(
        typeInfo.standard_name,
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
          item.result_unit ?? typeInfo.unit ?? definition?.unit ?? null;
        return [
          {
            result_id: item.result_id,
            test_date: item.test_date,
            metricKey,
            value: item.result_value,
            unit,
            clinical_significance: typeInfo.clinical_significance ?? null,
            reference_min: typeInfo.reference_min ?? null,
            reference_max: typeInfo.reference_max ?? null,
            descriptions:
              (typeInfo.descriptions as {
                description?: string;
                significance?: {
                  up?: string[];
                  down?: string[];
                };
              } | null) ?? null,
          },
        ];
      }
      return [];
    }) ?? [];

  // 같은 날짜, 같은 메트릭에 대한 중복 제거 (result_id가 큰 값, 즉 최신 값 우선)
  const uniqueResults = new Map<string, (typeof parsedResultsWithId)[0]>();
  parsedResultsWithId.forEach((result) => {
    const key = `${result.test_date}_${result.metricKey}`;
    const existing = uniqueResults.get(key);
    // 기존 값이 없거나, result_id가 더 큰 값(최신 값)으로 덮어쓰기
    if (!existing || result.result_id > existing.result_id) {
      uniqueResults.set(key, result);
    }
  });

  // 중복 제거된 결과를 다시 배열로 변환 (result_id 제거)
  const deduplicatedResults = Array.from(uniqueResults.values()).map(
    ({ result_id, ...rest }) => rest,
  );

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
      descriptions: {
        description?: string;
        significance?: {
          up?: string[];
          down?: string[];
        };
      } | null;
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
          descriptions: latestValue?.descriptions ?? null,
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
 * 그리드 옵션 조회
 */
export async function getGridOptions(
  client: SupabaseClient<Database>,
  userId: string,
  category?: Category,
) {
  let query = client
    .from("grid_options")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as GridOption[];
}

/**
 * 일일 그리드 로그 조회
 */
export async function getDailyGridLogs(
  client: SupabaseClient<Database>,
  userId: string,
  logDate: string,
) {
  const { data, error } = await client
    .from("daily_grid_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", logDate);

  if (error) throw error;
  return (data ?? []) as DailyGridLog[];
}

/**
 * 기간별 일일 그리드 로그 조회
 */
export async function getDailyGridLogsByDateRange(
  client: SupabaseClient<Database>,
  userId: string,
  startDate: string,
  endDate: string,
) {
  const { data, error } = await client
    .from("daily_grid_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as DailyGridLog[];
}

/**
 * 섹션 템플릿 조회 (아이템 포함)
 */
export async function getSectionTemplates(
  client: SupabaseClient<Database>,
  userId: string,
  sectionType?: Category,
) {
  let query = client
    .from("section_templates")
    .select(
      `
      *,
      section_items (*)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (sectionType) {
    query = query.eq("section_type", sectionType);
  }

  const { data, error } = await query;
  if (error) throw error;

  // section_items를 배열로 변환
  return (data ?? []).map((template: any) => ({
    ...template,
    items: (template.section_items ?? []) as SectionTemplate["items"],
  })) as SectionTemplate[];
}
