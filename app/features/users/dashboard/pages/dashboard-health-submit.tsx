import type { Route } from "./+types/dashboard-health-submit";

import { useState } from "react";
import { Form, redirect, useSearchParams } from "react-router";
import { z } from "zod";

import InputPair from "~/core/components/input-pair";
import SelectPair from "~/core/components/select-pair";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "혈액검사 수치 입력 | Evidence Base" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  const { data: patientProfile, error } = await client
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
    console.error("Failed to load patient profile:", error);
  }

  return {
    patientProfile: patientProfile ?? null,
  };
};

const patientProfileSchemaBase = z.object({
  age: z
    .string()
    .min(1, "나이를 입력해주세요")
    .refine((value) => Number(value) > 0, {
      message: "나이는 0보다 커야 합니다",
    }),
  gender: z.enum(["M", "F"], { message: "성별을 선택해주세요" }),
  disease: z.string().min(1, "질환명을 입력해주세요"),
  diseaseStatus: z.string().min(1, "질환 상태를 입력해주세요"),
  treatmentStatus: z.enum(["ongoing", "completed", "follow_up"], {
    message: "치료 상태를 선택해주세요",
  }),
  medicationStatus: z.enum(["none", "active"], {
    message: "약물 복용 상태를 선택해주세요",
  }),
  medicationName: z.string().optional(),
  heightCm: z
    .string()
    .min(1, "키를 입력해주세요")
    .refine((value) => Number(value) > 0, {
      message: "키는 0보다 커야 합니다",
    }),
  weightKg: z
    .string()
    .min(1, "몸무게를 입력해주세요")
    .refine((value) => Number(value) > 0, {
      message: "몸무게는 0보다 커야 합니다",
    }),
});

const healthSubmitSchema = patientProfileSchemaBase
  .extend({
    lmr: z.string().optional(),
    nlr: z.string().optional(),
    platelet: z.string().optional(),
    crp: z.string().optional(),
    glucose: z.string().optional(),
    hgbA1c: z.string().optional(),
    cholesterol: z.string().optional(),
    ldh: z.string().optional(),
    ast: z.string().optional(),
    alt: z.string().optional(),
    egfr: z.string().optional(),
    vitaminD3: z.string().optional(),
    tumorMarker: z.string().optional(),
    testDate: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.medicationStatus === "active" &&
      (!value.medicationName || value.medicationName.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "복용 중인 경우 약물 이름을 입력해주세요",
        path: ["medicationName"],
      });
    }
  });

const TREATMENT_STATUS_OPTIONS = [
  { label: "치료 중", value: "ongoing" },
  { label: "치료 완료", value: "completed" },
  { label: "경과 관찰", value: "follow_up" },
] as const;

const MEDICATION_STATUS_OPTIONS = [
  { label: "복용 안 함", value: "none" },
  { label: "복용 중", value: "active" },
] as const;

const METRIC_DEFINITIONS = {
  lmr: { standardName: "lmr", unit: "" },
  nlr: { standardName: "nlr", unit: "" },
  platelet: { standardName: "platelet", unit: "10^3/µL" },
  crp: { standardName: "crp", unit: "mg/dL" },
  glucose: { standardName: "glucose", unit: "mg/dL" },
  hgbA1c: { standardName: "hgba1c", unit: "%" },
  cholesterol: { standardName: "cholesterol", unit: "mg/dL" },
  ldh: { standardName: "ldh", unit: "U/L" },
  ast: { standardName: "ast", unit: "U/L" },
  alt: { standardName: "alt", unit: "U/L" },
  egfr: { standardName: "egfr", unit: "mL/min/1.73m2" },
  vitaminD3: { standardName: "vitamin_d3", unit: "ng/mL" },
  tumorMarker: { standardName: "tumor_marker", unit: "ng/mL" },
} as const;

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const normalizedEntries = Array.from(formData.entries()).map(
    ([key, value]) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return [key, trimmed === "" ? undefined : trimmed];
      }
      return [key, value];
    },
  );
  const normalizedData = Object.fromEntries(normalizedEntries);
  const { success, error, data } = healthSubmitSchema.safeParse(normalizedData);

  if (!success) {
    return { fieldErrors: error.flatten().fieldErrors };
  }

  const [client, headers] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  const {
    age,
    gender,
    disease,
    diseaseStatus,
    treatmentStatus,
    medicationStatus,
    medicationName,
    heightCm,
    weightKg,
    testDate,
    ...metrics
  } = data;

  const patientPayload = {
    patient_id: userId,
    age: Number(age),
    gender,
    disease,
    disease_status: diseaseStatus,
    treatment_status: treatmentStatus,
    medication_status: medicationStatus,
    medication_name:
      medicationStatus === "active" ? (medicationName ?? "") : null,
    height_cm: Number(heightCm),
    weight_kg: Number(weightKg),
  };

  const { error: upsertProfileError } = await client
    .from("patient_health_profiles")
    .upsert(patientPayload, { onConflict: "patient_id" });

  if (upsertProfileError) {
    console.error("Failed to upsert patient profile:", upsertProfileError);
    return {
      formErrors: {
        profile: [upsertProfileError.message],
      },
    };
  }

  const metricEntries = Object.entries(METRIC_DEFINITIONS);
  const metricsWithValues: Array<{
    field: string;
    standardName: string;
    unit: string;
    numericValue: number;
  }> = [];

  const fieldErrors: Record<string, string[]> = {};

  metricEntries.forEach(([field, definition]) => {
    const value = metrics[field as keyof typeof metrics];
    if (value === undefined) {
      return;
    }
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      fieldErrors[field] = ["숫자 형태로 입력해주세요"];
      return;
    }
    metricsWithValues.push({
      field,
      standardName: definition.standardName,
      unit: definition.unit,
      numericValue,
    });
  });

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  if (metricsWithValues.length === 0) {
    return redirect("/my/dashboard/health", { headers });
  }

  if (!testDate) {
    return {
      fieldErrors: {
        testDate: ["검사 날짜를 입력해주세요"],
      },
    };
  }

  const standardNames = metricsWithValues.map((item) => item.standardName);

  const { data: existingTypes, error: fetchTypesError } = await client
    .from("blood_test_types")
    .select("test_id, standard_name")
    .in("standard_name", standardNames);

  if (fetchTypesError) {
    console.error("Failed to fetch blood test types:", fetchTypesError);
    return {
      formErrors: {
        tests: [fetchTypesError.message],
      },
    };
  }

  const typeMap = new Map<string, number>();
  existingTypes?.forEach((type) =>
    typeMap.set(type.standard_name, type.test_id),
  );

  const missingStandardNames = standardNames.filter(
    (name) => !typeMap.has(name),
  );

  if (missingStandardNames.length > 0) {
    const { data: insertedTypes, error: insertTypesError } = await client
      .from("blood_test_types")
      .insert(
        missingStandardNames.map((name) => ({
          standard_name: name,
          unit: metricsWithValues.find((item) => item.standardName === name)
            ?.unit,
        })),
      )
      .select("test_id, standard_name");

    if (insertTypesError) {
      console.error("Failed to insert blood test types:", insertTypesError);
      return {
        formErrors: {
          tests: [insertTypesError.message],
        },
      };
    }

    insertedTypes?.forEach((type) =>
      typeMap.set(type.standard_name, type.test_id),
    );
  }

  const resultPayload = metricsWithValues.map((item) => {
    const testId = typeMap.get(item.standardName);
    if (!testId) {
      throw new Error(
        `혈액검사 항목이 설정되지 않았습니다: ${item.standardName}`,
      );
    }
    return {
      patient_id: userId,
      test_id: testId,
      result_value: item.numericValue,
      result_unit: item.unit || null,
      test_date: testDate,
    };
  });

  const { error: insertResultsError } = await client
    .from("blood_test_results")
    .insert(resultPayload);

  if (insertResultsError) {
    console.error("Failed to insert blood test results:", insertResultsError);
    return {
      formErrors: {
        results: [insertResultsError.message],
      },
    };
  }

  return redirect("/my/dashboard/health", { headers });
};

export default function DashboardHealthSubmit({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const patientProfile = loaderData?.patientProfile;
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const hasConsent = searchParams.get("consent") === "success";

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);

    // TODO: Google OCR API 호출 로직 구현
    // 실제 구현에서는 Google Cloud Vision API를 사용
    setTimeout(() => {
      setIsOcrProcessing(false);
      // OCR 결과를 폼에 자동 입력하는 로직
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">혈액검사 수치 입력</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          뒤로가기
        </Button>
      </div>

      {/* 동의 확인 메시지는 동의 페이지에서 온 경우에만 표시 */}
      {hasConsent && (
        <Card>
          <CardHeader>
            <CardTitle>의료정보 제공 동의 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>✅ 의료정보 제공에 동의하셨습니다.</p>
              <p>이제 혈액검사 결과를 안전하게 입력할 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>검사 결과 사진 업로드 (OCR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
                disabled={isOcrProcessing}
              />
              {isOcrProcessing && (
                <div className="text-muted-foreground text-sm">
                  OCR 처리 중...
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              혈액검사 결과 사진을 업로드하면 자동으로 수치를 인식합니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <Form method="post" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>환자 기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputPair
                label="나이"
                name="age"
                description="현재 환자의 만 나이"
                type="number"
                placeholder="예: 45"
                required
                defaultValue={
                  patientProfile?.age !== undefined
                    ? String(patientProfile.age)
                    : undefined
                }
              />
              <SelectPair
                label="성별"
                name="gender"
                description="환자의 성별을 선택해주세요"
                placeholder="성별을 선택해주세요"
                required
                defaultValue={patientProfile?.gender ?? undefined}
                options={[
                  { label: "남성", value: "M" },
                  { label: "여성", value: "F" },
                ]}
              />
              <InputPair
                label="질환명"
                name="disease"
                description="현재 치료 중인 주요 질환"
                placeholder="예: 당뇨병"
                required
                defaultValue={patientProfile?.disease ?? undefined}
              />
              <InputPair
                label="질환 상태"
                name="diseaseStatus"
                description="현재 질환의 상태를 입력해주세요"
                placeholder="예: 혈당 조절 중"
                required
                defaultValue={patientProfile?.disease_status ?? undefined}
              />
              <SelectPair
                label="치료 상태"
                name="treatmentStatus"
                description="현재 치료 진행 상황"
                placeholder="치료 상태를 선택해주세요"
                required
                defaultValue={patientProfile?.treatment_status ?? undefined}
                options={TREATMENT_STATUS_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
              <SelectPair
                label="약물 복용 상태"
                name="medicationStatus"
                description="현재 약물 복용 여부"
                placeholder="약물 복용 상태를 선택해주세요"
                required
                defaultValue={patientProfile?.medication_status ?? undefined}
                options={MEDICATION_STATUS_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
              <InputPair
                label="복용 약물 이름"
                name="medicationName"
                description="복용 중인 약물 이름 (복용 중인 경우 필수)"
                placeholder="예: 메트포르민"
                defaultValue={patientProfile?.medication_name ?? undefined}
              />
              <InputPair
                label="키 (cm)"
                name="heightCm"
                description="현재 키 (cm 단위)"
                type="number"
                step="0.1"
                placeholder="예: 170"
                required
                defaultValue={
                  patientProfile?.height_cm !== undefined
                    ? String(patientProfile.height_cm)
                    : undefined
                }
              />
              <InputPair
                label="몸무게 (kg)"
                name="weightKg"
                description="현재 몸무게 (kg 단위)"
                type="number"
                step="0.1"
                placeholder="예: 65"
                required
                defaultValue={
                  patientProfile?.weight_kg !== undefined
                    ? String(patientProfile.weight_kg)
                    : undefined
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>수동 입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputPair
                label="LMR"
                name="lmr"
                description="림프구 대 단핵구 비율"
                type="number"
                step="0.01"
                placeholder="예: 2.5"
              />
              <InputPair
                label="NLR"
                name="nlr"
                description="호중구 대 림프구 비율"
                type="number"
                step="0.01"
                placeholder="예: 1.8"
              />
              <InputPair
                label="Platelet"
                name="platelet"
                description="혈소판 수"
                type="number"
                placeholder="예: 250"
              />
              <InputPair
                label="CRP"
                name="crp"
                description="C-반응성 단백질"
                type="number"
                step="0.01"
                placeholder="예: 0.5"
              />
              <InputPair
                label="Glucose"
                name="glucose"
                description="혈당 수치"
                type="number"
                placeholder="예: 95"
              />
              <InputPair
                label="HgbA1c"
                name="hgbA1c"
                description="당화혈색소"
                type="number"
                step="0.1"
                placeholder="예: 5.7"
              />
              <InputPair
                label="Cholesterol"
                name="cholesterol"
                description="총 콜레스테롤"
                type="number"
                placeholder="예: 180"
              />
              <InputPair
                label="LDH"
                name="ldh"
                description="젖산탈수소효소"
                type="number"
                placeholder="예: 140"
              />
              <InputPair
                label="AST"
                name="ast"
                description="아스파르테이트 아미노전이효소"
                type="number"
                placeholder="예: 25"
              />
              <InputPair
                label="ALT"
                name="alt"
                description="알라닌 아미노전이효소"
                type="number"
                placeholder="예: 30"
              />
              <InputPair
                label="eGFR"
                name="egfr"
                description="추정 사구체 여과율"
                type="number"
                placeholder="예: 90"
              />
              <InputPair
                label="Vitamin D3"
                name="vitaminD3"
                description="비타민 D3 수치"
                type="number"
                step="0.1"
                placeholder="예: 25.0"
              />
              <InputPair
                label="Tumor Marker"
                name="tumorMarker"
                description="종양 표지자"
                type="number"
                step="0.01"
                placeholder="예: 2.5"
              />
            </div>

            <InputPair
              label="검사 날짜"
              name="testDate"
              description="혈액검사를 받은 날짜"
              type="date"
            />
          </CardContent>
        </Card>

        {actionData &&
          typeof actionData === "object" &&
          actionData !== null &&
          "fieldErrors" in actionData && (
            <div className="space-y-2 text-red-500">
              {Object.entries((actionData as any).fieldErrors || {}).map(
                ([field, errors]: [string, any]) => (
                  <div key={field}>
                    {field}:{" "}
                    {Array.isArray(errors) ? errors.join(", ") : String(errors)}
                  </div>
                ),
              )}
            </div>
          )}

        {actionData &&
          typeof actionData === "object" &&
          actionData !== null &&
          "formErrors" in actionData &&
          actionData.formErrors && (
            <div className="space-y-2 text-red-500">
              {Object.entries(
                actionData.formErrors as unknown as Record<
                  string,
                  string[] | undefined
                >,
              ).flatMap(([field, errors]) =>
                (errors ?? []).map((message, index) => (
                  <div key={`${field}-${index}`}>
                    {field}: {message}
                  </div>
                )),
              )}
            </div>
          )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            취소
          </Button>
          <Button type="submit">저장하기</Button>
        </div>
      </Form>
    </div>
  );
}
