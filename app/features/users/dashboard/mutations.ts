import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database as DbTypes, Json } from "database.types";

import type {
  Category,
  GridCellValue,
  GridOptionKind,
  RoutineDailyGridLog,
  RoutineGridOption,
} from "./types";

import type { Database } from "~/core/lib/supa-client.server";

import { DEFAULT_GRID_OPTIONS } from "./constants";

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

export type MedicalRecordTranscriptEntry = {
  test_date: string;
  test_content: string;
  clinical_information: string;
  finding: string;
  conclusion: string;
};

/** 의무기록사본 항목을 patient_health_profiles.medical_record_transcripts에 추가 */
export const appendMedicalRecordTranscript = async (
  client: SupabaseClient<Database>,
  {
    patientId,
    entry,
  }: {
    patientId: string;
    entry: MedicalRecordTranscriptEntry;
  },
) => {
  const { data: existing, error: fetchError } = await client
    .from("patient_health_profiles")
    .select("medical_record_transcripts")
    .eq("patient_id", patientId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const current =
    (existing?.medical_record_transcripts as MedicalRecordTranscriptEntry[]) ??
    [];
  const updated = [...current, entry];

  const { error: updateError } = await client
    .from("patient_health_profiles")
    .update({ medical_record_transcripts: updated })
    .eq("patient_id", patientId);

  if (updateError) throw updateError;
};

/** 해당 검사일의 의무기록 항목을 모두 교체 (수정) */
export const setMedicalRecordsForDate = async (
  client: SupabaseClient<Database>,
  {
    patientId,
    testDate,
    entries,
  }: {
    patientId: string;
    testDate: string;
    entries: Array<
      Pick<
        MedicalRecordTranscriptEntry,
        | "test_content"
        | "clinical_information"
        | "finding"
        | "conclusion"
      >
    >;
  },
) => {
  const { data: existing, error: fetchError } = await client
    .from("patient_health_profiles")
    .select("medical_record_transcripts")
    .eq("patient_id", patientId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const current =
    (existing?.medical_record_transcripts as MedicalRecordTranscriptEntry[]) ??
    [];
  const filtered = current.filter((e) => e.test_date !== testDate);
  const withDate: MedicalRecordTranscriptEntry[] = entries.map((e) => ({
    test_date: testDate,
    test_content: e.test_content,
    clinical_information: e.clinical_information,
    finding: e.finding,
    conclusion: e.conclusion,
  }));
  const updated = [...filtered, ...withDate];

  const { error: updateError } = await client
    .from("patient_health_profiles")
    .update({ medical_record_transcripts: updated })
    .eq("patient_id", patientId);

  if (updateError) throw updateError;
};

/** 해당 검사일의 의무기록 항목을 모두 삭제 */
export const deleteMedicalRecordsForDate = async (
  client: SupabaseClient<Database>,
  {
    patientId,
    testDate,
  }: {
    patientId: string;
    testDate: string;
  },
) => {
  const { data: existing, error: fetchError } = await client
    .from("patient_health_profiles")
    .select("medical_record_transcripts")
    .eq("patient_id", patientId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const current =
    (existing?.medical_record_transcripts as MedicalRecordTranscriptEntry[]) ??
    [];
  const filtered = current.filter((e) => e.test_date !== testDate);

  const { error: updateError } = await client
    .from("patient_health_profiles")
    .update({ medical_record_transcripts: filtered })
    .eq("patient_id", patientId);

  if (updateError) throw updateError;
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
  const { error } = await client
    .from("blood_test_images")
    .update({ test_date: testDate })
    .eq("image_id", imageId);
  if (error) {
    throw error;
  }
};

type BloodTestTypeUpsertInput = {
  standard_name: string;
  unit: string;
  reference_min?: number | null;
  reference_max?: number | null;
  reference_note?: string | null;
  clinical_significance?: string | null;
  descriptions?: Record<string, unknown>;
  is_derived_metric?: boolean;
  derived_formula?: string | null;
  evidence_source_ids?: string[];
};

type BloodTestTypeInsertRow =
  Database["public"]["Tables"]["blood_test_types"]["Insert"];

/**
 * 스키마에 없는 필드(reference_note, 파생 지표 메타 등)는 `descriptions` JSON에 합칩니다.
 */
function mergeBloodTestTypeDescriptions(
  input: Omit<BloodTestTypeUpsertInput, "standard_name" | "unit">,
): Json | null {
  const merged: Record<string, unknown> = { ...(input.descriptions ?? {}) };
  if (input.reference_note != null && input.reference_note !== "") {
    merged.reference_note = input.reference_note;
  }
  if (input.is_derived_metric !== undefined) {
    merged.is_derived_metric = input.is_derived_metric;
  }
  if (input.derived_formula != null && input.derived_formula !== "") {
    merged.derived_formula = input.derived_formula;
  }
  if (input.evidence_source_ids && input.evidence_source_ids.length > 0) {
    merged.evidence_source_ids = input.evidence_source_ids;
  }
  if (Object.keys(merged).length === 0) return null;
  return JSON.parse(JSON.stringify(merged)) as Json;
}

function toBloodTestTypeInsertRow(
  type: BloodTestTypeUpsertInput,
): BloodTestTypeInsertRow {
  return {
    standard_name: type.standard_name.toLowerCase().trim(),
    unit: type.unit,
    reference_min: type.reference_min ?? null,
    reference_max: type.reference_max ?? null,
    clinical_significance: type.clinical_significance ?? null,
    descriptions: mergeBloodTestTypeDescriptions(type),
  };
}

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
    types: BloodTestTypeUpsertInput[];
  },
) => {
  const insertRows = types.map(toBloodTestTypeInsertRow);

  // Upsert 사용 (ON CONFLICT DO NOTHING - 기존 값이 있으면 업데이트하지 않음)
  const { data, error } = await client
    .from("blood_test_types")
    .upsert(insertRows, {
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
      const { error: insertError } = await client
        .from("blood_test_results")
        .insert(result);

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
    const { error: insertError } = await client
      .from("blood_test_results")
      .insert({
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

/**
 * Health Habits Mutations
 */

/**
 * 루틴 그리드 로그 upsert
 */
export async function upsertRoutineDailyGridLog(
  client: SupabaseClient<Database>,
  userId: string,
  logDate: string,
  payload: GridCellValue,
) {
  const { error } = await client.from("routine_daily_grid_logs").upsert(
    {
      user_id: userId,
      log_date: logDate,
      time_block: payload.time_block,
      category: payload.category,
      option_id: payload.option_id,
      template_id: payload.template_id,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,log_date,time_block,category",
    },
  );

  if (error) throw error;
}

// 하위 호환성을 위한 별칭
export const upsertDailyGridLog = upsertRoutineDailyGridLog;

/**
 * 루틴 그리드 옵션 생성/수정
 */
export async function upsertRoutineGridOption(
  client: SupabaseClient<Database>,
  userId: string,
  payload: {
    id?: string;
    category: Category;
    label: string;
    kind: GridOptionKind;
    template_id?: string | null;
    sort_order?: number;
  },
) {
  const { error } = await client.from("routine_grid_options").upsert(
    {
      ...(payload.id && { id: payload.id }),
      user_id: userId,
      category: payload.category,
      label: payload.label,
      kind: payload.kind,
      template_id: payload.template_id ?? null,
      sort_order: payload.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  );

  if (error) throw error;
}

// 하위 호환성을 위한 별칭
export const upsertGridOption = upsertRoutineGridOption;

/**
 * 루틴 템플릿 생성/수정
 */
export async function upsertRoutineTemplate(
  client: SupabaseClient<Database>,
  userId: string,
  payload: {
    id?: string;
    section_type: Category;
    name: string;
    notes?: string | null;
    sort_order?: number;
  },
) {
  const { data, error } = await client
    .from("routine_templates")
    .upsert(
      {
        ...(payload.id && { id: payload.id }),
        user_id: userId,
        section_type: payload.section_type,
        name: payload.name,
        notes: payload.notes ?? null,
        sort_order: payload.sort_order ?? 0,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 하위 호환성을 위한 별칭
export const upsertSectionTemplate = upsertRoutineTemplate;

/**
 * 루틴 아이템 upsert (배치)
 */
export async function upsertRoutineItems(
  client: SupabaseClient<Database>,
  templateId: string,
  items: Array<{
    id?: string;
    label: string;
    ingredient_id?: string | null;
    amount_num?: number | null;
    amount_unit?: string | null;
    sort_order: number;
    meta?: Record<string, unknown> | null;
  }>,
) {
  // 기존 아이템 삭제 후 새로 삽입
  const { error: deleteError } = await client
    .from("routine_items")
    .delete()
    .eq("template_id", templateId);

  if (deleteError) throw deleteError;

  // 빈 label을 가진 아이템 필터링
  const validItems = items.filter(
    (item) => item.label && item.label.trim().length > 0,
  );

  if (validItems.length === 0) return;

  const { error } = await client.from("routine_items").insert(
    validItems.map((item) => ({
      template_id: templateId,
      label: item.label.trim(),
      ingredient_id: item.ingredient_id ?? null,
      amount_num: item.amount_num ?? null,
      amount_unit: item.amount_unit ?? null,
      sort_order: item.sort_order,
      meta: (item.meta ??
        null) as DbTypes["public"]["Tables"]["routine_items"]["Insert"]["meta"],
    })),
  );

  if (error) throw error;
}

// 하위 호환성을 위한 별칭
export const upsertSectionItems = upsertRoutineItems;

/**
 * 기본 루틴 그리드 옵션 초기화
 */
export async function initializeDefaultRoutineGridOptions(
  client: SupabaseClient<Database>,
  userId: string,
) {
  // 각 카테고리별로 기본 옵션이 있는지 확인
  for (const [category, defaultOptions] of Object.entries(
    DEFAULT_GRID_OPTIONS,
  ) as [Category, (typeof DEFAULT_GRID_OPTIONS)[Category]][]) {
    // 해당 카테고리의 활성 옵션 확인
    const { data: existingOptions } = await client
      .from("routine_grid_options")
      .select("id, label")
      .eq("user_id", userId)
      .eq("category", category)
       .eq("is_active", true);

    // 기본 옵션이 없으면 모두 생성
    if (!existingOptions || existingOptions.length === 0) {
      const optionsToInsert = defaultOptions.map((opt) => ({
        user_id: userId,
        category,
        label: opt.label,
        kind: opt.kind,
        template_id: null,
        sort_order: opt.sort_order,
        is_active: true,
      }));

      const { error } = await client
        .from("routine_grid_options")
        .insert(optionsToInsert);

      if (error) throw error;
    } else {
      // 기존 옵션이 있으면 "없음" 옵션이 있는지 확인하고 없으면 추가
      const hasNoneOption = existingOptions.some(
        (opt) => opt.label === "없음",
      );

      if (!hasNoneOption) {
        const noneOption = defaultOptions.find((opt) => opt.label === "없음");
        if (noneOption) {
          const { error } = await client
            .from("routine_grid_options")
            .insert({
              user_id: userId,
              category,
              label: noneOption.label,
              kind: noneOption.kind,
              template_id: null,
              sort_order: noneOption.sort_order,
              is_active: true,
            });

          if (error) throw error;
        }
      }
    }
  }
}

// 하위 호환성을 위한 별칭
export const initializeDefaultGridOptions =
  initializeDefaultRoutineGridOptions;

/**
 * 스트릭 정보 업데이트 또는 생성
 */
export const upsertStreak = async (
  client: SupabaseClient<Database>,
  {
    userId,
    currentStreak,
    longestStreak,
    lastLogDate,
  }: {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastLogDate: string | null;
  },
) => {
  const { error } = await client.from("streaks").upsert(
    {
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_log_date: lastLogDate,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw error;
  }
};
