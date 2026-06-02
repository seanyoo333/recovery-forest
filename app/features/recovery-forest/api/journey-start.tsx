import { redirect } from "react-router";

import type { Route } from "./+types/journey-start";

import { getServerEnv } from "~/lib/env.server";
import { makeRecoveryServiceClient } from "~/lib/supabase.server";

import { CONSENT_VERSION, consentSchema } from "../schemas/consent.schema";
import {
  buildJourneyLinkEmail,
  resolveEmailConfig,
  sendResendEmail,
} from "../services/email.service";
import { createJourney } from "../services/journey.repository";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const agreedRaw = String(formData.get("consent_agreed") ?? "");
  const emailRaw = String(formData.get("email") ?? "").trim();

  const parsed = consentSchema.safeParse({
    email: emailRaw,
    consent_agreed: agreedRaw === "on" || agreedRaw === "true",
    consent_version: CONSENT_VERSION,
  });
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "수집·이용 동의 후 진행할 수 있어요.",
        },
      },
      { status: 400 },
    );
  }

  const client = makeRecoveryServiceClient();
  const token = crypto.randomUUID();

  try {
    await createJourney(client, {
      token,
      email: parsed.data.email || null,
      consentVersion: parsed.data.consent_version,
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error: {
          code: "JOURNEY_CREATE_FAILED",
          message: "여정 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
        },
      },
      { status: 500 },
    );
  }

  // 이메일이 있고 Resend 가 설정됐으면 여정 링크를 보낸다(무이메일이면 no-op).
  const emailCfg = resolveEmailConfig(getServerEnv());
  if (parsed.data.email && emailCfg) {
    const origin = new URL(request.url).origin;
    void sendResendEmail(
      parsed.data.email,
      buildJourneyLinkEmail(origin, token),
      emailCfg,
    );
  }

  return redirect(`/journey/${token}/pre-survey`);
}

export default function JourneyStartApiRoute() {
  return null;
}
