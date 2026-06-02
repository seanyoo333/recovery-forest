import { redirect } from "react-router";

import type { Route } from "./+types/recommend";

import { getServerEnv } from "~/lib/env.server";
import { makeRecoveryServerClient } from "~/lib/supabase.server";

import { recommendationInputSchema } from "../schemas/input.schema";
import {
  callRecommendationWebhook,
  N8nWebhookError,
} from "../services/n8n-client";
import {
  createPendingSession,
  markSessionFailed,
} from "../services/recommendation.repository";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const raw = {
    user_sido: String(formData.get("user_sido") ?? ""),
    user_sigungu: String(formData.get("user_sigungu") ?? ""),
    user_priorities: formData.getAll("user_priorities").map((v) => String(v)),
    user_fitness_level: String(formData.get("user_fitness_level") ?? ""),
    user_travel_time_min: Number(formData.get("user_travel_time_min") ?? 0),
    user_preferred_activity: String(formData.get("user_preferred_activity") ?? ""),
  };
  const parsed = recommendationInputSchema.safeParse(raw);
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

  const env = getServerEnv();
  const sessionId = crypto.randomUUID();
  const userRegion = `${parsed.data.user_sido} ${parsed.data.user_sigungu}`.trim();

  const [client] = makeRecoveryServerClient(request);

  try {
    await createPendingSession(client, {
      sessionId,
      userRegion,
      input: parsed.data,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "SESSION_CREATE_FAILED",
          message: "세션 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
        },
      },
      { status: 500 },
    );
  }

  if (env.N8N_WEBHOOK_URL && env.N8N_WEBHOOK_SECRET) {
    void callRecommendationWebhook(
      {
        ...parsed.data,
        session_id: sessionId,
        user_region: userRegion,
        requested_at: new Date().toISOString(),
      },
      {
        webhookUrl: env.N8N_WEBHOOK_URL,
        webhookSecret: env.N8N_WEBHOOK_SECRET,
      },
    ).catch(async (err: unknown) => {
      const msg =
        err instanceof N8nWebhookError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "unknown webhook error";
      try {
        await markSessionFailed(client, sessionId, msg);
      } catch {
        // swallow logging error
      }
    });
  }

  return redirect(`/recommend/results/${sessionId}`);
}

export default function RecommendApiRoute() {
  return null;
}
