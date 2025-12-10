import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

export const upsertPatientHealthProfile = async (
  client: SupabaseClient<Database>,
  {
    patientId,
    age,
    gender,
    disease,
    diseaseStatus,
    treatmentStatus,
    medicationStatus,
    medicationName,
    heightCm,
    weightKg,
  }: {
    patientId: string;
    age: number;
    gender: "M" | "F";
    disease: string;
    diseaseStatus: string;
    treatmentStatus: "ongoing" | "completed" | "follow_up";
    medicationStatus: "none" | "active";
    medicationName: string | null;
    heightCm: number;
    weightKg: number;
  },
) => {
  const { error } = await client.from("patient_health_profiles").upsert(
    {
      patient_id: patientId,
      age,
      gender,
      disease,
      disease_status: diseaseStatus,
      treatment_status: treatmentStatus,
      medication_status: medicationStatus,
      medication_name: medicationName,
      height_cm: heightCm,
      weight_kg: weightKg,
    },
    { onConflict: "patient_id" },
  );
  if (error) {
    throw error;
  }
};

export const upsertBloodTestImage = async (
  client: SupabaseClient<Database>,
  {
    patientId,
    imageHash,
    imageUrl,
    testDate,
  }: {
    patientId: string;
    imageHash: string;
    imageUrl: string;
    testDate: string;
  },
) => {
  // 기존 이미지가 있는지 확인
  const { data: existingImage, error: checkError } = await client
    .from("blood_test_images")
    .select("image_id")
    .eq("image_hash", imageHash)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (checkError) {
    throw checkError;
  }

  if (existingImage) {
    // 기존 이미지가 있으면 업데이트
    const { error: updateError } = await client
      .from("blood_test_images")
      .update({
        image_url: imageUrl,
        test_date: testDate,
      })
      .eq("image_id", existingImage.image_id);

    if (updateError) {
      throw updateError;
    }
    return existingImage.image_id;
  } else {
    // 새 이미지 정보 저장
    const { data: newImage, error: insertError } = await client
      .from("blood_test_images")
      .insert({
        patient_id: patientId,
        image_hash: imageHash,
        image_url: imageUrl,
        test_date: testDate,
      })
      .select("image_id")
      .single();

    if (insertError) {
      throw insertError;
    }
    return newImage?.image_id;
  }
};

export const updateBloodTestImageTestDate = async (
  client: SupabaseClient<Database>,
  {
    imageId,
    testDate,
  }: {
    imageId: number;
    testDate: string;
  },
) => {
  const { error } = await client.from("blood_test_images").update({ test_date: testDate }).eq("image_id", imageId);
  if (error) {
    throw error;
  }
};

/**
 * 혈액검사 타입을 upsert합니다.
 * standard_name이 이미 존재하면 업데이트하지 않고, 없으면 생성합니다.
 * 이 함수는 더 이상 사용되지 않으며, 표준 항목은 마이그레이션으로 초기화되어야 합니다.
 * @deprecated 표준 항목은 마이그레이션으로 관리하세요. 이 함수는 하위 호환성을 위해 유지됩니다.
 */
export const upsertBloodTestTypes = async (
  client: SupabaseClient<Database>,
  {
    types,
  }: {
    types: Array<{
      standard_name: string;
      unit: string;
      reference_min?: number | null;
      reference_max?: number | null;
      clinical_significance?: string | null;
    }>;
  },
) => {
  // standard_name을 소문자로 정규화
  const normalizedTypes = types.map((type) => ({
    ...type,
    standard_name: type.standard_name.toLowerCase().trim(),
  }));

  // Upsert 사용 (ON CONFLICT DO NOTHING - 기존 값이 있으면 업데이트하지 않음)
  const { data, error } = await client
    .from("blood_test_types")
    .upsert(normalizedTypes, {
      onConflict: "standard_name",
      ignoreDuplicates: true, // 기존 값이 있으면 무시
    })
    .select("test_id, standard_name");

  if (error) {
    throw error;
  }
  return data;
};

/**
 * @deprecated insertBloodTestTypes는 더 이상 사용하지 않습니다. upsertBloodTestTypes를 사용하세요.
 */
export const insertBloodTestTypes = upsertBloodTestTypes;

export const insertBloodTestResults = async (
  client: SupabaseClient<Database>,
  {
    results,
  }: {
    results: Array<{
      patient_id: string;
      test_id: number;
      result_value: number;
      result_unit: string | null;
      test_date: string;
      image_id: number | null;
    }>;
  },
) => {
  // 같은 날짜, 같은 patient_id, 같은 test_id에 대한 중복 체크 및 업데이트/삽입
  for (const result of results) {
    // 기존 결과 확인
    const { data: existingResults, error: findError } = await client
      .from("blood_test_results")
      .select("result_id")
      .eq("patient_id", result.patient_id)
      .eq("test_date", result.test_date)
      .eq("test_id", result.test_id);

    if (findError) {
      throw findError;
    }

    if (existingResults && existingResults.length > 0) {
      // 기존 결과가 있으면 업데이트 (여러 개가 있으면 모두 업데이트)
      const { error: updateError } = await client
        .from("blood_test_results")
        .update({
          result_value: result.result_value,
          result_unit: result.result_unit,
          image_id: result.image_id, // 새로운 이미지로 업데이트
        })
        .eq("patient_id", result.patient_id)
        .eq("test_date", result.test_date)
        .eq("test_id", result.test_id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // 기존 결과가 없으면 새로 삽입
      const { error: insertError } = await client.from("blood_test_results").insert(result);

      if (insertError) {
        throw insertError;
      }
    }
  }
};

export const updateBloodTestResult = async (
  client: SupabaseClient<Database>,
  {
    patientId,
    testDate,
    standardName,
    resultValue,
  }: {
    patientId: string;
    testDate: string;
    standardName: string;
    resultValue: number;
  },
) => {
  // test_id 가져오기
  const { data: testType, error: testTypeError } = await client
    .from("blood_test_types")
    .select("test_id")
    .eq("standard_name", standardName)
    .maybeSingle();

  if (testTypeError) {
    throw testTypeError;
  }

  if (!testType) {
    throw new Error(`혈액검사 항목을 찾을 수 없습니다: ${standardName}`);
  }

  // 해당 날짜와 metric의 결과 찾기 (중복이 있을 수 있으므로 최신 것만 가져오기)
  const { data: existingResults, error: findError } = await client
    .from("blood_test_results")
    .select("result_id")
    .eq("patient_id", patientId)
    .eq("test_date", testDate)
    .eq("test_id", testType.test_id)
    .order("result_id", { ascending: false })
    .limit(1);

  if (findError) {
    throw findError;
  }

  if (existingResults && existingResults.length > 0) {
    // 기존 결과 업데이트 (여러 개가 있으면 모두 업데이트)
    const { error: updateError } = await client
      .from("blood_test_results")
      .update({ result_value: resultValue })
      .eq("patient_id", patientId)
      .eq("test_date", testDate)
      .eq("test_id", testType.test_id);

    if (updateError) {
      throw updateError;
    }
  } else {
    // 기존 결과가 없으면 새로 추가
    const { error: insertError } = await client.from("blood_test_results").insert({
      patient_id: patientId,
      test_id: testType.test_id,
      result_value: resultValue,
      result_unit: null,
      test_date: testDate,
      image_id: null,
    });

    if (insertError) {
      throw insertError;
    }
  }
};

export const deleteBloodTestResultsByDate = async (
  client: SupabaseClient<Database>,
  {
    patientId,
    testDate,
  }: {
    patientId: string;
    testDate: string;
  },
) => {
  const { error } = await client
    .from("blood_test_results")
    .delete()
    .eq("patient_id", patientId)
    .eq("test_date", testDate);

  if (error) {
    throw error;
  }
};
