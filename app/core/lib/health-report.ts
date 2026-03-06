/**
 * Health Report Request - API Client
 *
 * 동일 출처 API를 통해 n8n webhook으로 프록시 (CORS 회피)
 * 안내 메시지: DB(report_requests) 기준으로 표시 (API 200이 아닌 실제 저장 확정 후)
 */

/** 내 리포트 페이지 경로 */
export const HEALTH_REPORT_PAGE_PATH = "/my/dashboard/health/report";

/** 진행 중 상태일 때 표시할 안내 (DB에서 status requested 등 확인 후에만 사용) */
export const HEALTH_REPORT_PENDING_MESSAGE =
  "건강 리포트를 생성하고 있습니다. 1~3시간 정도 소요됩니다.";

/** 웹훅 전달 실패 시 사용자 안내 메시지 */
export const HEALTH_REPORT_WEBHOOK_FAILED_MESSAGE =
  "요청 전달에 실패했습니다. 잠시 후 다시 시도해 주세요.";

export const TREATMENT_STAGES = [
  "surveillance",
  "chemo",
  "radiation",
  "post_treatment_1y",
  "other",
] as const;

export const TOP_CONCERNS = [
  "fatigue",
  "sleep",
  "weight",
  "stress_anxiety",
  "gut",
  "exercise",
  "metabolism",
  "recurrence_worry",
  "other",
] as const;

export const WEEKLY_EXERCISE_FREQ = [
  "none",
  "1",
  "2-3",
  "4plus",
] as const;

export type TreatmentStage = (typeof TREATMENT_STAGES)[number];
export type TopConcern = (typeof TOP_CONCERNS)[number];
export type WeeklyExerciseFreq = (typeof WEEKLY_EXERCISE_FREQ)[number];

/**
 * API 요청 페이로드 (user_id는 서버에서 세션으로 확정)
 */
export interface HealthReportPayload {
  user_id?: string;
  treatment_stage: TreatmentStage;
  cancer_type?: string;
  top_concerns: TopConcern[];
  avg_sleep_hours: number;
  weekly_exercise_freq: WeeklyExerciseFreq;
  meds_or_supps?: string;
  goal_8weeks?: string;
  source: {
    page: string;
    cta: string;
  };
}

export interface RequestHealthReportResult {
  success: boolean;
  error?: string;
}

export async function requestHealthReport(
  payload: HealthReportPayload,
): Promise<RequestHealthReportResult> {
  try {
    const res = await fetch("/api/health-report-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as
      | { success?: boolean; error?: string }
      | undefined;

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `요청 실패 (${res.status})`,
      };
    }
    return { success: data?.success ?? true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "네트워크 오류";
    return { success: false, error: message };
  }
}
