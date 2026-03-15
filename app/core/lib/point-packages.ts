/**
 * 포인트 충전 패키지 설정
 *
 * 포인트 구매(충전) 전용. 건강보고서·챗봇 등 서비스 이용은
 * 별도 결제 흐름(포인트 차감 또는 카드 결제)으로 처리합니다.
 */

export type PointPackageId = "10000" | "20000" | "30000";

export interface PointPackage {
  id: PointPackageId;
  amount: number; // 결제 금액 (원)
  points: number; // 적립 포인트 (보너스 포함)
  bonusPercent: number; // 보너스 %
  label: string;
  description: string;
}

/** 포인트 충전 패키지 목록 */
export const POINT_PACKAGES: PointPackage[] = [
  {
    id: "10000",
    amount: 10_000,
    points: 10_500,
    bonusPercent: 5,
    label: "10,000원",
    description: "10,500P (5% 보너스)",
  },
  {
    id: "20000",
    amount: 20_000,
    points: 21_400,
    bonusPercent: 7,
    label: "20,000원",
    description: "21,400P (7% 보너스)",
  },
  {
    id: "30000",
    amount: 30_000,
    points: 33_000,
    bonusPercent: 10,
    label: "30,000원",
    description: "33,000P (10% 보너스)",
  },
];

export function getPointPackage(id: PointPackageId): PointPackage | undefined {
  return POINT_PACKAGES.find((p) => p.id === id);
}

export function getDefaultPointPackage(): PointPackage {
  return POINT_PACKAGES[0];
}

export function isValidPointPackageId(id: string): id is PointPackageId {
  return ["10000", "20000", "30000"].includes(id);
}
