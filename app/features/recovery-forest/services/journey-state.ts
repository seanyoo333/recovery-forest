/**
 * 여정(journey) 상태 머신 — 순수 로직. DB 의존 없음.
 *
 * consented → pre_surveyed → prescribed → (in_program) → post_surveyed → reported
 * 어떤 상태에서든 failed 로 전이 가능.
 */

export const JOURNEY_STATUSES = [
  "consented",
  "pre_surveyed",
  "prescribed",
  "in_program",
  "post_surveyed",
  "reported",
  "failed",
] as const;

export type JourneyStatus = (typeof JOURNEY_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<JourneyStatus, JourneyStatus[]> = {
  consented: ["pre_surveyed", "failed"],
  pre_surveyed: ["prescribed", "failed"],
  // 처방 후 바로 사후설문(in_program 생략)도 허용
  prescribed: ["in_program", "post_surveyed", "failed"],
  in_program: ["post_surveyed", "failed"],
  post_surveyed: ["reported", "failed"],
  reported: [],
  failed: [],
};

export class InvalidJourneyTransitionError extends Error {
  constructor(
    public readonly from: JourneyStatus,
    public readonly to: JourneyStatus,
  ) {
    super(`Invalid journey transition: ${from} → ${to}`);
    this.name = "InvalidJourneyTransitionError";
  }
}

export function canTransition(from: JourneyStatus, to: JourneyStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: JourneyStatus,
  to: JourneyStatus,
): void {
  if (!canTransition(from, to)) {
    throw new InvalidJourneyTransitionError(from, to);
  }
}

export function isTerminal(status: JourneyStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

/**
 * 토큰 라우팅 — 현재 상태에서 사용자를 보내야 할 여정 단계.
 * 페이지 로더가 단계 불일치 시 리다이렉트 대상으로 쓴다.
 */
export type JourneyStep =
  | "pre-survey"
  | "prescription"
  | "post-survey"
  | "report";

export function stepForStatus(status: JourneyStatus): JourneyStep {
  switch (status) {
    case "consented":
      return "pre-survey";
    case "pre_surveyed":
    case "prescribed":
      return "prescription";
    case "in_program":
      return "post-survey";
    case "post_surveyed":
    case "reported":
      return "report";
    case "failed":
      return "prescription";
  }
}
