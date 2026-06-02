import { redirect } from "react-router";

import type { Route } from "./+types/post-survey";

import { getServerEnv } from "~/lib/env.server";
import { makeRecoveryServiceClient } from "~/lib/supabase.server";

import { postSurveySchema } from "../schemas/post-survey.schema";
import {
  buildReportReadyEmail,
  resolveEmailConfig,
  sendResendEmail,
} from "../services/email.service";
import type { TargetOutcome } from "../schemas/prescription.schema";
import {
  getJourneyByToken,
  markJourneyFailed,
  transitionJourney,
} from "../services/journey.repository";
import {
  getCitations,
  getPrescriptionByJourneyId,
} from "../services/prescription.repository";
import { buildReport } from "../services/reflection.service";
import { saveCompletedReport } from "../services/report.repository";
import {
  getPreSurvey,
  insertPostSurvey,
  rowToWellnessScores,
} from "../services/survey.repository";

export async function action({ request, params }: Route.ActionArgs) {
  const token = params.token;
  if (!token) throw new Response("token missing", { status: 400 });

  const formData = await request.formData();
  const raw = {
    sleep_score: Number(formData.get("sleep_score") ?? 0),
    fatigue_score: Number(formData.get("fatigue_score") ?? 0),
    mood_score: Number(formData.get("mood_score") ?? 0),
    stress_score: Number(formData.get("stress_score") ?? 0),
    impression: String(formData.get("impression") ?? ""),
  };

  const parsed = postSurveySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "입력값을 다시 확인해주세요.",
        },
      },
      { status: 400 },
    );
  }

  const client = makeRecoveryServiceClient();
  const journey = await getJourneyByToken(client, token);
  if (!journey) throw new Response("journey not found", { status: 404 });

  // 처방 이전이면 사후설문을 받을 수 없다.
  if (journey.status === "consented" || journey.status === "pre_surveyed") {
    return redirect(`/journey/${token}/prescription`);
  }
  // 이미 리포트가 나왔다면 리포트로.
  if (journey.status === "reported") {
    return redirect(`/journey/${token}/report`);
  }

  try {
    await insertPostSurvey(client, journey.id, parsed.data);
    if (journey.status !== "post_surveyed") {
      await transitionJourney(client, token, "post_surveyed");
    }

    const preRow = await getPreSurvey(client, journey.id);
    const prescription = await getPrescriptionByJourneyId(client, journey.id);
    const pre = preRow
      ? rowToWellnessScores(preRow)
      : { sleep: 5, fatigue: 5, mood: 5, stress: 5 };
    const post = {
      sleep: parsed.data.sleep_score,
      fatigue: parsed.data.fatigue_score,
      mood: parsed.data.mood_score,
      stress: parsed.data.stress_score,
    };
    const targetOutcome =
      (prescription?.target_outcome as TargetOutcome | null) ?? [];
    const citations = prescription
      ? await getCitations(client, prescription.id)
      : [];

    const report = buildReport({
      journeyToken: token,
      pre,
      post,
      targetOutcome,
      citations,
    });

    await saveCompletedReport(client, {
      journeyId: journey.id,
      deltas: report.deltas,
      hitMiss: report.hit_miss,
      narrative: report.narrative ?? "",
      citations: report.citations,
    });
    await transitionJourney(client, token, "reported");

    // 리포트 완료 이메일 (이메일 있고 Resend 설정 시; 무이메일이면 no-op)
    const emailCfg = resolveEmailConfig(getServerEnv());
    if (journey.email && emailCfg) {
      const origin = new URL(request.url).origin;
      void sendResendEmail(
        journey.email,
        buildReportReadyEmail(origin, token),
        emailCfg,
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "report build failed";
    await markJourneyFailed(client, token, msg).catch(() => {});
  }

  return redirect(`/journey/${token}/report`);
}

export default function PostSurveyApiRoute() {
  return null;
}
