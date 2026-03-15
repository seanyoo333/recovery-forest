import type { Route } from "./+types/dashboard-health";

import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";
import { Area, ComposedChart, Line, ReferenceArea } from "recharts";
import { CartesianGrid, XAxis, YAxis } from "recharts";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import type { ChartConfig } from "~/core/components/ui/chart";
import { ChartTooltipContent } from "~/core/components/ui/chart";
import { ChartTooltip } from "~/core/components/ui/chart";
import { ChartContainer } from "~/core/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/core/components/ui/tooltip";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import {
  type BloodTestSummary,
  type MedicalRecordTranscriptEntry,
  METRIC_DEFINITIONS,
  METRIC_DISPLAY_ORDER,
  PRIMARY_METRICS,
  getBloodTestOverview,
  getPatientHealthProfile,
} from "../queries";

// HSL 색상을 더 밝게 만드는 헬퍼 함수 (neon 효과)
function brightenColor(color: string, brightnessBoost: number = 15): string {
  // hsl(h, s%, l%) 형식에서 lightness를 증가
  const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    const h = hslMatch[1];
    const s = Math.min(100, Number(hslMatch[2]) + 10); // 채도도 약간 증가
    const l = Math.min(95, Number(hslMatch[3]) + brightnessBoost); // 밝기 증가
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return color;
}

function formatChartConfig(
  metrics: Array<keyof typeof METRIC_DEFINITIONS>,
): ChartConfig {
  return metrics.reduce<Record<string, { label: string; color: string }>>(
    (acc, metric) => {
      const definition = METRIC_DEFINITIONS[metric];
      if (definition) {
        acc[metric] = {
          label: definition.label,
          color: brightenColor(definition.color, 20), // 더 밝은 색상 사용
        };
      }
      return acc;
    },
    {},
  ) satisfies ChartConfig;
}

// 빗살무늬 패턴과 neon glow 효과를 위한 전역 SVG defs
function WarningPatternDefs({ metrics }: { metrics: string[] }) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        {/* Neon glow filter */}
        <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Stronger neon glow for lines */}
        <filter
          id="neon-glow-strong"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Metal shine effect */}
        <linearGradient id="metal-shine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.1)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </linearGradient>
        {metrics.map((metric) => (
          <g key={metric}>
            {/* 밝은 빗살무늬 패턴 - 위쪽 경고 영역 */}
            <pattern
              id={`warning-pattern-upper-${metric}`}
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
              patternTransform="rotate(-45)"
            >
              <rect
                width="8"
                height="8"
                fill="hsl(0, 100%, 70%)"
                fillOpacity={0.25}
              />
              <path
                d="M 0,4 L 8,4"
                stroke="hsl(0, 100%, 60%)"
                strokeWidth="2.5"
                strokeOpacity={0.6}
              />
            </pattern>
            {/* 밝은 빗살무늬 패턴 - 아래쪽 경고 영역 */}
            <pattern
              id={`warning-pattern-lower-${metric}`}
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
              patternTransform="rotate(-45)"
            >
              <rect
                width="8"
                height="8"
                fill="hsl(0, 100%, 70%)"
                fillOpacity={0.25}
              />
              <path
                d="M 0,4 L 8,4"
                stroke="hsl(0, 100%, 60%)"
                strokeWidth="2.5"
                strokeOpacity={0.6}
              />
            </pattern>
          </g>
        ))}
      </defs>
    </svg>
  );
}

function getChartYDomain(
  chartData: Array<Record<string, string | number>>,
  metric: string,
  referenceMin: number | null,
  referenceMax: number | null,
): [number, number] {
  const values = chartData
    .map((point) => point[metric] as number | undefined)
    .filter((v): v is number => v !== undefined);

  if (values.length === 0) {
    return [0, 100];
  }

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  // 값이 하나거나 차이가 매우 작을 때 0으로 수렴하는 것을 방지
  const span = Math.max(
    dataMax - dataMin,
    Math.max(Math.abs(dataMax), Math.abs(dataMin), 1) * 0.1,
  );
  const padding = span * 0.2;

  let min = dataMin - padding;
  let max = dataMax + padding;

  // reference 범위를 고려하여 domain 확장 (범위 밖 영역을 더 넓게)
  if (referenceMin !== null && referenceMin < min) {
    const rangePadding =
      (referenceMax !== null && referenceMin !== null
        ? referenceMax - referenceMin
        : dataMax - dataMin) * 0.3;
    min = referenceMin - rangePadding;
  }
  if (referenceMax !== null) {
    // referenceMax 위쪽에 표시할 공간 계산
    let rangePadding: number;
    if (referenceMin !== null && referenceMax !== null) {
      // min과 max가 모두 있으면 범위의 30%를 padding으로 사용
      rangePadding = (referenceMax - referenceMin) * 0.3;
    } else {
      // referenceMax만 있으면 referenceMax 자체의 40%를 padding으로 사용
      // 범위 밖 영역이 명확히 보이도록 충분한 공간 확보
      rangePadding = referenceMax * 0.4;
    }

    // referenceMax 위쪽에 충분한 공간 확보
    // referenceMax가 데이터 최대값보다 작거나 같아도, 범위 밖 영역 표시를 위해 확장
    const minRequiredMax = referenceMax + rangePadding;
    max = Math.max(max, minRequiredMax);

    // 디버깅: referenceMax만 있을 때 도메인이 올바르게 확장되었는지 확인
    if (referenceMin === null && max <= referenceMax) {
      console.warn(
        `[getChartYDomain] Warning: referenceMax (${referenceMax}) 위쪽에 공간이 부족합니다. max: ${max}, minRequiredMax: ${minRequiredMax}`,
      );
      // 강제로 최소한의 공간 확보
      max = referenceMax * 1.5;
    }
  }

  return [min, max];
}

export const meta: Route.MetaFunction = () => {
  return [{ title: `Dashboard | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  const [patientProfile, overview] = await Promise.all([
    getPatientHealthProfile(client, userId).catch((error) => {
      console.error("Failed to load patient profile:", error);
      return null;
    }),
    getBloodTestOverview(client, userId).catch((error) => {
      console.error("Failed to load blood test overview:", error);
      return {
        chartData: [],
        availableMetrics: [],
        latestSummary: [],
        lastTestDate: null,
        referenceRanges: {},
        summariesByDate: {},
        availableDates: [],
      };
    }),
  ]);

  return {
    patientProfile,
    ...overview,
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "updateResults") {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);
    const testDate = formData.get("testDate")?.toString();

    if (!testDate) {
      return { error: "검사 날짜가 필요합니다." };
    }

    const values: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key.startsWith("values[")) {
        const metric = key.slice(7, -1); // "values[metric]"에서 metric 추출
        values[metric] = value.toString();
      }
    });

    console.log("[Action] Updating blood test results:", {
      testDate,
      values,
      userId,
    });

    if (Object.keys(values).length === 0) {
      return { error: "수정할 값이 없습니다." };
    }

    try {
      const { updateBloodTestResult } = await import("../mutations");
      await Promise.all(
        Object.entries(values).map(([metric, value]) => {
          const numericValue = Number(value);
          if (Number.isNaN(numericValue)) {
            throw new Error(`${metric}의 값이 유효하지 않습니다.`);
          }
          console.log(
            `[Action] Updating ${metric} to ${numericValue} for date ${testDate}`,
          );
          return updateBloodTestResult(client, {
            patientId: userId,
            testDate,
            standardName: metric,
            resultValue: numericValue,
          });
        }),
      );
      console.log("[Action] Successfully updated blood test results");
      return { success: true };
    } catch (error) {
      console.error("[Action] Failed to update blood test results:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "검사 결과 업데이트에 실패했습니다.",
      };
    }
  }

  if (intent === "deleteResults") {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);
    const testDate = formData.get("testDate")?.toString();

    if (!testDate) {
      return { error: "검사 날짜가 필요합니다." };
    }

    console.log("[Action] Deleting blood test results for date:", {
      testDate,
      userId,
    });

    try {
      const { deleteBloodTestResultsByDate } = await import("../mutations");
      await deleteBloodTestResultsByDate(client, {
        patientId: userId,
        testDate,
      });
      console.log("[Action] Successfully deleted blood test results");
      return { success: true };
    } catch (error) {
      console.error("[Action] Failed to delete blood test results:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "검사 결과 삭제에 실패했습니다.",
      };
    }
  }

  if (intent === "updateProfile") {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    const age = formData.get("age")?.toString();
    const gender = formData.get("gender")?.toString();
    const disease = formData.get("disease")?.toString();
    const diseaseStatus = formData.get("disease_status")?.toString();
    const treatmentStatus = formData.get("treatment_status")?.toString();
    const medicationStatus = formData.get("medication_status")?.toString();
    const medicationName = formData.get("medication_name")?.toString();
    const heightCm = formData.get("height_cm")?.toString();
    const weightKg = formData.get("weight_kg")?.toString();

    if (
      !age ||
      !gender ||
      !disease ||
      !treatmentStatus ||
      !medicationStatus ||
      !heightCm ||
      !weightKg
    ) {
      return { error: "필수 필드가 누락되었습니다." };
    }

    try {
      const { upsertPatientHealthProfile } = await import("../mutations");
      await upsertPatientHealthProfile(client, {
        patientId: userId,
        age: Number(age),
        gender: gender as "M" | "F",
        disease,
        diseaseStatus: diseaseStatus || "",
        treatmentStatus: treatmentStatus as
          | "ongoing"
          | "completed"
          | "follow_up",
        medicationStatus: medicationStatus as "none" | "active",
        medicationName:
          medicationStatus === "active" ? medicationName || null : null,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
      });
      console.log("[Action] Successfully updated patient profile");
      return { success: true };
    } catch (error) {
      console.error("[Action] Failed to update patient profile:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "기본 정보 업데이트에 실패했습니다.",
      };
    }
  }

  return null;
};

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function DashboardHealth({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const {
    patientProfile,
    chartData,
    availableMetrics,
    latestSummary,
    lastTestDate,
    referenceRanges = {},
    summariesByDate = {},
    availableDates = [],
  } = loaderData as LoaderData;

  const [selectedDate, setSelectedDate] = useState<string>(lastTestDate || "");
  const [summaryViewMode, setSummaryViewMode] = useState<"blood_test" | "medical_record">("blood_test");
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const medicalRecords: MedicalRecordTranscriptEntry[] =
    (patientProfile as { medical_record_transcripts?: MedicalRecordTranscriptEntry[] | null })
      ?.medical_record_transcripts ?? [];
  const medicalRecordDates = [...new Set(medicalRecords.map((r) => r.test_date))].sort(
    (a, b) => b.localeCompare(a),
  );
  const [selectedMedicalDate, setSelectedMedicalDate] = useState<string>("");
  const effectiveMedicalDate = selectedMedicalDate || (medicalRecordDates[0] ?? "");
  const selectedMedicalRecords = medicalRecords.filter((r) => r.test_date === effectiveMedicalDate);

  useEffect(() => {
    if (medicalRecordDates.length > 0 && !medicalRecordDates.includes(selectedMedicalDate)) {
      setSelectedMedicalDate(medicalRecordDates[0]);
    }
  }, [medicalRecordDates, selectedMedicalDate]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<{
    age: string;
    gender: "M" | "F" | "";
    disease: string;
    disease_status: string;
    treatment_status: "ongoing" | "completed" | "follow_up" | "";
    medication_status: "none" | "active" | "";
    medication_name: string;
    height_cm: string;
    weight_kg: string;
  }>({
    age: "",
    gender: "",
    disease: "",
    disease_status: "",
    treatment_status: "",
    medication_status: "",
    medication_name: "",
    height_cm: "",
    weight_kg: "",
  });
  const [maxDataPoints, setMaxDataPoints] = useState<string>("24");
  const fetcher = useFetcher();

  // fetcher.data가 성공 응답이면 페이지 새로고침
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      console.log("[Component] Fetcher data received:", fetcher.data);
      if (typeof fetcher.data === "object" && fetcher.data !== null) {
        if ("success" in fetcher.data && fetcher.data.success) {
          console.log("[Component] Update successful, reloading page");
          setIsEditing(false);
          setEditedValues({});
          setIsEditingProfile(false);
          setEditedProfile({
            age: "",
            gender: "",
            disease: "",
            disease_status: "",
            treatment_status: "",
            medication_status: "",
            medication_name: "",
            height_cm: "",
            weight_kg: "",
          });
          window.location.reload();
        } else if ("error" in fetcher.data && fetcher.data.error) {
          console.error("[Component] Update error:", fetcher.data.error);
          alert(String(fetcher.data.error));
          // 에러 시 편집 모드 유지
          if (isEditingProfile) {
            setIsEditingProfile(true);
          } else {
            setIsEditing(true);
          }
        }
      }
    }
  }, [fetcher.data, fetcher.state, isEditingProfile]);

  const hasChartData = chartData.length > 0;

  // 선택된 날짜의 summary 가져오기
  const currentSummary =
    selectedDate &&
    (summariesByDate as Record<string, BloodTestSummary[]>)[selectedDate]
      ? (summariesByDate as Record<string, BloodTestSummary[]>)[selectedDate]
      : latestSummary;

  // 종양표지자와 일반 메트릭 분리
  const tumorMarkersInSummary = currentSummary.filter(
    (item: BloodTestSummary) => item.metric.startsWith("tumor_marker_"),
  );
  const otherMetricsInSummary = currentSummary.filter(
    (item: BloodTestSummary) => !item.metric.startsWith("tumor_marker_"),
  );

  // 종양표지자 정렬 (알파벳 순)
  const sortedTumorMarkers = tumorMarkersInSummary.sort(
    (a: BloodTestSummary, b: BloodTestSummary) =>
      a.metric.localeCompare(b.metric),
  );

  // METRIC_DISPLAY_ORDER 순서를 유지하면서 사용 가능한 metric만 필터링
  const metricOrder = new Map<string, number>(
    METRIC_DISPLAY_ORDER.map((metric: string, index: number) => [
      metric,
      index,
    ]),
  );

  // 일반 메트릭을 METRIC_DISPLAY_ORDER 순서로 정렬
  const sortedOtherMetrics = otherMetricsInSummary.sort(
    (a: BloodTestSummary, b: BloodTestSummary) => {
      const orderA = metricOrder.get(a.metric) ?? 999;
      const orderB = metricOrder.get(b.metric) ?? 999;
      return orderA - orderB;
    },
  );

  // 종양표지자 먼저, 그 다음 일반 메트릭
  const currentSummaryByDate = [...sortedTumorMarkers, ...sortedOtherMetrics];

  const availableMetricsSet = new Set(availableMetrics);
  const availableMetricKeys = METRIC_DISPLAY_ORDER.filter((metric) =>
    availableMetricsSet.has(metric),
  ) as Array<keyof typeof METRIC_DEFINITIONS>;

  // 종양표지자도 availableMetrics에 포함
  const tumorMarkerKeys = Array.from(availableMetricsSet).filter((metric) =>
    metric.startsWith("tumor_marker_"),
  );
  const allAvailableMetricKeys = [
    ...tumorMarkerKeys.sort(),
    ...availableMetricKeys,
  ];

  // 모든 metric을 정렬 (종양표지자 먼저, 그 다음 METRIC_DISPLAY_ORDER)
  const sortedAllMetrics = allAvailableMetricKeys.sort((a, b) => {
    const aIsTumor = a.startsWith("tumor_marker_");
    const bIsTumor = b.startsWith("tumor_marker_");
    if (aIsTumor && !bIsTumor) return -1;
    if (!aIsTumor && bIsTumor) return 1;
    if (aIsTumor && bIsTumor) return a.localeCompare(b);
    const orderA = metricOrder.get(a) ?? 999;
    const orderB = metricOrder.get(b) ?? 999;
    return orderA - orderB;
  });

  // 그래프를 2개씩 그룹화
  const groupedMetrics: Array<Array<keyof typeof METRIC_DEFINITIONS>> = [];
  sortedAllMetrics.forEach((metric) => {
    const lastGroup = groupedMetrics[groupedMetrics.length - 1];
    if (!lastGroup || lastGroup.length === 2) {
      groupedMetrics.push([metric as keyof typeof METRIC_DEFINITIONS]);
    } else {
      lastGroup.push(metric as keyof typeof METRIC_DEFINITIONS);
    }
  });

  const bmi =
    patientProfile?.height_cm && patientProfile?.weight_kg
      ? patientProfile.weight_kg / Math.pow(patientProfile.height_cm / 100, 2)
      : null;

  // LMR과 NLR 계산 헬퍼 함수
  const calculateLMRAndNLR = (
    values: Record<string, string>,
  ): Record<string, string> => {
    const result = { ...values };

    // currentSummary에서 lymphocyte, monocyte, neutrophil 값 찾기
    const lymphocyteItem = currentSummary.find(
      (item: BloodTestSummary) => item.metric === "lymphocyte",
    );
    const monocyteItem = currentSummary.find(
      (item: BloodTestSummary) => item.metric === "monocyte",
    );
    const neutrophilItem = currentSummary.find(
      (item: BloodTestSummary) => item.metric === "neutrophil",
    );

    const lymphocyteValue = lymphocyteItem?.value;
    const monocyteValue = monocyteItem?.value;
    const neutrophilValue = neutrophilItem?.value;

    // LMR 계산: lymphocyte / monocyte
    // metric 이름은 "lmr" (소문자로 정규화)
    const lmrMetric = currentSummary.find(
      (item: BloodTestSummary) => item.metric === "lmr",
    );
    const hasLMR =
      lmrMetric && lmrMetric.value !== null && lmrMetric.value !== undefined;

    if (
      !hasLMR &&
      lymphocyteValue !== null &&
      lymphocyteValue !== undefined &&
      monocyteValue !== null &&
      monocyteValue !== undefined
    ) {
      const lymph = Number(lymphocyteValue);
      const mono = Number(monocyteValue);
      if (!Number.isNaN(lymph) && !Number.isNaN(mono) && mono !== 0) {
        const lmr = lymph / mono;
        result.lmr = lmr.toFixed(2);
      }
    }

    // NLR 계산: neutrophil / lymphocyte
    // metric 이름은 "nlr" (소문자로 정규화)
    const nlrMetric = currentSummary.find(
      (item: BloodTestSummary) => item.metric === "nlr",
    );
    const hasNLR =
      nlrMetric && nlrMetric.value !== null && nlrMetric.value !== undefined;

    if (
      !hasNLR &&
      neutrophilValue !== null &&
      neutrophilValue !== undefined &&
      lymphocyteValue !== null &&
      lymphocyteValue !== undefined
    ) {
      const neutro = Number(neutrophilValue);
      const lymph = Number(lymphocyteValue);
      if (!Number.isNaN(neutro) && !Number.isNaN(lymph) && lymph !== 0) {
        const nlr = neutro / lymph;
        result.nlr = nlr.toFixed(2);
      }
    }

    return result;
  };

  const handleEdit = () => {
    setIsEditing(true);
    const initialValues: Record<string, string> = {};
    currentSummary.forEach((item: BloodTestSummary) => {
      // 값이 없으면 빈 문자열로 초기화
      initialValues[item.metric] =
        item.value !== null && item.value !== undefined
          ? String(item.value)
          : "";
    });
    // LMR과 NLR이 없으면 계산
    const processedValues = calculateLMRAndNLR(initialValues);
    setEditedValues(processedValues);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedValues({});
  };

  const handleSave = () => {
    if (!selectedDate) {
      alert("검사 날짜를 선택해주세요.");
      return;
    }

    if (Object.keys(editedValues).length === 0) {
      alert("수정할 값이 없습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("_intent", "updateResults");
    formData.append("testDate", selectedDate);
    Object.entries(editedValues).forEach(([metric, value]) => {
      if (value.trim() !== "") {
        formData.append(`values[${metric}]`, value);
      }
    });

    console.log("Saving values:", Object.fromEntries(formData.entries()));
    fetcher.submit(formData, { method: "post" });
    // 저장 완료는 useEffect에서 처리
  };

  const handleValueChange = (metric: string, value: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [metric]: value,
    }));
  };

  const handleDelete = () => {
    if (!selectedDate) {
      alert("검사 날짜를 선택해주세요.");
      return;
    }

    const confirmMessage = `선택한 날짜(${new Date(selectedDate).toLocaleDateString("ko-KR")})의 모든 검사 결과를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    const formData = new FormData();
    formData.append("_intent", "deleteResults");
    formData.append("testDate", selectedDate);

    console.log("Deleting results for date:", selectedDate);
    fetcher.submit(formData, { method: "post" });
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    if (patientProfile) {
      setEditedProfile({
        age: String(patientProfile.age),
        gender: patientProfile.gender,
        disease: patientProfile.disease,
        disease_status: patientProfile.disease_status || "",
        treatment_status: patientProfile.treatment_status,
        medication_status: patientProfile.medication_status,
        medication_name: patientProfile.medication_name || "",
        height_cm: String(patientProfile.height_cm),
        weight_kg: String(patientProfile.weight_kg),
      });
    }
  };

  const handleCancelProfile = () => {
    setIsEditingProfile(false);
    setEditedProfile({
      age: "",
      gender: "",
      disease: "",
      disease_status: "",
      treatment_status: "",
      medication_status: "",
      medication_name: "",
      height_cm: "",
      weight_kg: "",
    });
  };

  const handleSaveProfile = () => {
    const formData = new FormData();
    formData.append("_intent", "updateProfile");
    formData.append("age", editedProfile.age);
    formData.append("gender", editedProfile.gender);
    formData.append("disease", editedProfile.disease);
    formData.append("disease_status", editedProfile.disease_status);
    formData.append("treatment_status", editedProfile.treatment_status);
    formData.append("medication_status", editedProfile.medication_status);
    if (editedProfile.medication_status === "active") {
      formData.append("medication_name", editedProfile.medication_name);
    }
    formData.append("height_cm", editedProfile.height_cm);
    formData.append("weight_kg", editedProfile.weight_kg);

    console.log("Saving profile:", Object.fromEntries(formData.entries()));
    fetcher.submit(formData, { method: "post" });
  };

  const handleProfileChange = (field: string, value: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const treatmentStatusLabels: Record<string, string> = {
    ongoing: "치료 중",
    completed: "치료 완료",
    follow_up: "경과 관찰",
  };

  const medicationStatusLabels: Record<string, string> = {
    none: "복용 안 함",
    active: "복용 중",
  };

  // 최근 데이터만 표시 (사용자가 선택한 개수 또는 전체)
  const MAX_DATA_POINTS =
    maxDataPoints === "all" ? chartData.length : Number(maxDataPoints);
  const limitedChartData = chartData.slice(-MAX_DATA_POINTS);

  // 날짜를 타임스탬프로 변환하여 정확한 간격 반영
  const chartDataWithTimestamps = limitedChartData.map((point) => ({
    ...point,
    dateTimestamp: new Date(point.date).getTime(),
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">건강정보 현황</h1>
        <Link to="/my/dashboard/health/consent">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full font-bold shadow-sm sm:w-auto">
            병원 검사 입력
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>기본 정보</CardTitle>
              {patientProfile && (
                <div className="flex gap-2">
                  {isEditingProfile ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelProfile}
                      >
                        취소
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        disabled={fetcher.state === "submitting"}
                      >
                        저장
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditProfile}
                    >
                      수정
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {patientProfile ? (
              <div className="grid grid-cols-2 gap-4 text-sm md:gap-6">
                <div>
                  <span className="font-medium">나이</span>
                  {isEditingProfile ? (
                    <input
                      type="number"
                      value={editedProfile.age}
                      onChange={(e) =>
                        handleProfileChange("age", e.target.value)
                      }
                      className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1 text-sm"
                      placeholder="나이 입력"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {patientProfile.age}세
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-medium">성별</span>
                  {isEditingProfile ? (
                    <Select
                      value={editedProfile.gender}
                      onValueChange={(value) =>
                        handleProfileChange("gender", value)
                      }
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="성별 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">남성</SelectItem>
                        <SelectItem value="F">여성</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-muted-foreground">
                      {patientProfile.gender === "M" ? "남성" : "여성"}
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-medium">질환명</span>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={editedProfile.disease}
                      onChange={(e) =>
                        handleProfileChange("disease", e.target.value)
                      }
                      className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1 text-sm"
                      placeholder="예) 유방암"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {patientProfile.disease}
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-medium">질환 상태</span>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={editedProfile.disease_status}
                      onChange={(e) =>
                        handleProfileChange("disease_status", e.target.value)
                      }
                      className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1 text-sm"
                      placeholder="예) 기수, 전이 여부, 관해 여부, 이차암, 합병증 등"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {patientProfile.disease_status ?? "-"}
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-medium">치료 상태</span>
                  {isEditingProfile ? (
                    <Select
                      value={editedProfile.treatment_status}
                      onValueChange={(value) =>
                        handleProfileChange("treatment_status", value)
                      }
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="치료 상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ongoing">치료 중</SelectItem>
                        <SelectItem value="completed">치료 완료</SelectItem>
                        <SelectItem value="follow_up">경과 관찰</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-muted-foreground">
                      {treatmentStatusLabels[patientProfile.treatment_status] ??
                        patientProfile.treatment_status ??
                        "-"}
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-medium">약물 복용</span>
                  {isEditingProfile ? (
                    <div className="mt-1 space-y-2">
                      <Select
                        value={editedProfile.medication_status}
                        onValueChange={(value) =>
                          handleProfileChange("medication_status", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="약물 복용 상태 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">복용 안 함</SelectItem>
                          <SelectItem value="active">복용 중</SelectItem>
                        </SelectContent>
                      </Select>
                      {editedProfile.medication_status === "active" && (
                        <input
                          type="text"
                          value={editedProfile.medication_name}
                          onChange={(e) =>
                            handleProfileChange(
                              "medication_name",
                              e.target.value,
                            )
                          }
                          className="border-input bg-background w-full rounded-md border px-2 py-1 text-sm"
                          placeholder="예) 메트포르민, 타목시펜 등"
                        />
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {patientProfile.medication_status === "active"
                        ? `${medicationStatusLabels[patientProfile.medication_status] ?? "복용 중"} (${
                            patientProfile.medication_name ?? "약물명 미입력"
                          })`
                        : (medicationStatusLabels[
                            patientProfile.medication_status
                          ] ?? "복용 상태 미입력")}
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-medium">키</span>
                  {isEditingProfile ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={editedProfile.height_cm}
                        onChange={(e) =>
                          handleProfileChange("height_cm", e.target.value)
                        }
                        className="border-input bg-background w-full rounded-md border px-2 py-1 text-sm"
                        placeholder="키 입력"
                      />
                      <span className="text-muted-foreground text-xs">cm</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {patientProfile.height_cm ?? "-"} cm
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-medium">몸무게</span>
                  {isEditingProfile ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={editedProfile.weight_kg}
                        onChange={(e) =>
                          handleProfileChange("weight_kg", e.target.value)
                        }
                        className="border-input bg-background w-full rounded-md border px-2 py-1 text-sm"
                        placeholder="몸무게 입력"
                      />
                      <span className="text-muted-foreground text-xs">kg</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {patientProfile.weight_kg ?? "-"} kg
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">BMI</span>
                  <p className="text-muted-foreground">
                    {isEditingProfile &&
                    editedProfile.height_cm &&
                    editedProfile.weight_kg
                      ? (
                          Number(editedProfile.weight_kg) /
                          Math.pow(Number(editedProfile.height_cm) / 100, 2)
                        ).toFixed(1)
                      : bmi
                        ? bmi.toFixed(1)
                        : "-"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                아직 기본 정보가 등록되지 않았습니다.{" "}
                <Link to="/my/dashboard/health/consent" className="underline">
                  기본 정보를 입력해주세요.
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>최근 검사 결과 요약</CardTitle>
              {(currentSummaryByDate.length > 0 || medicalRecords.length > 0) && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={summaryViewMode === "blood_test" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSummaryViewMode("blood_test")}
                  >
                    혈액검사
                  </Button>
                  <Button
                    type="button"
                    variant={summaryViewMode === "medical_record" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSummaryViewMode("medical_record")}
                  >
                    의무기록
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {summaryViewMode === "medical_record" ? (
              medicalRecords.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">검사일:</span>
                    <Select
                      value={effectiveMedicalDate}
                      onValueChange={setSelectedMedicalDate}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="날짜 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicalRecordDates.map((date: string) => (
                          <SelectItem key={date} value={date}>
                            {new Date(date).toLocaleDateString("ko-KR")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    {selectedMedicalRecords.map((rec, idx) => (
                      <div key={idx} className="bg-muted/50 space-y-2 rounded-lg border p-3 text-sm">
                        {rec.test_content && (
                          <div>
                            <span className="font-medium">검사내용:</span>
                            <p className="text-muted-foreground mt-1">{rec.test_content}</p>
                          </div>
                        )}
                        {rec.clinical_information && (
                          <div>
                            <span className="font-medium">Clinical Information:</span>
                            <p className="text-muted-foreground mt-1">{rec.clinical_information}</p>
                          </div>
                        )}
                        {rec.finding && (
                          <div>
                            <span className="font-medium">Finding:</span>
                            <p className="text-muted-foreground mt-1">{rec.finding}</p>
                          </div>
                        )}
                        {rec.conclusion && (
                          <div>
                            <span className="font-medium">Conclusion:</span>
                            <p className="text-muted-foreground mt-1">{rec.conclusion}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  등록된 의무기록이 없습니다.{" "}
                  <Link to="/my/dashboard/health/submit" className="underline">
                    의무기록을 입력해보세요.
                  </Link>
                </div>
              )
            ) : currentSummaryByDate.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      검사일:
                    </span>
                    {availableDates.length > 0 ? (
                      <Select
                        value={selectedDate}
                        onValueChange={setSelectedDate}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="날짜 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDates.map((date: string) => (
                            <SelectItem key={date} value={date}>
                              {new Date(date).toLocaleDateString("ko-KR")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm">
                        {selectedDate
                          ? new Date(selectedDate).toLocaleDateString("ko-KR")
                          : "-"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                        >
                          취소
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                          저장
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEdit}
                        >
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={fetcher.state === "submitting"}
                        >
                          삭제
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {currentSummaryByDate.map((item: BloodTestSummary) => (
                    <Tooltip key={item.metric}>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {item.label} ({item.metric}):
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  editedValues[item.metric] ??
                                  (item.value !== null &&
                                  item.value !== undefined
                                    ? String(item.value)
                                    : "")
                                }
                                onChange={(e) =>
                                  handleValueChange(item.metric, e.target.value)
                                }
                                className="border-input bg-background w-20 rounded-md border px-2 py-1 text-sm"
                                placeholder="값 입력"
                              />
                              {item.unit && (
                                <span className="text-muted-foreground">
                                  {item.unit}
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              <span className="font-medium">
                                {item.label} ({item.metric}):
                              </span>{" "}
                              <span className="text-muted-foreground">
                                {item.value !== null &&
                                item.value !== undefined ? (
                                  <>
                                    {item.value}
                                    {item.unit ? ` ${item.unit}` : ""}
                                  </>
                                ) : (
                                  "-"
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </TooltipTrigger>
                      {(item.clinicalSignificance || item.descriptions) && (
                        <TooltipContent
                          side="top"
                          sideOffset={8}
                          collisionPadding={20}
                          className="max-w-sm space-y-3 p-4"
                        >
                          {/* 제목 */}
                          <div className="border-b pb-2 text-base font-semibold">
                            {item.label}
                          </div>

                          {/* 정상 범위 */}
                          {(item.referenceMin !== null ||
                            item.referenceMax !== null) && (
                            <div className="space-y-1">
                              <div className="text-muted-foreground text-xs font-medium">
                                정상 범위
                              </div>
                              <div className="text-sm font-medium">
                                {item.referenceMin !== null
                                  ? `${item.referenceMin}`
                                  : "~"}
                                {item.unit && ` ${item.unit}`}
                                {item.referenceMin !== null &&
                                item.referenceMax !== null
                                  ? " ~ "
                                  : ""}
                                {item.referenceMax !== null
                                  ? `${item.referenceMax}`
                                  : ""}
                                {item.unit && item.referenceMin === null
                                  ? ` ${item.unit}`
                                  : ""}
                              </div>
                            </div>
                          )}

                          {/* 현재 값 상태 */}
                          {item.value !== null && item.value !== undefined && (
                            <div className="space-y-1">
                              <div className="text-muted-foreground text-xs font-medium">
                                현재 값
                              </div>
                              <div
                                className={`text-sm font-medium ${
                                  (item.referenceMin !== null &&
                                    item.value < item.referenceMin) ||
                                  (item.referenceMax !== null &&
                                    item.value > item.referenceMax)
                                    ? "text-destructive"
                                    : "text-green-600"
                                }`}
                              >
                                {item.value} {item.unit}
                                {((item.referenceMin !== null &&
                                  item.value < item.referenceMin) ||
                                  (item.referenceMax !== null &&
                                    item.value > item.referenceMax)) && (
                                  <span className="ml-2 text-xs">
                                    ⚠️ 범위 초과
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 설명 */}
                          {item.descriptions?.description && (
                            <div className="space-y-1 border-t pt-2">
                              <div className="text-muted-foreground text-xs font-medium">
                                설명
                              </div>
                              <p className="text-sm leading-relaxed">
                                {item.descriptions.description}
                              </p>
                            </div>
                          )}

                          {/* 의의 - 증가 (UP) */}
                          {item.descriptions?.significance?.up &&
                            item.descriptions.significance.up.length > 0 && (
                              <div className="space-y-1 border-t pt-2">
                                <div className="text-muted-foreground text-xs font-medium">
                                  증가 시 의의
                                </div>
                                <ul className="list-inside list-disc space-y-1 text-sm">
                                  {item.descriptions.significance.up.map(
                                    (item, index) => (
                                      <li
                                        key={index}
                                        className="leading-relaxed"
                                      >
                                        {item}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* 의의 - 감소 (DOWN) */}
                          {item.descriptions?.significance?.down &&
                            item.descriptions.significance.down.length > 0 && (
                              <div className="space-y-1 border-t pt-2">
                                <div className="text-muted-foreground text-xs font-medium">
                                  감소 시 의의
                                </div>
                                <ul className="list-inside list-disc space-y-1 text-sm">
                                  {item.descriptions.significance.down.map(
                                    (item, index) => (
                                      <li
                                        key={index}
                                        className="leading-relaxed"
                                      >
                                        {item}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* 기본 clinical_significance (descriptions가 없을 때만) */}
                          {!item.descriptions && item.clinicalSignificance && (
                            <div className="text-muted-foreground border-t pt-2 text-xs">
                              {item.clinicalSignificance}
                            </div>
                          )}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                아직 입력된 검사 결과가 없습니다.{" "}
                <Link to="/my/dashboard/health/consent" className="underline">
                  첫 검사 결과를 등록해보세요.
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {hasChartData ? (
        <div className="space-y-8">
          {/* 빗살무늬 패턴을 위한 전역 SVG defs */}
          <WarningPatternDefs metrics={sortedAllMetrics} />
          {/* 기간 선택 드롭다운 */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-muted-foreground text-sm">표시 기간:</span>
            <Select value={maxDataPoints} onValueChange={setMaxDataPoints}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">최근 12개</SelectItem>
                <SelectItem value="24">최근 24개</SelectItem>
                <SelectItem value="36">최근 36개</SelectItem>
                <SelectItem value="all">전체</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {groupedMetrics.map((group, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8"
            >
              {group.map((metric) => {
                const refRange = (
                  referenceRanges as Record<
                    string,
                    { min: number | null; max: number | null }
                  >
                )?.[metric];
                const yDomain = refRange
                  ? getChartYDomain(
                      limitedChartData,
                      metric,
                      refRange.min,
                      refRange.max,
                    )
                  : getChartYDomain(limitedChartData, metric, null, null);
                const hasReferenceRange =
                  refRange && (refRange.min !== null || refRange.max !== null);

                return (
                  <Card key={metric}>
                    <CardHeader>
                      <CardTitle>
                        {METRIC_DEFINITIONS[metric].label} 추이
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 커스텀 범례 - 그래프 위에 표시 */}
                      <div className="bg-muted/40 flex flex-wrap items-center gap-3 rounded-lg border p-3 text-xs shadow-sm">
                        {/* 메트릭 색상 및 이름 표시 */}
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full border-2 border-white shadow-lg transition-all hover:scale-110"
                            style={{
                              backgroundColor: brightenColor(
                                METRIC_DEFINITIONS[metric].color,
                                20,
                              ),
                              boxShadow: `0 0 12px ${brightenColor(METRIC_DEFINITIONS[metric].color, 20)}, 0 0 4px ${brightenColor(METRIC_DEFINITIONS[metric].color, 20)}`,
                            }}
                          />
                          <span className="text-foreground font-semibold">
                            {METRIC_DEFINITIONS[metric].label}
                          </span>
                          {METRIC_DEFINITIONS[metric].unit && (
                            <span className="text-muted-foreground">
                              ({METRIC_DEFINITIONS[metric].unit})
                            </span>
                          )}
                        </div>
                        {/* 정상 범위 표시 */}
                        {hasReferenceRange && (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded border-2 border-green-500/60 bg-green-500/30 shadow-sm" />
                            <span className="text-foreground font-medium">
                              정상 범위:
                            </span>
                            <span className="text-muted-foreground">
                              {refRange.min !== null && refRange.max !== null
                                ? `${refRange.min} ~ ${refRange.max}`
                                : refRange.min !== null
                                  ? `≥ ${refRange.min}`
                                  : refRange.max !== null
                                    ? `≤ ${refRange.max}`
                                    : ""}
                              {METRIC_DEFINITIONS[metric].unit &&
                                ` ${METRIC_DEFINITIONS[metric].unit}`}
                            </span>
                          </div>
                        )}
                        {/* 경고 영역 표시 */}
                        {hasReferenceRange && (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded border-2 border-red-500/60 shadow-sm"
                              style={{
                                backgroundImage: `repeating-linear-gradient(
                                  -45deg,
                                  hsl(0, 100%, 70%, 0.3),
                                  hsl(0, 100%, 70%, 0.3) 3px,
                                  transparent 3px,
                                  transparent 6px
                                )`,
                              }}
                            />
                            <span className="text-foreground font-medium">
                              경고 영역
                            </span>
                            <span className="text-muted-foreground">
                              (
                              {refRange.min !== null && refRange.max !== null
                                ? "범위 밖"
                                : refRange.min !== null
                                  ? "최소값 미만"
                                  : refRange.max !== null
                                    ? "최대값 초과"
                                    : ""}
                              )
                            </span>
                          </div>
                        )}
                      </div>
                      <ChartContainer config={formatChartConfig([metric])}>
                        <ComposedChart
                          accessibilityLayer
                          data={chartDataWithTimestamps}
                          margin={{
                            left: 16,
                            right: 24,
                            top: 16,
                            bottom: 16,
                          }}
                        >
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            strokeWidth={1.5}
                            opacity={0.4}
                          />
                          <XAxis
                            dataKey="dateTimestamp"
                            type="number"
                            scale="time"
                            domain={[
                              (dataMin: number) => {
                                // 최소값에서 약간의 여백을 주기 위해 하루 전으로 설정
                                const minDate = new Date(dataMin);
                                const timeRange =
                                  chartDataWithTimestamps.length > 1
                                    ? chartDataWithTimestamps[
                                        chartDataWithTimestamps.length - 1
                                      ].dateTimestamp -
                                      chartDataWithTimestamps[0].dateTimestamp
                                    : 86400000; // 기본값: 1일
                                const padding =
                                  timeRange /
                                  (chartDataWithTimestamps.length * 2);
                                return dataMin - padding;
                              },
                              (dataMax: number) => {
                                // 최대값에서 약간의 여백을 주기 위해 하루 후로 설정
                                const timeRange =
                                  chartDataWithTimestamps.length > 1
                                    ? chartDataWithTimestamps[
                                        chartDataWithTimestamps.length - 1
                                      ].dateTimestamp -
                                      chartDataWithTimestamps[0].dateTimestamp
                                    : 86400000; // 기본값: 1일
                                const padding =
                                  timeRange /
                                  (chartDataWithTimestamps.length * 2);
                                return dataMax + padding;
                              },
                            ]}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return date.toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                              });
                            }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            domain={yDomain}
                            tickFormatter={(value) => {
                              // 소수점 2자리까지 표시
                              return Number(value).toFixed(2);
                            }}
                          />
                          {hasReferenceRange && (
                            <>
                              {/* 범위 밖 위쪽 영역 (밝은 빗살무늬 빨간색) */}
                              {refRange.max !== null &&
                                (yDomain[1] as number) > refRange.max && (
                                  <ReferenceArea
                                    y1={refRange.max}
                                    y2={yDomain[1] as number}
                                    fill={`url(#warning-pattern-upper-${metric})`}
                                    stroke="hsl(0, 100%, 65%)"
                                    strokeWidth={2}
                                    strokeOpacity={0.5}
                                    strokeDasharray="4 4"
                                  />
                                )}
                              {/* 범위 밖 아래쪽 영역 (밝은 빗살무늬 빨간색) */}
                              {refRange.min !== null &&
                                (yDomain[0] as number) < refRange.min && (
                                  <ReferenceArea
                                    y1={yDomain[0] as number}
                                    y2={refRange.min}
                                    fill={`url(#warning-pattern-lower-${metric})`}
                                    stroke="hsl(0, 100%, 65%)"
                                    strokeWidth={2}
                                    strokeOpacity={0.5}
                                    strokeDasharray="4 4"
                                  />
                                )}
                            </>
                          )}
                          <Line
                            dataKey={metric}
                            type="monotone"
                            stroke={brightenColor(
                              METRIC_DEFINITIONS[metric].color,
                              25,
                            )}
                            strokeWidth={3.5}
                            filter="url(#neon-glow-strong)"
                            // 모든 데이터 포인트에 점 표시 (neon 스타일)
                            dot={{
                              r: 6,
                              strokeWidth: 3,
                              stroke: "#fff",
                              fill: brightenColor(
                                METRIC_DEFINITIONS[metric].color,
                                20,
                              ),
                              filter: "url(#neon-glow)",
                            }}
                            activeDot={{
                              r: 9,
                              strokeWidth: 3.5,
                              stroke: "#fff",
                              fill: brightenColor(
                                METRIC_DEFINITIONS[metric].color,
                                25,
                              ),
                              filter: "url(#neon-glow)",
                            }}
                            // null 값이 있어도 선이 연결되도록 설정
                            connectNulls={true}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                          />
                        </ComposedChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                );
              })}
              {group.length === 1 && <div className="hidden lg:block" />}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>검사 데이터 없음</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              아직 차트를 그릴 수 있는 검사 데이터가 없습니다.{" "}
              <Link to="/my/dashboard/health/consent" className="underline">
                신규 검사 결과를 입력해주세요.
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
