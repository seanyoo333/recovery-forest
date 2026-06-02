import { redirect } from "react-router";

import type { Route } from "./+types/pre-survey";

import { getServerEnv } from "~/lib/env.server";
import { makeRecoveryServiceClient } from "~/lib/supabase.server";

import type { RecommendationInput } from "../schemas/input.schema";
import { preSurveySchema } from "../schemas/pre-survey.schema";
import {
  getJourneyByToken,
  markJourneyFailed,
  transitionJourney,
} from "../services/journey.repository";
import {
  createPrescription,
  insertCitations,
  listEvidenceByMechanisms,
  pickForestPlace,
} from "../services/prescription.repository";
import { buildStubPrescription } from "../services/prescription.service";
import {
  callPrescriptionWebhook,
  N8nWebhookError,
} from "../services/n8n-client";
import { insertPreSurvey } from "../services/survey.repository";

export async function action({ request, params }: Route.ActionArgs) {
  const token = params.token;
  if (!token) throw new Response("token missing", { status: 400 });

  const formData = await request.formData();
  const monthsRaw = String(formData.get("months_since_treatment") ?? "").trim();
  const raw = {
    user_sido: String(formData.get("user_sido") ?? ""),
    user_sigungu: String(formData.get("user_sigungu") ?? ""),
    user_priorities: formData.getAll("user_priorities").map((v) => String(v)),
    user_fitness_level: String(formData.get("user_fitness_level") ?? ""),
    user_travel_time_min: Number(formData.get("user_travel_time_min") ?? 0),
    user_preferred_activity: String(formData.get("user_preferred_activity") ?? ""),
    sleep_score: Number(formData.get("sleep_score") ?? 0),
    fatigue_score: Number(formData.get("fatigue_score") ?? 0),
    mood_score: Number(formData.get("mood_score") ?? 0),
    stress_score: Number(formData.get("stress_score") ?? 0),
    months_since_treatment: monthsRaw === "" ? null : Number(monthsRaw),
  };

  const parsed = preSurveySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "입력값을 다시 확인해주세요.",
          detail: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const client = makeRecoveryServiceClient();
  const journey = await getJourneyByToken(client, token);
  if (!journey) throw new Response("journey not found", { status: 404 });

  // 이미 사전설문을 마쳤다면 현재 단계로 보낸다.
  if (journey.status !== "consented") {
    return redirect(`/journey/${token}/prescription`);
  }

  const data = parsed.data;
  const wellness = {
    sleep: data.sleep_score,
    fatigue: data.fatigue_score,
    mood: data.mood_score,
    stress: data.stress_score,
  };
  const recommendationInput: RecommendationInput = {
    user_sido: data.user_sido,
    user_sigungu: data.user_sigungu,
    user_priorities: data.user_priorities,
    user_fitness_level: data.user_fitness_level,
    user_travel_time_min: data.user_travel_time_min,
    user_preferred_activity: data.user_preferred_activity,
  };

  try {
    await insertPreSurvey(client, journey.id, data);
    await transitionJourney(client, token, "pre_surveyed");
  } catch {
    return Response.json(
      {
        ok: false,
        error: {
          code: "PRE_SURVEY_FAILED",
          message: "설문 저장에 실패했어요. 잠시 후 다시 시도해주세요.",
        },
      },
      { status: 500 },
    );
  }

  const env = getServerEnv();

  if (env.PRESCRIPTION_MODE === "stub") {
    try {
      const place = await pickForestPlace(client, data.user_sido);
      const placeName = place?.name ?? "가까운 치유의 숲";
      const stub = buildStubPrescription({
        wellness,
        recommendationInput,
        monthsSinceTreatment: data.months_since_treatment ?? null,
        placeName,
      });
      const prescription = await createPrescription(client, {
        journeyId: journey.id,
        forestPlaceId: place?.id ?? null,
        status: "completed",
        actionPlan: stub.actionPlan,
        targetOutcome: stub.targetOutcome,
        postMeasurementPlan: stub.postMeasurementPlan,
        aiSummary: stub.aiSummary,
        caution: stub.caution,
        llmModel: "stub",
        llmPromptVersion: "stub-v1",
      });

      const sources = await listEvidenceByMechanisms(client, stub.mechanisms);
      const citations = stub.mechanisms.map((mechanism) => {
        const source = sources.find((s) => s.mechanism === mechanism);
        return {
          mechanism,
          evidenceSourceId: source?.id ?? null,
          relevanceNote: source?.summary ?? null,
        };
      });
      await insertCitations(client, prescription.id, citations);
      await transitionJourney(client, token, "prescribed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "stub prescription failed";
      await markJourneyFailed(client, token, msg).catch(() => {});
    }
  }
  if (env.PRESCRIPTION_MODE === "n8n") {
    if (!env.N8N_PRESCRIBE_WEBHOOK_URL || !env.N8N_WEBHOOK_SECRET) {
      await markJourneyFailed(
        client,
        token,
        "n8n prescribe webhook not configured",
      ).catch(() => {});
    } else {
      // 폴링 대상이 되도록 pending 처방 행을 먼저 만든다. n8n 이 완료로 갱신한다.
      try {
        await createPrescription(client, {
          journeyId: journey.id,
          status: "pending",
        });
      } catch {
        // pending 생성 실패는 무시 (n8n 이 새로 insert 할 수도 있음)
      }
      void callPrescriptionWebhook(
        {
          journey_token: token,
          wellness,
          months_since_treatment: data.months_since_treatment ?? null,
          recommendation_input: recommendationInput,
          requested_at: new Date().toISOString(),
        },
        {
          webhookUrl: env.N8N_PRESCRIBE_WEBHOOK_URL,
          webhookSecret: env.N8N_WEBHOOK_SECRET,
        },
      ).catch(async (err: unknown) => {
        const msg =
          err instanceof N8nWebhookError
            ? `${err.code}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "prescribe webhook error";
        await markJourneyFailed(client, token, msg).catch(() => {});
      });
    }
  }

  return redirect(`/journey/${token}/prescription`);
}

export default function PreSurveyApiRoute() {
  return null;
}
