import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

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
  value: number;
  unit: string;
  testDate: string;
};

export type BloodTestOverview = {
  chartData: BloodTestChartPoint[];
  availableMetrics: string[];
  latestSummary: BloodTestSummary[];
  lastTestDate: string | null;
};

export const METRIC_DEFINITIONS = {
  glucose: { label: "혈당", color: "var(--chart-1)", unit: "mg/dL" },
  hgbA1c: { label: "당화혈색소", color: "var(--chart-2)", unit: "%" },
  crp: { label: "CRP", color: "var(--chart-3)", unit: "mg/dL" },
  lmr: { label: "LMR", color: "var(--chart-4)", unit: "" },
  nlr: { label: "NLR", color: "var(--chart-5)", unit: "" },
  platelet: { label: "혈소판", color: "var(--chart-6)", unit: "10³/µL" },
  ldh: { label: "LDH", color: "var(--chart-7)", unit: "U/L" },
  ast: { label: "AST", color: "var(--chart-8)", unit: "U/L" },
  alt: { label: "ALT", color: "var(--chart-9)", unit: "U/L" },
  egfr: {
    label: "eGFR",
    color: "var(--chart-10)",
    unit: "mL/min/1.73㎡",
  },
  vitamin_d3: { label: "Vitamin D3", color: "var(--chart-11)", unit: "ng/mL" },
  tumor_marker: {
    label: "종양 표지자",
    color: "var(--chart-12)",
    unit: "ng/mL",
  },
} as const;

export const PRIMARY_METRICS: Array<keyof typeof METRIC_DEFINITIONS> = [
  "glucose",
  "hgbA1c",
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
        }>
      | {
          standard_name: string;
          unit: string | null;
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
      `test_date,
       result_value,
       result_unit,
       blood_test_types!inner(standard_name, unit)`,
    )
    .eq("patient_id", userId)
    .order("test_date", { ascending: true });

  if (error) {
    throw error;
  }

  const parsedResults =
    data?.flatMap((item: RawBloodTestResult) => {
      const types = Array.isArray(item.blood_test_types)
        ? item.blood_test_types
        : item.blood_test_types
          ? [item.blood_test_types]
          : [];
      const typeInfo = types[0];
      if (!typeInfo?.standard_name) {
        return [];
      }
      const metricKey = typeInfo.standard_name;
      if (!(metricKey in METRIC_DEFINITIONS)) {
        return [];
      }
      const definition =
        METRIC_DEFINITIONS[metricKey as keyof typeof METRIC_DEFINITIONS];
      const unit =
        item.result_unit ?? typeInfo.unit ?? definition?.unit ?? null;
      return [
        {
          test_date: item.test_date,
          metricKey: metricKey as keyof typeof METRIC_DEFINITIONS,
          value: item.result_value,
          unit,
        },
      ];
    }) ?? [];

  const metricsByDate = new Map<
    string,
    Record<string, { value: number; unit: string | null }>
  >();

  const latestValues = new Map<
    string,
    { value: number; unit: string | null; test_date: string }
  >();

  parsedResults.forEach((result) => {
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
      });
    }
  });

  const chartData = Array.from(metricsByDate.entries())
    .map(([date, values]) => ({
      date,
      ...Object.fromEntries(
        Object.entries(values).map(([metric, value]) => [metric, value.value]),
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const availableMetrics = new Set<string>();
  chartData.forEach((entry) => {
    Object.keys(entry).forEach((key) => {
      if (key !== "date") {
        availableMetrics.add(key);
      }
    });
  });

  const lastTestDate = chartData.at(-1)?.date ?? null;

  const latestSummary = Array.from(latestValues.entries()).map(
    ([metric, summary]) => ({
      metric,
      value: summary.value,
      unit:
        summary.unit ??
        METRIC_DEFINITIONS[metric as keyof typeof METRIC_DEFINITIONS]?.unit ??
        "",
      label:
        METRIC_DEFINITIONS[metric as keyof typeof METRIC_DEFINITIONS]?.label ??
        metric,
      testDate: summary.test_date,
    }),
  );

  return {
    chartData,
    availableMetrics: Array.from(availableMetrics),
    latestSummary,
    lastTestDate,
  };
}
