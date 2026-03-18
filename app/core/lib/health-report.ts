/**
 * Health Report Request - API Client
 *
 * 동일 출처 API를 통해 n8n webhook으로 프록시 (CORS 회피)
 * 안내 메시지: DB(report_requests) 기준으로 표시 (API 200이 아닌 실제 저장 확정 후)
 */

/** 내 리포트 페이지 경로 (상품 목록) */
export const HEALTH_REPORT_PAGE_PATH = "/my/dashboard/health/report";

/** 건강 보고서 상품별 경로 */
export function getHealthReportProductPath(productId: string): string {
  return `${HEALTH_REPORT_PAGE_PATH}/${productId}`;
}

/** 건강 보고서 상세 경로 (상품별 요청 상세) */
export function getHealthReportDetailPath(
  productId: string,
  requestId: string,
): string {
  return `${HEALTH_REPORT_PAGE_PATH}/${productId}/${requestId}`;
}

/** 건강 보고서 카드 결제 후 세션에 저장되는 payload 키 */
export const HEALTH_REPORT_PENDING_KEY = "health_report_pending_payload";

/** 건강 리포트 요청 시 필요 포인트 (9,900원 = 9,900 포인트) - 기본 상품 */
export const HEALTH_REPORT_POINT_PRICE = 9_900;

/** 건강 보고서 상품 타입 */
export interface HealthReportProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  /** 결제용 checkout type (payment-constants.CheckoutType) */
  checkoutType: "health_report";
}

/** 구매 가능한 건강 보고서 상품 목록 (향후 추가 상품 확장) */
export const HEALTH_REPORT_PRODUCTS: readonly HealthReportProduct[] = [
  {
    id: "basic",
    name: "AI 기반 건강 전략 지도(기본)",
    description:
      "개인 기록 기반 건강 분석, 생활습관 및 영양 전략 제공, PDF 리포트 제공",
    price: 9_900,
    checkoutType: "health_report",
  },
] as const;

/** 기본 상품 ID (현재 DB의 report_requests는 모두 이 상품에 해당) */
export const DEFAULT_HEALTH_REPORT_PRODUCT_ID = "basic";

export function getHealthReportProduct(
  productId: string,
): HealthReportProduct | undefined {
  return HEALTH_REPORT_PRODUCTS.find((p) => p.id === productId);
}

export function getDefaultHealthReportProduct(): HealthReportProduct {
  const p = getHealthReportProduct(DEFAULT_HEALTH_REPORT_PRODUCT_ID);
  if (!p) throw new Error("Default health report product not found");
  return p;
}

/** 기존 코드 호환: 상품명 */
export const HEALTH_REPORT_PRODUCT_NAME =
  HEALTH_REPORT_PRODUCTS[0]?.name ?? "AI 기반 건강 전략 지도(기본)";

/** 기존 코드 호환: 상품 설명 */
export const HEALTH_REPORT_PRODUCT_DESCRIPTION =
  HEALTH_REPORT_PRODUCTS[0]?.description ??
  "개인 기록 기반 건강 분석, 생활습관 및 영양 전략 제공, PDF 리포트 제공";

/** 진행 중 상태일 때 표시할 안내 (DB에서 status requested 등 확인 후에만 사용) */
export const HEALTH_REPORT_PENDING_MESSAGE =
  "건강 리포트를 생성하고 있습니다. 1~3시간 정도 소요됩니다.";

/** 웹훅 전달 실패 시 사용자 안내 메시지 */
export const HEALTH_REPORT_WEBHOOK_FAILED_MESSAGE =
  "요청 전달에 실패했습니다. 잠시 후 다시 시도해 주세요.";

/** PDF 생성 실패 시 안내 */
export const HEALTH_REPORT_PDF_FAILED_MESSAGE =
  "PDF 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.";

/** 요청 실패 시 안내 (status=failed일 때) */
export const HEALTH_REPORT_FAILED_MESSAGE =
  "리포트 생성 중 오류가 발생했습니다. 잠시 후 다시 요청해 주세요.";

/** report_requests.status별 설정 (진행 흐름: requested → draft_ready → completed, failed 분기) */
export const REPORT_REQUEST_STATUS_CONFIG: Record<
  string,
  { label: string; description: string; order: number }
> = {
  requested: {
    label: "요청됨",
    description: "요청이 접수되었습니다. 워크플로우가 처리 중입니다.",
    order: 1,
  },
  draft_ready: {
    label: "초안 완성",
    description: "최종 리포트 JSON이 DB에 저장되었습니다. 초안을 확인할 수 있습니다.",
    order: 2,
  },
  under_review: {
    label: "검수 중",
    description: "AI 검토 및 품질 점검 중입니다.",
    order: 3,
  },
  completed: {
    label: "완료",
    description: "AI 검토를 통과했습니다. 최종 리포트를 확인하세요.",
    order: 4,
  },
  failed: {
    label: "요청 실패",
    description: "리포트 생성 중 오류가 발생했습니다.",
    order: -1,
  },
};

/**
 * report_html 생성이 허용되는 status
 * status가 이 값일 때만 report_json → HTML 변환 후 health_reports.report_html에 저장
 * (completed: AI 검토 통과 후 최종 본문 확정)
 */
export const REPORT_HTML_GENERATION_STATUSES: string[] = ["completed"];

/** 진행 단계 순서 (failed 제외) */
export const REPORT_STATUS_PROGRESS: string[] = [
  "requested",
  "draft_ready",
  "under_review",
  "completed",
];

/** 페이지당 카드 수 (리포트 목록 페이지네이션) */
export const HEALTH_REPORT_CARDS_PER_PAGE = 10;

/** 상태 배지에 초록색 불을 표시할 status (요청됨, 초안완성, 검수중, 완료) */
export const REPORT_STATUS_WITH_GREEN_DOT: ReadonlySet<string> = new Set([
  "requested",
  "draft_ready",
  "under_review",
  "completed",
]);

/** input_json 한글 라벨 (요약용) */
const TREATMENT_STAGE_LABELS: Record<string, string> = {
  surveillance: "경과관찰",
  chemo: "항암치료",
  radiation: "방사선치료",
  post_treatment_1y: "치료 후 1년 이내",
  other: "기타",
};

const TOP_CONCERN_LABELS: Record<string, string> = {
  fatigue: "피로",
  sleep: "수면",
  weight: "체중",
  stress_anxiety: "스트레스/불안",
  gut: "소화/장",
  exercise: "운동",
  metabolism: "대사",
  recurrence_worry: "재발 걱정",
  other: "기타",
};

const EXERCISE_LABELS: Record<string, string> = {
  none: "없음",
  "1": "주 1회",
  "2-3": "주 2~3회",
  "4plus": "주 4회 이상",
};

/** input_json을 요청 내용 요약 문자열로 변환 */
export function formatHealthReportInputSummary(
  input: Record<string, unknown> | null | undefined,
): string[] {
  if (!input || typeof input !== "object") return [];

  const parts: string[] = [];

  const stage = input.treatment_stage as string | undefined;
  if (stage && TREATMENT_STAGE_LABELS[stage]) {
    parts.push(`치료 단계: ${TREATMENT_STAGE_LABELS[stage]}`);
  }

  const cancer = input.cancer_type as string | undefined;
  if (cancer && String(cancer).trim()) {
    parts.push(`암종: ${String(cancer).trim()}`);
  }

  const concerns = input.top_concerns as string[] | undefined;
  if (Array.isArray(concerns) && concerns.length > 0) {
    const labels = concerns
      .map((c) => TOP_CONCERN_LABELS[String(c)] ?? c)
      .join(", ");
    parts.push(`관심 항목: ${labels}`);
  }

  const sleep = input.avg_sleep_hours;
  if (sleep != null && !Number.isNaN(Number(sleep))) {
    parts.push(`평균 수면: ${Number(sleep)}시간`);
  }

  const ex = input.weekly_exercise_freq as string | undefined;
  if (ex && EXERCISE_LABELS[ex]) {
    parts.push(`운동 빈도: ${EXERCISE_LABELS[ex]}`);
  }

  const goal = input.goal_8weeks as string | undefined;
  if (goal && String(goal).trim()) {
    const g = String(goal).trim();
    parts.push(`8주 목표: ${g.length > 60 ? g.slice(0, 60) + "…" : g}`);
  }

  const meds = input.meds_or_supps as string | undefined;
  if (meds && String(meds).trim()) {
    const m = String(meds).trim();
    parts.push(`복용 중: ${m.length > 40 ? m.slice(0, 40) + "…" : m}`);
  }

  return parts;
}

/** request_id를 짧게 표시 (앞 8자) */
export function shortRequestId(id: string): string {
  if (!id || id.length < 8) return id;
  return id.slice(0, 8);
}

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
