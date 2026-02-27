import type { Route } from "./+types/dashboard-health-submit";

import { Loader2Icon, UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, data as jsonData, redirect, useFetcher, useSearchParams } from "react-router";
import { z } from "zod";

import InputPair from "~/core/components/input-pair";
import SelectPair from "~/core/components/select-pair";
import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient from "~/core/lib/supa-client.server";
import { normalizeStandardName } from "~/features/users/dashboard/constants";
import {
  appendMedicalRecordTranscript,
  insertBloodTestResults,
  updateBloodTestImageTestDate,
  upsertBloodTestImage,
  upsertPatientHealthProfile,
} from "~/features/users/dashboard/mutations";
import {
  METRIC_DISPLAY_ORDER,
  METRIC_DEFINITIONS as QUERY_METRIC_DEFINITIONS,
  TUMOR_MARKER_TYPES,
  getBloodTestImageByHash,
  getBloodTestResultsByImageId,
  getBloodTestTypesByStandardNames,
  getPatientHealthProfile,
} from "~/features/users/dashboard/queries";
import { getLoggedInUserId } from "~/features/users/queries";

// 혈액검사 필드 타입 정의
type MetricField =
  | "lmr"
  | "nlr"
  | "platelet"
  | "crp"
  | "glucose"
  | "hgbA1c"
  | "cholesterol"
  | "ldh"
  | "ast"
  | "alt"
  | "egfr"
  | "vitaminD3";

export const meta: Route.MetaFunction = () => {
  return [{ title: "혈액검사 수치 입력 | Evidence Base" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  let patientProfile = null;
  try {
    patientProfile = await getPatientHealthProfile(client, userId);
  } catch (error) {
    console.error("Failed to load patient profile:", error);
  }

  return {
    patientProfile,
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
    testDate: z.string().min(1, "검사 날짜를 입력해주세요"),
  })
  .superRefine((value, ctx) => {
    if (value.medicationStatus === "active" && (!value.medicationName || value.medicationName.trim().length === 0)) {
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

// 입력 폼용 메트릭 정의 (queries.ts의 METRIC_DEFINITIONS와 매핑)
// standardName은 소문자로 정규화하여 사용 (데이터베이스와 일치)
const INPUT_METRIC_DEFINITIONS = {
  lmr: { standardName: "lmr", unit: "", label: "림프구 대비 단핵구 비율", englishName: "LMR" },
  nlr: { standardName: "nlr", unit: "", label: "호중구 대비 림프구 비율", englishName: "NLR" },
  platelet: { standardName: "platelet", unit: "10^3/µL", label: "혈소판", englishName: "Platelet" },
  crp: { standardName: "crp", unit: "mg/dL", label: "C 반응성 단백질", englishName: "CRP" },
  glucose: { standardName: "glucose", unit: "mg/dL", label: "혈당", englishName: "Glucose" },
  hgbA1c: { standardName: "hgba1c", unit: "%", label: "당화혈색소", englishName: "HbA1c" },
  cholesterol: { standardName: "cholesterol", unit: "mg/dL", label: "총 콜레스테롤", englishName: "Cholesterol" },
  ldh: { standardName: "ldh", unit: "U/L", label: "젖산탈수소효소", englishName: "LDH" },
  ast: { standardName: "ast", unit: "U/L", label: "아스파르테이트 아미노전달효소", englishName: "AST" },
  alt: { standardName: "alt", unit: "U/L", label: "알라닌 아미노전달달효소", englishName: "ALT" },
  egfr: { standardName: "egfr", unit: "mL/min/1.73m2", label: "추정 사구체 여과율", englishName: "eGFR" },
  vitaminD3: { standardName: "vitamin_d3", unit: "ng/mL", label: "Vitamin D3", englishName: "Vitamin D3" },
} as const;

// 추가 OCR 항목 정의 (기본 입력 항목 이외의 OCR 추출 가능 항목)
const ADDITIONAL_OCR_METRICS = {
  wbc: { standardName: "wbc", unit: "10^3/µL", label: "백혈구", englishName: "WBC" },
  rbc: { standardName: "rbc", unit: "10^6/µL", label: "적혈구", englishName: "RBC" },
  hgb: { standardName: "hgb", unit: "g/dL", label: "헤모글로빈", englishName: "HGB" },
  hct: { standardName: "hct", unit: "%", label: "헤마토크릿", englishName: "HCT" },
  mcv: { standardName: "mcv", unit: "fL", label: "평균적혈구용적", englishName: "MCV" },
  mchc: { standardName: "mchc", unit: "g/dL", label: "평균적혈구혈색소농도", englishName: "MCHC" },
  rdw: { standardName: "rdw", unit: "%", label: "적혈구분포폭", englishName: "RDW" },
  pdw: { standardName: "pdw", unit: "fL", label: "혈소판분포폭", englishName: "PDW" },
  neutrophil: { standardName: "neutrophil", unit: "%", label: "호중구", englishName: "Neutrophil" },
  lymphocyte: { standardName: "lymphocyte", unit: "%", label: "림프구", englishName: "Lymphocyte" },
  monocyte: { standardName: "monocyte", unit: "%", label: "단핵구", englishName: "Monocyte" },
  eosinophil: { standardName: "eosinophil", unit: "%", label: "호산구", englishName: "Eosinophil" },
  basophil: { standardName: "basophil", unit: "%", label: "호염구", englishName: "Basophil" },
  totalBilirubin: {
    standardName: "total_bilirubin",
    unit: "mg/dL",
    label: "총 빌리루빈",
    englishName: "Total Bilirubin",
  },
  gtp: { standardName: "gtp", unit: "U/L", label: "감마지티피", englishName: "GTP" },
  bun: { standardName: "bun", unit: "mg/dL", label: "혈중요소질소", englishName: "BUN" },
  creatinine: { standardName: "creatinine", unit: "mg/dL", label: "크레아티닌", englishName: "Creatinine" },
  uricAcid: { standardName: "uric_acid", unit: "mg/dL", label: "요산", englishName: "Uric Acid" },
  triglyceride: { standardName: "triglyceride", unit: "mg/dL", label: "중성지방", englishName: "Triglyceride" },
  hdl: { standardName: "hdl", unit: "mg/dL", label: "HDL 콜레스테롤", englishName: "HDL" },
  ldl: { standardName: "ldl", unit: "mg/dL", label: "LDL 콜레스테롤", englishName: "LDL" },
  freeT3: { standardName: "free_t3", unit: "pg/mL", label: "자유 T3", englishName: "Free T3" },
  freeT4: { standardName: "free_t4", unit: "ng/dL", label: "자유 T4", englishName: "Free T4" },
  tsh: { standardName: "tsh", unit: "µIU/mL", label: "갑상선자극호르몬", englishName: "TSH" },
  homocysteine: { standardName: "homocysteine", unit: "µmol/L", label: "호모시스테인", englishName: "Homocysteine" },
  cholesterol: { standardName: "cholesterol", unit: "mg/dL", label: "총 콜레스테롤", englishName: "Total Cholesterol" },
} as const;

// LMR과 NLR 계산 헬퍼 함수 (OCR 결과에서 자동 계산하지 않음, 수동 입력만 가능)
function calculateLMRAndNLR(structured: Record<string, string>): Record<string, string> {
  // OCR 결과에서 LMR/NLR을 자동으로 계산하지 않음
  // 사용자가 수동으로 입력하거나, 검사 결과 요약에서 계산됨
  return structured;
}

// ---------------------
// ACTION
// ---------------------
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("_intent");

  // 🔹 0) 의무기록 저장 브랜치
  if (intent === "save_medical_record") {
    try {
      const [client] = makeServerClient(request);
      const userId = await getLoggedInUserId(client);

      const profile = await getPatientHealthProfile(client, userId);
      if (!profile) {
        return jsonData(
          { error: "환자 기본 정보가 없습니다. 검사 항목에서 혈액검사를 선택해 기본 정보를 먼저 입력·저장한 뒤 의무기록을 추가해주세요." },
          { status: 400 },
        );
      }

      const testDate = formData.get("testDate")?.toString();
      const testContent = formData.get("testContent")?.toString() ?? "";
      const clinicalInformation = formData.get("clinicalInformation")?.toString() ?? "";
      const finding = formData.get("finding")?.toString() ?? "";
      const conclusion = formData.get("conclusion")?.toString() ?? "";

      if (!testDate || !testContent.trim()) {
        return jsonData(
          { error: "검사 날짜와 검사내용을 입력해주세요." },
          { status: 400 },
        );
      }

      await appendMedicalRecordTranscript(client, {
        patientId: userId,
        entry: {
          test_date: testDate,
          test_content: testContent.trim(),
          clinical_information: clinicalInformation.trim(),
          finding: finding.trim(),
          conclusion: conclusion.trim(),
        },
      });
      return jsonData({ success: true });
    } catch (err) {
      console.error("save_medical_record error:", err);
      return jsonData(
        {
          error:
            err instanceof Error ? err.message : "의무기록 저장에 실패했습니다.",
        },
        { status: 500 },
      );
    }
  }

  // 🔹 1) OCR 전용 요청 브랜치 (결과만 반환, DB 저장 안 함)
  if (intent === "ocr" || intent === "ocr_medical_record") {
    try {
      const [client] = makeServerClient(request);

      let userId: string;
      try {
        userId = await getLoggedInUserId(client);
      } catch (authError) {
        console.error("Authentication error in OCR action:", authError);
        return jsonData({ error: "인증이 필요합니다. 다시 로그인해주세요." }, { status: 401 });
      }

      const file = formData.get("file") as File | null;
      const imageHash = formData.get("imageHash")?.toString();
      const userTestDate = formData.get("testDate")?.toString(); // 사용자가 입력한 검사 날짜

      if (!file) {
        return jsonData({ error: "파일이 필요합니다." }, { status: 400 });
      }

      if (!file.type.startsWith("image/")) {
        return jsonData({ error: "이미지 파일만 업로드 가능합니다." }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) {
        return jsonData({ error: "파일 크기는 10MB 이하여야 합니다." }, { status: 400 });
      }

      // 🔹 해시 기반 캐시 확인 (Edge Function 호출 전에 먼저 확인)
      // 동일한 hash가 있으면 OCR/OpenAI를 거치지 않고 기존 데이터 반환
      if (imageHash) {
        console.log("🔹 [Server Action] 캐시 확인 시작");
        console.log("  - imageHash:", imageHash);
        console.log("  - patientId:", userId);
        try {
          const existingImage = await getBloodTestImageByHash(client, {
            patientId: userId,
            imageHash,
          });

          console.log(
            "  - existingImage:",
            existingImage ? `found (image_id: ${existingImage.image_id})` : "not found",
          );

          if (existingImage) {
            console.log("✅ [Server Action] 기존 이미지 발견, image_id:", existingImage.image_id);

            const allResults = await getBloodTestResultsByImageId(client, {
              patientId: userId,
              imageId: existingImage.image_id,
            });

            console.log("  - allResults:", allResults ? `found (${allResults.length} items)` : "not found");

            if (allResults && allResults.length > 0) {
              console.log("✅ [Server Action] 캐시된 결과 발견, 개수:", allResults.length);

              const testDate = existingImage.test_date || "";

              // Edge Function과 동일한 구조로 모든 필드 초기화
              const structured: Record<string, string> = {
                wbc: "",
                rbc: "",
                hgb: "",
                hct: "",
                mcv: "",
                mchc: "",
                platelet: "",
                rdw: "",
                pdw: "",
                neutrophil: "",
                lymphocyte: "",
                monocyte: "",
                eosinophil: "",
                basophil: "",
                totalBilirubin: "",
                ast: "",
                alt: "",
                gtp: "",
                bun: "",
                creatinine: "",
                egfr: "",
                uricAcid: "",
                glucose: "",
                triglyceride: "",
                hdl: "",
                ldl: "",
                freeT3: "",
                freeT4: "",
                tsh: "",
                homocysteine: "",
                vitaminD: "",
                hgbA1c: "",
                scc: "",
                cea: "",
                ca199: "",
                ca125: "",
                ca153: "",
                psa: "",
                afp: "",
                ca724: "",
                nse: "",
                lmr: "",
                nlr: "",
                crp: "",
                cholesterol: "",
                ldh: "",
                testDate: testDate,
              };

              // standard_name -> structured 필드명 매핑
              // queries.ts의 METRIC_DEFINITIONS 키와 일치하도록 매핑
              const standardNameMap: Record<string, string> = {
                wbc: "wbc",
                rbc: "rbc",
                hgb: "hgb",
                hct: "hct",
                mcv: "mcv",
                mchc: "mchc",
                platelet: "platelet",
                rdw: "rdw",
                pdw: "pdw",
                neutrophil: "neutrophil",
                lymphocyte: "lymphocyte",
                monocyte: "monocyte",
                eosinophil: "eosinophil",
                basophil: "basophil",
                total_bilirubin: "totalBilirubin",
                ast: "ast",
                alt: "alt",
                gtp: "gtp",
                bun: "bun",
                creatinine: "creatinine",
                egfr: "egfr",
                uric_acid: "uricAcid",
                glucose: "glucose",
                triglyceride: "triglyceride",
                hdl: "hdl",
                ldl: "ldl",
                free_t3: "freeT3",
                free_t4: "freeT4",
                tsh: "tsh",
                homocysteine: "homocysteine",
                vitamin_d: "vitaminD",
                vitamin_d3: "vitaminD",
                hgba1c: "hgbA1c",
                scc: "scc",
                cea: "cea",
                ca199: "ca199",
                ca125: "ca125",
                ca153: "ca153",
                psa: "psa",
                afp: "afp",
                ca724: "ca724",
                nse: "nse",
                lmr: "lmr",
                nlr: "nlr",
                crp: "crp",
                cholesterol: "cholesterol",
                ldh: "ldh",
                // 종양표지자 매핑
                tumor_marker_cea: "cea",
                tumor_marker_ca199: "ca199",
                tumor_marker_ca125: "ca125",
                tumor_marker_ca153: "ca153",
                tumor_marker_psa: "psa",
                tumor_marker_afp: "afp",
                tumor_marker_ca724: "ca724",
                tumor_marker_nse: "nse",
                tumor_marker_scc: "scc",
              };

              // standard_name을 정규화하여 매핑
              for (const result of allResults) {
                const standardName = result.blood_test_types?.standard_name;
                if (standardName) {
                  const normalizedName = normalizeStandardName(standardName);
                  const fieldName = standardNameMap[normalizedName];
                  if (fieldName) {
                    structured[fieldName] = String(result.result_value ?? "");
                  }
                }
              }

              console.log("✅ [Server Action] 캐시된 데이터 반환 (OCR/OpenAI 건너뜀)");
              return jsonData({
                structured,
                cached: true,
              });
            } else {
              console.log("⚠️ [Server Action] 이미지는 있지만 결과 데이터가 없음, OCR 진행");
            }
          } else {
            console.log("⚠️ [Server Action] 캐시된 이미지 없음, OCR 진행");
          }
        } catch (cacheError) {
          // 캐시 관련 에러는 로깅만 하고, OCR 계속 진행
          console.error("❌ [Server Action] Cache lookup error:", cacheError);
        }
      } else {
        console.log("⚠️ [Server Action] imageHash가 없어 캐시 확인 건너뜀");
      }

      // 캐시가 없으면 Edge Function 호출 (OCR + OpenAI)
      // Edge Function에서도 캐시 확인을 하므로, 여기서는 무조건 호출
      // 파일 → Base64 (Edge Function에 전달)
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      // 세션 가져오기
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData.session?.access_token) {
        return jsonData({ error: "세션을 가져올 수 없습니다." }, { status: 401 });
      }

      const supabaseUrl = process.env.SUPABASE_URL;
      if (!supabaseUrl) {
        console.error("SUPABASE_URL is not set in environment");
        return jsonData({ error: "서버 설정 오류(SUPABASE_URL 누락)" }, { status: 500 });
      }

      // Supabase Edge Function 호출 (ocr_gpt)
      // Edge Function 이름이 'ocr_gpt'이므로 URL에 정확히 맞춰야 함
      console.log("🔹 [Server Action] Edge Function 호출 시작");
      console.log("URL:", `${supabaseUrl}/functions/v1/ocr_gpt`);
      console.log("Image hash:", imageHash);
      console.log("Base64 길이:", base64.length);

      const isMedicalRecord = intent === "ocr_medical_record";
      const ocrRes = await fetch(`${supabaseUrl}/functions/v1/ocr_gpt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          imageBase64: base64,
          imageHash: imageHash,
          userId: userId,
          documentType: isMedicalRecord ? "medical_record" : "blood_test",
        }),
      });

      console.log("🔹 [Server Action] Edge Function 응답 받음");
      console.log("Response status:", ocrRes.status);
      console.log("Response ok:", ocrRes.ok);
      console.log("Response headers:", Object.fromEntries(ocrRes.headers.entries()));

      if (!ocrRes.ok) {
        const errorText = await ocrRes.text();
        console.error("❌ [Server Action] Edge Function 에러 응답");
        console.error("Error status:", ocrRes.status);
        console.error("Error text:", errorText);
        let errorMessage = "OCR 처리에 실패했습니다.";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
          console.error("Error JSON:", errorJson);
        } catch {
          errorMessage = errorText || errorMessage;
        }
        return jsonData({ error: errorMessage }, { status: ocrRes.status || 500 });
      }

      let ocrJson: any;
      try {
        ocrJson = await ocrRes.json();
      } catch (parseError) {
        console.error("❌ [Server Action] Edge Function 응답 JSON 파싱 실패:", parseError);
        return jsonData({ error: "Edge Function 응답을 파싱할 수 없습니다." }, { status: 500 });
      }

      if (ocrJson.error) {
        console.error("❌ [Server Action] OCR JSON에 error 필드 존재");
        console.error("Error:", ocrJson.error);
        return jsonData({ error: ocrJson.error }, { status: 500 });
      }

      // 🔹 의무기록 OCR: medicalRecord 또는 structured에서 추출
      if (isMedicalRecord) {
        const src = ocrJson.medicalRecord ?? ocrJson.structured ?? {};
        const medicalRecord = {
          test_content: String(src.test_content ?? src.testContent ?? "").trim(),
          clinical_information: String(src.clinical_information ?? src.clinicalInformation ?? "").trim(),
          finding: String(src.finding ?? "").trim(),
          conclusion: String(src.conclusion ?? "").trim(),
          testDate: userTestDate || String(src.testDate ?? src.test_date ?? "").trim(),
        };
        return jsonData({
          medicalRecord,
          documentType: "medical_record",
        });
      }

      // Edge Function에서 캐시된 데이터를 반환한 경우 (혈액검사)
      if (ocrJson.cached && ocrJson.structured) {
        console.log("✅ [Server Action] Edge Function에서 캐시된 데이터 반환");
        return jsonData({
          structured: ocrJson.structured,
          cached: true,
        });
      }

      console.log("🔹 [Server Action] structured 필드 확인");
      console.log("structured 존재:", "structured" in ocrJson);
      console.log("structured 값:", ocrJson.structured);
      console.log("structured 타입:", typeof ocrJson.structured);

      if (!ocrJson.structured) {
        console.error("❌ [Server Action] structured 필드가 없습니다!");
        console.error("OCR JSON:", JSON.stringify(ocrJson, null, 2));
        return jsonData({ error: "OCR 결과에 structured 데이터가 없습니다." }, { status: 500 });
      }

      // 🔹 이미지를 Storage에 업로드하고 blood_test_images에 저장 (혈액검사만)
      console.log("🔹 [Server Action] 이미지 Storage 업로드 및 메타데이터 저장 시작");

      if (!imageHash) {
        console.warn("⚠️ [Server Action] imageHash가 없어 이미지 저장을 건너뜁니다.");
      } else {
        try {
          // Storage에 업로드할 파일 경로 생성 (userId/imageHash.확장자)
          const fileExtension = file.name.split(".").pop() || "jpg";
          const storagePath = `${userId}/${imageHash}.${fileExtension}`;

          console.log("🔹 [Server Action] Storage 업로드:", storagePath);

          // Storage에 업로드
          const { data: uploadData, error: uploadError } = await client.storage
            .from("image_hash")
            .upload(storagePath, file, {
              contentType: file.type,
              upsert: true, // 같은 해시면 덮어쓰기
            });

          if (uploadError) {
            console.error("❌ [Server Action] Storage 업로드 실패:", uploadError);
            // 업로드 실패해도 OCR 결과는 반환
          } else {
            console.log("✅ [Server Action] Storage 업로드 성공");

            // 업로드된 이미지의 Public URL 가져오기
            const { data: urlData } = await client.storage.from("image_hash").getPublicUrl(storagePath);
            const imageUrl = urlData.publicUrl;

            console.log("🔹 [Server Action] Public URL:", imageUrl);

            // blood_test_images 테이블에 저장
            // 사용자가 입력한 날짜를 우선 사용, 없으면 OCR에서 추출한 날짜, 그것도 없으면 오늘 날짜
            const testDateToSave =
              userTestDate || ocrJson.structured?.testDate || new Date().toISOString().split("T")[0];

            console.log("🔹 [Server Action] blood_test_images 저장:", {
              patient_id: userId,
              image_hash: imageHash,
              image_url: imageUrl,
              test_date: testDateToSave,
              user_test_date: userTestDate,
              ocr_test_date: ocrJson.structured?.testDate,
            });

            try {
              const imageId = await upsertBloodTestImage(client, {
                patientId: userId,
                imageHash,
                imageUrl,
                testDate: testDateToSave,
              });
              console.log("✅ [Server Action] blood_test_images 저장 성공, image_id:", imageId);
            } catch (imageError: any) {
              console.error("❌ [Server Action] blood_test_images 저장 실패:", imageError);
              // 중복 키 에러 등은 무시 (이미 저장된 경우)
              if (
                imageError.message &&
                !imageError.message.includes("duplicate") &&
                !imageError.message.includes("unique")
              ) {
                console.error("저장 실패 상세:", imageError);
              }
            }
          }
        } catch (imageError) {
          // 이미지 저장 관련 에러는 로깅만 하고 계속 진행 (OCR 결과는 반환)
          console.error("❌ [Server Action] 이미지 저장 중 오류:", imageError);
        }
      }

      // OCR 결과를 actionData로 반환 (blood_test_results는 저장하지 않음)
      // 사용자가 폼에서 확인 후 "저장하기" 버튼을 눌러야 blood_test_results에 저장됨
      const responseData = {
        structured: ocrJson.structured,
        cached: !!ocrJson.cached,
      };
      console.log("🔹 [Server Action] OCR 결과 반환 (blood_test_results는 저장 안 함):");
      console.log("Response data:", JSON.stringify(responseData, null, 2));

      return jsonData(responseData);
    } catch (error) {
      console.error("OCR action error:", error);
      const errorMessage = error instanceof Error ? error.message : "OCR 처리 중 오류 발생";
      const errorStack = error instanceof Error ? error.stack : String(error);

      return jsonData(
        {
          error: errorMessage,
          details: import.meta.env.DEV ? errorStack : undefined,
        },
        { status: 500 },
      );
    }
  }

  // 🔹 2) 일반 폼 제출 브랜치 (blood_test_results 저장)
  const normalizedEntries = Array.from(formData.entries()).map(([key, value]) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return [key, trimmed === "" ? undefined : trimmed];
    }
    return [key, value];
  });
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

  try {
    await upsertPatientHealthProfile(client, {
      patientId: userId,
      age: Number(age),
      gender,
      disease,
      diseaseStatus,
      treatmentStatus,
      medicationStatus,
      medicationName: medicationStatus === "active" ? (medicationName ?? "") : null,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
    });
  } catch (upsertProfileError: any) {
    console.error("Failed to upsert patient profile:", upsertProfileError);
    return {
      formErrors: {
        profile: [upsertProfileError.message || "환자 프로필 저장에 실패했습니다."],
      },
    };
  }

  const metricEntries = Object.entries(INPUT_METRIC_DEFINITIONS);
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

  // 종양표지자 처리
  const tumorMarkerEntries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("tumorMarker_"))
    .map(([key, value]) => {
      const markerKey = key.replace("tumorMarker_", "") as keyof typeof TUMOR_MARKER_TYPES;
      const marker = TUMOR_MARKER_TYPES[markerKey];
      if (!marker) {
        return null;
      }
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        fieldErrors[key] = ["숫자 형태로 입력해주세요"];
        return null;
      }
      return {
        field: key,
        standardName: marker.standardName,
        unit: marker.unit,
        numericValue,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  metricsWithValues.push(...tumorMarkerEntries);

  // 추가 OCR 항목 처리 (체크박스가 선택된 항목만 처리)
  // 체크박스 선택 상태는 hidden input으로 전송됨
  const selectedAdditionalMetricsFromForm = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("additionalMetricSelected_"))
    .map(([key]) => key.replace("additionalMetricSelected_", "") as keyof typeof ADDITIONAL_OCR_METRICS);

  const additionalMetricEntries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("additionalMetric_"))
    .map(([key, value]) => {
      const metricKey = key.replace("additionalMetric_", "") as keyof typeof ADDITIONAL_OCR_METRICS;
      // 체크박스가 선택된 항목만 처리
      if (!selectedAdditionalMetricsFromForm.includes(metricKey)) {
        return null;
      }
      const metric = ADDITIONAL_OCR_METRICS[metricKey];
      if (!metric) {
        return null;
      }
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        fieldErrors[key] = ["숫자 형태로 입력해주세요"];
        return null;
      }
      return {
        field: key,
        standardName: metric.standardName,
        unit: metric.unit,
        numericValue,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  metricsWithValues.push(...additionalMetricEntries);

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

  // standard_name을 소문자로 정규화하여 조회
  const standardNames = metricsWithValues.map((item) => normalizeStandardName(item.standardName));

  let existingTypes;
  try {
    existingTypes = await getBloodTestTypesByStandardNames(client, {
      standardNames,
    });
  } catch (fetchTypesError: any) {
    console.error("Failed to fetch blood test types:", fetchTypesError);
    return {
      formErrors: {
        tests: [fetchTypesError.message || "혈액검사 항목 조회에 실패했습니다."],
      },
    };
  }

  const typeMap = new Map<string, number>();
  existingTypes?.forEach((type) => {
    // 데이터베이스의 standard_name도 소문자로 정규화하여 매핑
    const normalizedName = normalizeStandardName(type.standard_name);
    typeMap.set(normalizedName, type.test_id);
  });

  // 없는 항목이 있으면 에러 처리 (표준 항목은 마이그레이션으로 미리 등록되어 있어야 함)
  const missingStandardNames = standardNames.filter((name) => !typeMap.has(name));
  if (missingStandardNames.length > 0) {
    console.error("Missing blood test types:", missingStandardNames);
    return {
      formErrors: {
        tests: [
          `표준 혈액검사 항목이 등록되지 않았습니다: ${missingStandardNames.join(", ")}. 관리자에게 문의해주세요.`,
        ],
      },
    };
  }

  // 🔹 imageHash로 blood_test_images에서 image_id 찾기 (OCR을 통해 업로드된 이미지인 경우)
  // image_id는 반드시 연결되어야 하므로, imageHash가 있으면 반드시 찾아야 함
  const imageHash = formData.get("imageHash")?.toString();
  let imageId: number | null = null;

  if (imageHash) {
    console.log("🔹 [Server Action] imageHash로 image_id 찾기:", imageHash);
    try {
      const imageData = await getBloodTestImageByHash(client, {
        patientId: userId,
        imageHash,
      });

      if (imageData) {
        imageId = imageData.image_id;
        console.log("✅ [Server Action] image_id 찾음:", imageId);
        // test_date 업데이트 (폼에서 입력한 날짜로)
        if (testDate) {
          try {
            await updateBloodTestImageTestDate(client, {
              imageId,
              testDate,
            });
            console.log("✅ [Server Action] test_date 업데이트 성공");
          } catch (updateError) {
            console.error("❌ [Server Action] Failed to update test_date:", updateError);
          }
        }
      } else {
        // imageHash가 있는데 이미지를 찾지 못한 경우는 오류
        console.error("❌ [Server Action] imageHash에 해당하는 이미지를 찾지 못함");
        return {
          formErrors: {
            image: ["이미지 정보를 찾을 수 없습니다. OCR을 다시 시도해주세요."],
          },
        };
      }
    } catch (imageError: any) {
      console.error("❌ [Server Action] Failed to find blood_test_image:", imageError);
      return {
        formErrors: {
          image: ["이미지 정보를 찾을 수 없습니다. 다시 시도해주세요."],
        },
      };
    }
  }

  const resultPayload = metricsWithValues.map((item) => {
    const testId = typeMap.get(item.standardName);
    if (!testId) {
      throw new Error(`혈액검사 항목이 설정되지 않았습니다: ${item.standardName}`);
    }
    return {
      patient_id: userId,
      test_id: testId,
      result_value: item.numericValue,
      result_unit: item.unit || null,
      test_date: testDate,
      image_id: imageId, // OCR을 통해 업로드된 이미지인 경우 연결
    };
  });

  try {
    await insertBloodTestResults(client, {
      results: resultPayload,
    });
  } catch (insertResultsError: any) {
    console.error("Failed to insert blood test results:", insertResultsError);
    return {
      formErrors: {
        results: [insertResultsError.message || "혈액검사 결과 저장에 실패했습니다."],
      },
    };
  }

  return redirect("/my/dashboard/health", { headers });
};

// ---------------------
// TYPES
// ---------------------
type LoaderData = Awaited<ReturnType<typeof loader>>;
type ActionData =
  | { error: string }
  | { structured: Record<string, string>; cached?: boolean }
  | { fieldErrors: Record<string, string[] | undefined> }
  | { formErrors: Record<string, string[] | undefined> }
  | null;

// ---------------------
// COMPONENT
// ---------------------
export default function DashboardHealthSubmit({ actionData, loaderData }: Route.ComponentProps) {
  const typedLoaderData = loaderData as unknown as LoaderData;
  const typedActionData = actionData as unknown as ActionData;
  const patientProfile = typedLoaderData?.patientProfile;
  const [searchParams] = useSearchParams();
  const hasConsent = searchParams.get("consent") === "success";

  // 검사 유형: 혈액검사 | 의무기록
  const [examType, setExamType] = useState<"blood_test" | "medical_record">("blood_test");

  // 🔹 OCR 전용 fetcher
  const ocrFetcher = useFetcher<typeof action>();

  // 의무기록 저장 fetcher
  const medicalRecordFetcher = useFetcher<typeof action>();

  // OCR 결과로 채워질 필드 상태
  const [ocrResult, setOcrResult] = useState<Partial<Record<MetricField | "testDate", string>>>({});

  // 의무기록 입력 필드
  const [medicalRecordFields, setMedicalRecordFields] = useState({
    testContent: "",
    clinicalInformation: "",
    finding: "",
    conclusion: "",
  });

  // 검사 날짜 상태 (이미지 업로드 전에 필수로 입력받음)
  const [testDate, setTestDate] = useState<string>("");

  // OCR 업로드 시 계산된 imageHash를 저장 (폼 제출 시 사용)
  const [currentImageHash, setCurrentImageHash] = useState<string | null>(null);

  // 선택된 종양표지자 상태
  const [selectedTumorMarkers, setSelectedTumorMarkers] = useState<Set<keyof typeof TUMOR_MARKER_TYPES>>(new Set());

  // 종양표지자 값 상태
  const [tumorMarkerValues, setTumorMarkerValues] = useState<Record<keyof typeof TUMOR_MARKER_TYPES, string>>(
    {} as Record<keyof typeof TUMOR_MARKER_TYPES, string>,
  );

  // 선택된 추가 OCR 항목 상태
  const [selectedAdditionalMetrics, setSelectedAdditionalMetrics] = useState<Set<keyof typeof ADDITIONAL_OCR_METRICS>>(
    new Set(),
  );

  // 추가 OCR 항목 값 상태
  const [additionalMetricValues, setAdditionalMetricValues] = useState<
    Record<keyof typeof ADDITIONAL_OCR_METRICS, string>
  >({} as Record<keyof typeof ADDITIONAL_OCR_METRICS, string>);

  // LMR과 NLR 계산값 상태 (관련 값이 입력되면 자동 계산)
  const [calculatedLMR, setCalculatedLMR] = useState<string | null>(null);
  const [calculatedNLR, setCalculatedNLR] = useState<string | null>(null);

  // 의무기록 OCR 결과 반영
  useEffect(() => {
    const data = ocrFetcher.data;
    if (data && typeof data === "object" && "medicalRecord" in data && data.medicalRecord) {
      const mr = data.medicalRecord as Record<string, string>;
      setMedicalRecordFields({
        testContent: mr.test_content ?? "",
        clinicalInformation: mr.clinical_information ?? "",
        finding: mr.finding ?? "",
        conclusion: mr.conclusion ?? "",
      });
      if (mr.testDate) setTestDate(mr.testDate);
      alert("의무기록 내용을 추출했습니다. 확인 후 저장해주세요.");
    }
  }, [ocrFetcher.data]);

  // 의무기록 저장 성공
  useEffect(() => {
    const data = medicalRecordFetcher.data;
    if (data && typeof data === "object" && "success" in data && data.success) {
      setMedicalRecordFields({ testContent: "", clinicalInformation: "", finding: "", conclusion: "" });
      setTestDate("");
      alert("의무기록이 저장되었습니다.");
      window.location.reload();
    }
    if (data && typeof data === "object" && "error" in data && data.error) {
      alert(String(data.error));
    }
  }, [medicalRecordFetcher.data]);

  // 🔹 fetcher.data로 들어온 OCR 결과 반영 (혈액검사)
  useEffect(() => {
    const fetcherData = ocrFetcher.data;
    if (fetcherData && typeof fetcherData === "object" && "medicalRecord" in fetcherData) return;
    if (fetcherData && typeof fetcherData === "object" && "structured" in fetcherData && fetcherData.structured) {
      // LMR과 NLR은 OCR 결과에서 자동 계산하지 않음 (수동 입력만 가능)
      const processedResult = fetcherData.structured as Record<string, string>;

      // Server Action 필드를 클라이언트 필드로 매핑
      const mappedData = mapServerFieldsToClient(processedResult);
      const { clientResult, tumorMarkers } = mappedData;

      // 일반 필드 설정
      setOcrResult(clientResult);

      // OCR 결과에 날짜가 있고, 사용자가 아직 날짜를 입력하지 않았으면 자동으로 채움
      if (processedResult.testDate && !testDate) {
        setTestDate(processedResult.testDate);
      }

      // 종양표지자 자동 선택 및 값 설정
      if (Object.keys(tumorMarkers).length > 0) {
        const newSelectedMarkers = new Set(selectedTumorMarkers);
        const newTumorMarkerValues = { ...tumorMarkerValues };

        Object.entries(tumorMarkers).forEach(([key, value]) => {
          newSelectedMarkers.add(key as keyof typeof TUMOR_MARKER_TYPES);
          newTumorMarkerValues[key as keyof typeof TUMOR_MARKER_TYPES] = String(value);
        });

        setSelectedTumorMarkers(newSelectedMarkers);
        setTumorMarkerValues(newTumorMarkerValues);
      }

      // 추가 OCR 항목 값 설정 (이미 선택된 항목만 자동 채우기)
      // OCR 실행 전에 체크하지 않은 항목은 자동으로 선택하거나 값을 채우지 않음
      const newAdditionalMetricValues = { ...additionalMetricValues };

      // Server Action의 structured 필드명 -> 추가 OCR 항목 키 매핑
      const additionalMetricMapping: Record<string, keyof typeof ADDITIONAL_OCR_METRICS> = {
        wbc: "wbc",
        rbc: "rbc",
        hgb: "hgb",
        hct: "hct",
        mcv: "mcv",
        mchc: "mchc",
        rdw: "rdw",
        pdw: "pdw",
        neutrophil: "neutrophil",
        lymphocyte: "lymphocyte",
        monocyte: "monocyte",
        eosinophil: "eosinophil",
        basophil: "basophil",
        totalBilirubin: "totalBilirubin",
        gtp: "gtp",
        bun: "bun",
        creatinine: "creatinine",
        uricAcid: "uricAcid",
        triglyceride: "triglyceride",
        hdl: "hdl",
        ldl: "ldl",
        freeT3: "freeT3",
        freeT4: "freeT4",
        tsh: "tsh",
        homocysteine: "homocysteine",
        cholesterol: "cholesterol",
      };

      // 이미 선택된 항목에 대해서만 OCR 결과 값을 채움
      Object.entries(processedResult).forEach(([key, value]) => {
        // key를 정규화하여 매핑
        const normalizedKey = normalizeStandardName(key);
        const metricKey = additionalMetricMapping[normalizedKey] || additionalMetricMapping[key];
        if (metricKey && value && value.trim() !== "" && selectedAdditionalMetrics.has(metricKey)) {
          newAdditionalMetricValues[metricKey] = String(value);
        }
      });

      setAdditionalMetricValues(newAdditionalMetricValues);

      // LMR과 NLR 계산 (관련 값이 입력되었을 때)
      const lymphocyteValue = newAdditionalMetricValues.lymphocyte;
      const monocyteValue = newAdditionalMetricValues.monocyte;
      const neutrophilValue = newAdditionalMetricValues.neutrophil;

      // LMR 계산: lymphocyte / monocyte
      if (lymphocyteValue && monocyteValue) {
        const lymph = Number(lymphocyteValue);
        const mono = Number(monocyteValue);
        if (!Number.isNaN(lymph) && !Number.isNaN(mono) && mono !== 0) {
          const lmr = lymph / mono;
          setCalculatedLMR(lmr.toFixed(2));
        } else {
          setCalculatedLMR(null);
        }
      } else {
        setCalculatedLMR(null);
      }

      // NLR 계산: neutrophil / lymphocyte
      if (neutrophilValue && lymphocyteValue) {
        const neutro = Number(neutrophilValue);
        const lymph = Number(lymphocyteValue);
        if (!Number.isNaN(neutro) && !Number.isNaN(lymph) && lymph !== 0) {
          const nlr = neutro / lymph;
          setCalculatedNLR(nlr.toFixed(2));
        } else {
          setCalculatedNLR(null);
        }
      } else {
        setCalculatedNLR(null);
      }

      if (fetcherData.cached) {
        alert("기존 데이터가 존재합니다. 수치를 확인 후 저장해주세요.");
      } else {
        alert("값을 추출했습니다. 수치를 확인 후 저장해주세요.");
      }
    }
    if (fetcherData && typeof fetcherData === "object" && "error" in fetcherData) {
      alert(`OCR 처리 실패: ${fetcherData.error}`);
    }
  }, [ocrFetcher.data]);

  // 파일 → ArrayBuffer
  const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file as ArrayBuffer"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  // SHA-256 해시 계산 (브라우저 Web Crypto)
  const calculateSHA256 = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // Server Action의 structured 필드를 클라이언트 필드명으로 매핑
  const mapServerFieldsToClient = (
    serverStructured: Record<string, string>,
  ): {
    clientResult: Partial<Record<MetricField | "testDate", string>>;
    tumorMarkers: Record<string, string>;
  } => {
    const clientResult: Partial<Record<MetricField | "testDate", string>> = {};
    const tumorMarkers: Record<string, string> = {};

    // 필드 매핑: Server Action 필드명 -> 클라이언트 필드명
    // LMR과 NLR은 OCR 결과에서 자동으로 채우지 않음 (수동 입력만 가능)
    const fieldMapping: Record<string, MetricField | "testDate"> = {
      // lmr과 nlr은 OCR 결과에서 자동으로 매핑하지 않음
      platelet: "platelet",
      crp: "crp",
      glucose: "glucose",
      hgbA1c: "hgbA1c",
      hgba1c: "hgbA1c", // Edge Function에서 오는 필드명
      cholesterol: "cholesterol",
      ldh: "ldh",
      ast: "ast",
      alt: "alt",
      egfr: "egfr",
      vitaminD3: "vitaminD3",
      vitaminD: "vitaminD3", // Edge Function에서 오는 필드명
      vitamin_d: "vitaminD3", // Edge Function에서 오는 필드명 (소문자 언더스코어)
      vitamin_d3: "vitaminD3",
      // Edge Function의 standardNameMap에서 vitamin_d -> vitaminD로 매핑되므로
      // vitaminD도 처리 가능하도록 추가
      testDate: "testDate",
    };

    // 종양표지자 필드 매핑
    const tumorMarkerMapping: Record<string, keyof typeof TUMOR_MARKER_TYPES> = {
      scc: "scc",
      cea: "cea",
      ca199: "ca199",
      ca125: "ca125",
      ca153: "ca153",
      psa: "psa",
      afp: "afp",
      ca724: "ca724",
      nse: "nse",
    };

    Object.keys(serverStructured).forEach((key) => {
      // key를 정규화하여 매핑
      const normalizedKey = normalizeStandardName(key);

      // 일반 필드 매핑
      const mappedKey = fieldMapping[normalizedKey] || fieldMapping[key];
      if (mappedKey && serverStructured[key] && serverStructured[key].trim() !== "") {
        clientResult[mappedKey] = serverStructured[key];
      }

      // 종양표지자 필드 매핑
      const tumorMarkerKey = tumorMarkerMapping[normalizedKey] || tumorMarkerMapping[key];
      if (tumorMarkerKey && serverStructured[key] && serverStructured[key].trim() !== "") {
        tumorMarkers[tumorMarkerKey] = serverStructured[key];
      }
    });

    return { clientResult, tumorMarkers };
  };

  // 이미지 업로드 + OCR 호출 (단일 파일 처리)
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // 1) 해시 계산
      const arrayBuffer = await fileToArrayBuffer(file);
      const imageHash = await calculateSHA256(arrayBuffer);

      console.log("🔹 [Client] 이미지 해시 계산 완료:", imageHash);
      console.log("🔹 [Client] 파일명:", file.name);
      console.log("🔹 [Client] 파일 크기:", file.size);

      // imageHash를 상태에 저장 (폼 제출 시 사용)
      setCurrentImageHash(imageHash);

      // 2) 검사 날짜 확인
      if (!testDate) {
        alert("검사 날짜를 먼저 입력해주세요.");
        return;
      }

      // 3) OCR action 호출용 FormData 구성
      const formData = new FormData();
      formData.append("file", file);
      formData.append("imageHash", imageHash);
      formData.append("testDate", testDate);
      formData.append("_intent", examType === "medical_record" ? "ocr_medical_record" : "ocr");

      console.log("🔹 [Client] OCR 요청 전송 시작");

      // useFetcher를 통해 요청 (React Router가 JSON으로 응답)
      ocrFetcher.submit(formData, {
        method: "post",
        encType: "multipart/form-data",
      });
    } catch (error) {
      console.error("❌ [Client] OCR processing failed:", error);
      alert("이미지 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">혈액검사 수치 입력</h1>
        <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
          뒤로가기
        </Button>
      </div>

      {hasConsent && (
        <Card>
          <CardHeader>
            <CardTitle>의료정보 제공 동의 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>✅ 의료정보 제공에 동의하셨습니다.</p>
              <p>이제 검사 결과를 안전하게 입력할 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>검사 항목 선택</CardTitle>
          <p className="text-muted-foreground text-sm">
            입력할 검사 유형을 선택해주세요.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={examType === "blood_test" ? "default" : "outline"}
              onClick={() => setExamType("blood_test")}
              className="flex-1"
            >
              혈액검사
            </Button>
            <Button
              type="button"
              variant={examType === "medical_record" ? "default" : "outline"}
              onClick={() => setExamType("medical_record")}
              className="flex-1"
            >
              의무기록사본
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            검사 날짜
            <span className="text-sm font-normal text-red-500">(필수)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="testDate" className="flex flex-col gap-1">
                <small className="text-muted-foreground text-xs">
                  검사 날짜를 먼저 입력해주세요. 이미지 업로드 전에 날짜를 확인하여 데이터가 올바른 날짜에 저장됩니다.
                </small>
              </Label>
              <div
                className="relative max-w-md cursor-pointer"
                onClick={() => {
                  const input = document.getElementById("testDate") as HTMLInputElement | null;
                  if (input) {
                    if (typeof input.showPicker === "function") {
                      input.showPicker();
                    } else {
                      input.focus();
                      input.click();
                    }
                  }
                }}
              >
                <Input
                  id="testDate"
                  name="testDate"
                  type="date"
                  required
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full cursor-pointer"
                  style={{ WebkitAppearance: "none" }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {examType === "medical_record"
              ? "의무기록사본 이미지 업로드 (OCR)"
              : "검사 결과 사진 업로드 (OCR)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload-input"
                disabled={ocrFetcher.state === "submitting" || !testDate}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image-upload-input")?.click()}
                disabled={ocrFetcher.state === "submitting" || !testDate}
                className="flex items-center gap-2"
              >
                {ocrFetcher.state === "submitting" ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    <span>OCR 처리 중...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="size-4" />
                    <span>이미지 선택</span>
                  </>
                )}
              </Button>
            </div>
            {!testDate && <p className="text-sm text-amber-600">⚠️ 검사 날짜를 먼저 입력해주세요.</p>}
            <p className="text-muted-foreground text-sm">
              {examType === "medical_record" ? (
                <>
                  의무기록사본 사진을 업로드하면 검사내용, Clinical Information, Finding, Conclusion을 자동 추출합니다.
                  <br />
                  <small className="text-muted-foreground text-xs">⚠️ OCR 값이 부정확할 수 있습니다. 확인 후 저장해주세요.</small>
                </>
              ) : (
                <>
                  혈액검사 결과 사진을 업로드하면 자동으로 수치를 인식합니다. <br />
                  <small className="text-muted-foreground text-xs">⚠️ OCR 값이 부정확할 수 있습니다. 다시 확인해주세요.</small>
                  <br />
                  <small className="text-muted-foreground text-xs">⚠️ 추가 검사 항목 저장을 원하시는 분은 아래 전체 선택을 체크해주세요.</small>
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {examType === "medical_record" && (
        <Card>
          <CardHeader>
            <CardTitle>의무기록 입력</CardTitle>
            <p className="text-muted-foreground text-sm">
              OCR로 추출하거나 수동으로 입력해주세요. 검사내용은 필수입니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mr-testContent">검사내용 *</Label>
              <Textarea
                id="mr-testContent"
                placeholder="검사 내용을 입력하세요"
                value={medicalRecordFields.testContent}
                onChange={(e) =>
                  setMedicalRecordFields((p) => ({ ...p, testContent: e.target.value }))
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mr-clinical">Clinical Information</Label>
              <Textarea
                id="mr-clinical"
                placeholder="Clinical Information 입력"
                value={medicalRecordFields.clinicalInformation}
                onChange={(e) =>
                  setMedicalRecordFields((p) => ({ ...p, clinicalInformation: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mr-finding">Finding</Label>
              <Textarea
                id="mr-finding"
                placeholder="Finding 입력"
                value={medicalRecordFields.finding}
                onChange={(e) =>
                  setMedicalRecordFields((p) => ({ ...p, finding: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mr-conclusion">Conclusion</Label>
              <Textarea
                id="mr-conclusion"
                placeholder="Conclusion 입력"
                value={medicalRecordFields.conclusion}
                onChange={(e) =>
                  setMedicalRecordFields((p) => ({ ...p, conclusion: e.target.value }))
                }
                rows={3}
              />
            </div>
            <medicalRecordFetcher.Form method="post">
              <input type="hidden" name="_intent" value="save_medical_record" />
              <input type="hidden" name="testDate" value={testDate} />
              <input type="hidden" name="testContent" value={medicalRecordFields.testContent} />
              <input type="hidden" name="clinicalInformation" value={medicalRecordFields.clinicalInformation} />
              <input type="hidden" name="finding" value={medicalRecordFields.finding} />
              <input type="hidden" name="conclusion" value={medicalRecordFields.conclusion} />
              <Button
                type="submit"
                disabled={
                  medicalRecordFetcher.state !== "idle" ||
                  !testDate ||
                  !medicalRecordFields.testContent.trim()
                }
              >
                {medicalRecordFetcher.state !== "idle" ? "저장 중..." : "의무기록 저장"}
              </Button>
            </medicalRecordFetcher.Form>
          </CardContent>
        </Card>
      )}

      {examType === "blood_test" && (
      <Form method="post" className="space-y-8">
        {/* OCR 업로드 시 계산된 imageHash를 hidden 필드로 전달 */}
        {currentImageHash && <input type="hidden" name="imageHash" value={currentImageHash} />}
        <Card>
          <CardHeader>
            <CardTitle>환자 기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <InputPair
                label="나이"
                name="age"
                description="현재 환자의 만 나이"
                type="number"
                placeholder="예: 45"
                required
                defaultValue={patientProfile?.age !== undefined ? String(patientProfile.age) : undefined}
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
                placeholder="예: 유방암"
                required
                defaultValue={patientProfile?.disease ?? undefined}
              />
              <InputPair
                label="질환 상태"
                name="diseaseStatus"
                description="현재 질환의 상태를 입력해주세요"
                placeholder="예: 부분 관해, 완전 관해 등"
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
                placeholder="예: 메트포르민, 타목시펜 등"
                defaultValue={patientProfile?.medication_name ?? undefined}
              />
              <InputPair
                label="키 (cm)"
                name="heightCm"
                description="현재 키 (cm 단위)"
                type="number"
                step="0.1"
                placeholder="예: 160"
                required
                defaultValue={patientProfile?.height_cm !== undefined ? String(patientProfile.height_cm) : undefined}
              />
              <InputPair
                label="몸무게 (kg)"
                name="weightKg"
                description="현재 몸무게 (kg 단위)"
                type="number"
                step="0.1"
                placeholder="예: 55"
                required
                defaultValue={patientProfile?.weight_kg !== undefined ? String(patientProfile.weight_kg) : undefined}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>수동 입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 종양표지자 섹션 */}
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">종양 표지자</Label>
                <p className="text-muted-foreground mb-3 text-sm">검사한 종양 표지자를 선택하고 값을 입력해주세요.</p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                  {Object.entries(TUMOR_MARKER_TYPES).map(([key, marker]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tumor-marker-${key}`}
                        checked={selectedTumorMarkers.has(key as keyof typeof TUMOR_MARKER_TYPES)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedTumorMarkers);
                          if (checked) {
                            newSet.add(key as keyof typeof TUMOR_MARKER_TYPES);
                          } else {
                            newSet.delete(key as keyof typeof TUMOR_MARKER_TYPES);
                            setTumorMarkerValues((prev) => {
                              const newValues = { ...prev };
                              delete newValues[key as keyof typeof TUMOR_MARKER_TYPES];
                              return newValues;
                            });
                          }
                          setSelectedTumorMarkers(newSet);
                        }}
                      />
                      <Label htmlFor={`tumor-marker-${key}`} className="cursor-pointer text-sm font-normal">
                        {marker.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {selectedTumorMarkers.size > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  {Array.from(selectedTumorMarkers)
                    .sort((a, b) => a.localeCompare(b))
                    .map((key) => {
                      const marker = TUMOR_MARKER_TYPES[key];
                      return (
                        <div key={key} className="flex flex-col space-y-2">
                          <Label htmlFor={`tumorMarker_${key}`} className="flex flex-col gap-1">
                            <span className="font-medium">{marker.label} (종양 표지자)</span>
                            <small className="text-muted-foreground text-xs">({marker.label})</small>
                          </Label>
                          <input
                            id={`tumorMarker_${key}`}
                            name={`tumorMarker_${key}`}
                            type="number"
                            step="0.01"
                            placeholder="예: 2.5"
                            value={tumorMarkerValues[key] ?? ""}
                            onChange={(e) => {
                              setTumorMarkerValues((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }));
                            }}
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* 일반 메트릭 섹션 - METRIC_DISPLAY_ORDER 순서대로 (LMR/NLR 제외) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {METRIC_DISPLAY_ORDER.map((metricKey) => {
                // metricKey는 이미 소문자로 정규화됨 (queries.ts에서)
                const fieldMap: Record<string, keyof typeof INPUT_METRIC_DEFINITIONS> = {
                  lmr: "lmr",
                  nlr: "nlr",
                  glucose: "glucose",
                  hgba1c: "hgbA1c",
                  ldh: "ldh",
                  crp: "crp",
                  vitamin_d3: "vitaminD3",
                  platelet: "platelet",
                  ast: "ast",
                  alt: "alt",
                  egfr: "egfr",
                };
                const field = fieldMap[metricKey];
                if (!field || !INPUT_METRIC_DEFINITIONS[field]) {
                  return null;
                }
                // LMR과 NLR은 별도 섹션에서 처리
                if (field === "lmr" || field === "nlr") {
                  return null;
                }
                const definition = INPUT_METRIC_DEFINITIONS[field];
                const ocrValue = ocrResult[field as MetricField];
                return (
                  <div key={field} className="flex flex-col space-y-2">
                    <Label htmlFor={field} className="flex flex-col gap-1">
                      <span className="font-medium">{definition.label}</span>
                      <small className="text-muted-foreground text-xs">({definition.englishName})</small>
                    </Label>
                    <input
                      id={field}
                      name={field}
                      type="number"
                      step={field === "hgbA1c" || field === "vitaminD3" ? "0.1" : field === "crp" ? "0.01" : undefined}
                      placeholder={`예: ${field === "platelet" ? "250" : field === "glucose" ? "95" : field === "hgbA1c" ? "5.7" : field === "vitaminD3" ? "25.0" : "0.5"}`}
                      defaultValue={ocrValue}
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                );
              })}
            </div>

            {/* LMR과 NLR 수동 입력 섹션 (관련 값이 입력되면 계산값 힌트 표시) */}
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">면역 지표 (수동 입력)</Label>
                <p className="text-muted-foreground mb-3 text-sm">
                  <small className="text-muted-foreground text-xs">
                    림프구, 단핵구, 호중구 값이 입력되면 자동으로 계산됩니다. 수동으로 직접 입력할 수도 있습니다.
                  </small>
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* LMR 입력 */}
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="lmr" className="flex flex-col gap-1">
                    <span className="font-medium">{INPUT_METRIC_DEFINITIONS.lmr.label}</span>
                    <small className="text-muted-foreground text-xs">
                      ({INPUT_METRIC_DEFINITIONS.lmr.englishName})
                    </small>
                    {calculatedLMR && (
                      <small className="text-muted-foreground text-xs">계산값: {calculatedLMR} (림프구/단핵구)</small>
                    )}
                  </Label>
                  <input
                    id="lmr"
                    name="lmr"
                    type="number"
                    step="0.01"
                    placeholder={
                      calculatedLMR
                        ? `계산값: ${calculatedLMR} (수동 입력 가능)`
                        : "수동 입력 또는 림프구/단핵구 입력 시 자동 계산"
                    }
                    defaultValue={ocrResult.lmr || calculatedLMR || undefined}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                {/* NLR 입력 */}
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="nlr" className="flex flex-col gap-1">
                    <span className="font-medium">{INPUT_METRIC_DEFINITIONS.nlr.label}</span>
                    <small className="text-muted-foreground text-xs">
                      ({INPUT_METRIC_DEFINITIONS.nlr.englishName})
                    </small>
                    {calculatedNLR && (
                      <small className="text-muted-foreground text-xs">계산값: {calculatedNLR} (호중구/림프구)</small>
                    )}
                  </Label>
                  <input
                    id="nlr"
                    name="nlr"
                    type="number"
                    step="0.01"
                    placeholder={
                      calculatedNLR
                        ? `계산값: ${calculatedNLR} (수동 입력 가능)`
                        : "수동 입력 또는 호중구/림프구 입력 시 자동 계산"
                    }
                    defaultValue={ocrResult.nlr || calculatedNLR || undefined}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* 추가 OCR 항목 섹션 */}
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="block text-sm font-medium">추가 검사 항목</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allKeys = Object.keys(ADDITIONAL_OCR_METRICS) as Array<keyof typeof ADDITIONAL_OCR_METRICS>;
                      const isAllSelected = allKeys.every((key) => selectedAdditionalMetrics.has(key));
                      if (isAllSelected) {
                        // 전체 해제
                        setSelectedAdditionalMetrics(new Set());
                        setAdditionalMetricValues({} as Record<keyof typeof ADDITIONAL_OCR_METRICS, string>);
                      } else {
                        // 전체 선택
                        setSelectedAdditionalMetrics(new Set(allKeys));
                      }
                    }}
                  >
                    {Object.keys(ADDITIONAL_OCR_METRICS).every((key) =>
                      selectedAdditionalMetrics.has(key as keyof typeof ADDITIONAL_OCR_METRICS),
                    )
                      ? "전체 해제"
                      : "전체 선택"}
                  </Button>
                </div>
                <p className="text-muted-foreground mb-3 text-sm">
                  OCR에서 추출 검사 항목 중, 데이터베이스에 저장할 항목을 체크해주세요.
                  <small className="text-muted-foreground text-xs">
                    <br />
                    ⚠️ 체크하지 않은 항목은 데이터베이스에 저장되지 않습니다. 저장된 데이터는 AI 맞춤 답변시 참고됩니다.
                  </small>
                </p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(ADDITIONAL_OCR_METRICS).map(([key, metric]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`additional-metric-${key}`}
                        checked={selectedAdditionalMetrics.has(key as keyof typeof ADDITIONAL_OCR_METRICS)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedAdditionalMetrics);
                          if (checked) {
                            newSet.add(key as keyof typeof ADDITIONAL_OCR_METRICS);
                          } else {
                            newSet.delete(key as keyof typeof ADDITIONAL_OCR_METRICS);
                            setAdditionalMetricValues((prev) => {
                              const newValues = { ...prev };
                              delete newValues[key as keyof typeof ADDITIONAL_OCR_METRICS];
                              return newValues;
                            });
                          }
                          setSelectedAdditionalMetrics(newSet);
                        }}
                      />
                      <Label htmlFor={`additional-metric-${key}`} className="cursor-pointer text-sm font-normal">
                        {metric.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {selectedAdditionalMetrics.size > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Array.from(selectedAdditionalMetrics)
                    .sort((a, b) => a.localeCompare(b))
                    .map((key) => {
                      const metric = ADDITIONAL_OCR_METRICS[key];
                      return (
                        <div key={key} className="flex flex-col space-y-2">
                          {/* 체크박스 선택 상태를 hidden input으로 전송 */}
                          <input type="hidden" name={`additionalMetricSelected_${key}`} value="true" />
                          <Label htmlFor={`additionalMetric_${key}`} className="flex flex-col gap-1">
                            <span className="font-medium">{metric.label}</span>
                            <small className="text-muted-foreground text-xs">({metric.englishName})</small>
                          </Label>
                          <input
                            id={`additionalMetric_${key}`}
                            name={`additionalMetric_${key}`}
                            type="number"
                            step="0.01"
                            placeholder="값 입력"
                            value={additionalMetricValues[key] ?? ""}
                            onChange={(e) => {
                              const newValues = {
                                ...additionalMetricValues,
                                [key]: e.target.value,
                              };
                              setAdditionalMetricValues(newValues);

                              // LMR과 NLR 계산 (관련 값이 변경되었을 때)
                              const lymphocyteValue = newValues.lymphocyte;
                              const monocyteValue = newValues.monocyte;
                              const neutrophilValue = newValues.neutrophil;

                              // LMR 계산: lymphocyte / monocyte
                              if (lymphocyteValue && monocyteValue) {
                                const lymph = Number(lymphocyteValue);
                                const mono = Number(monocyteValue);
                                if (!Number.isNaN(lymph) && !Number.isNaN(mono) && mono !== 0) {
                                  const lmr = lymph / mono;
                                  setCalculatedLMR(lmr.toFixed(2));
                                } else {
                                  setCalculatedLMR(null);
                                }
                              } else {
                                setCalculatedLMR(null);
                              }

                              // NLR 계산: neutrophil / lymphocyte
                              if (neutrophilValue && lymphocyteValue) {
                                const neutro = Number(neutrophilValue);
                                const lymph = Number(lymphocyteValue);
                                if (!Number.isNaN(neutro) && !Number.isNaN(lymph) && lymph !== 0) {
                                  const nlr = neutro / lymph;
                                  setCalculatedNLR(nlr.toFixed(2));
                                } else {
                                  setCalculatedNLR(null);
                                }
                              } else {
                                setCalculatedNLR(null);
                              }
                            }}
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* 검사 날짜는 이미 상단에 입력받음 */}
            <input type="hidden" name="testDate" value={testDate} />
          </CardContent>
        </Card>

        {typedActionData && typeof typedActionData === "object" && "fieldErrors" in typedActionData && (
          <div className="space-y-2 text-red-500">
            {Object.entries(typedActionData.fieldErrors || {}).map(([field, errors]) => (
              <div key={field}>
                {field}: {Array.isArray(errors) ? errors.join(", ") : String(errors)}
              </div>
            ))}
          </div>
        )}

        {typedActionData &&
          typeof typedActionData === "object" &&
          "formErrors" in typedActionData &&
          typedActionData.formErrors && (
            <div className="space-y-2 text-red-500">
              {Object.entries(typedActionData.formErrors).flatMap(([field, errors]) =>
                (errors ?? []).map((message, index) => (
                  <div key={`${field}-${index}`}>
                    {field}: {message}
                  </div>
                )),
              )}
            </div>
          )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            취소
          </Button>
          <Button type="submit">저장하기</Button>
        </div>
      </Form>
      )}
    </div>
  );
}
