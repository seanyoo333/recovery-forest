/**
 * 리포트 매직링크 이메일 (Resend). 키가 없으면 무이메일 모드로 no-op.
 * 빌더는 순수 함수(테스트 가능), 발송만 네트워크.
 */

export type EmailConfig = { apiKey: string; from: string };

export type EmailEnv = {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
};

/** Resend 설정이 갖춰졌는지 (무이메일 데모 판별) */
export function resolveEmailConfig(env: EmailEnv): EmailConfig | null {
  if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) {
    return { apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM_EMAIL };
  }
  return null;
}

export type EmailContent = { subject: string; html: string };

function link(origin: string, token: string, step: string): string {
  return `${origin}/journey/${token}/${step}`;
}

/** 처방 준비 완료 — 여정 이어가기 링크 */
export function buildJourneyLinkEmail(
  origin: string,
  token: string,
): EmailContent {
  const url = link(origin, token, "prescription");
  return {
    subject: "[회복의 숲] 산림치유 처방이 준비됐어요",
    html: [
      "<p>안녕하세요, 회복의 숲입니다.</p>",
      "<p>입력해주신 자가보고를 바탕으로 맞춤 산림치유 처방이 준비됐습니다.</p>",
      `<p><a href="${url}">처방 확인하기</a></p>`,
      "<p>본 안내는 자가보고 기반 정보이며 의학적 진단이 아닙니다.</p>",
    ].join("\n"),
  };
}

/** 리포트 완성 — 변화 리포트 링크 */
export function buildReportReadyEmail(
  origin: string,
  token: string,
): EmailContent {
  const url = link(origin, token, "report");
  return {
    subject: "[회복의 숲] 방문 전후 변화 리포트가 도착했어요",
    html: [
      "<p>안녕하세요, 회복의 숲입니다.</p>",
      "<p>방문 전후 자가보고를 비교한 변화 리포트가 완성됐습니다.</p>",
      `<p><a href="${url}">리포트 보기</a></p>`,
      "<p>본 리포트는 자가보고 데이터를 정리한 것으로 건강 상태 판단은 전문의와 상담하세요.</p>",
    ].join("\n"),
  };
}

/** Resend 발송. 실패는 false 로 흡수(여정 진행을 막지 않음). */
export async function sendResendEmail(
  to: string,
  content: EmailContent,
  config: EmailConfig,
): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        from: config.from,
        to,
        subject: content.subject,
        html: content.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
