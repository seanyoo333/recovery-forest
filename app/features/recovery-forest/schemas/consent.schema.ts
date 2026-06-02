import { z } from "zod";

/** 현재 동의 문구 버전. 문구 변경 시 함께 올린다. */
export const CONSENT_VERSION = "consent-v1";

/**
 * 동의 화면 제출 스키마.
 * - 자가보고 수집은 명시적 동의(consent_agreed=true) 후에만 허용한다.
 * - email 은 리포트 매직링크 발송 용도(선택). 데모 무이메일 모드에서는 비워둘 수 있다.
 */
export const consentSchema = z.object({
  email: z
    .string()
    .trim()
    .email("이메일 형식을 확인해주세요")
    .optional()
    .or(z.literal("")),
  consent_agreed: z.literal(true, {
    errorMap: () => ({ message: "수집·이용에 동의해야 진행할 수 있어요" }),
  }),
  consent_version: z.string().min(1).default(CONSENT_VERSION),
});

export type ConsentInput = z.infer<typeof consentSchema>;
