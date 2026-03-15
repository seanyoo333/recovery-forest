/**
 * 결제 상수 통합 모듈
 *
 * 이원화 결제 구조:
 * - point: 포인트 충전 → point_payments + profiles.points
 * - health_report: 건강 보고서 카드 결제 → payments + report_requests
 *
 * 향후 챗봇 등 포인트 사용 서비스는 포인트 충전 후 포인트로 결제하는 흐름으로 확장합니다.
 */
import { HEALTH_REPORT_POINT_PRICE } from "./health-report";
import { POINT_PACKAGES } from "./point-packages";

/** 체크아웃 URL query type */
export type CheckoutType = "point" | "health_report";

/** Toss 결제 metadata.type 값 */
export const PAYMENT_METADATA_TYPE = {
  /** 포인트 충전 → point_payments 저장 */
  POINT_PURCHASE: "point_purchase",
  /** 건강 보고서 카드 결제 → payments 저장, report_requests 생성 */
  HEALTH_REPORT: "health_report",
} as const;

/** 허용 결제 금액 화이트리스트 (보안 검증용) */
export const ALLOWED_PAYMENT_AMOUNTS = [
  ...POINT_PACKAGES.map((p) => p.amount),
  HEALTH_REPORT_POINT_PRICE,
] as const;

export type AllowedPaymentAmount = (typeof ALLOWED_PAYMENT_AMOUNTS)[number];

export function isAllowedPaymentAmount(amount: number): amount is AllowedPaymentAmount {
  return (ALLOWED_PAYMENT_AMOUNTS as readonly number[]).includes(amount);
}

/** 체크아웃 페이지 경로 */
export const CHECKOUT_PATH = "/payments/checkout";

export function getCheckoutUrl(type: CheckoutType, packageId?: string): string {
  const params = new URLSearchParams();
  params.set("type", type);
  if (type === "point" && packageId) {
    params.set("package", packageId);
  }
  return `${CHECKOUT_PATH}?${params.toString()}`;
}
