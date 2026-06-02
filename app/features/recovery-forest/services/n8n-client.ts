import { recommendationResponseSchema } from "../schemas/recommendation.schema";
import type { RecommendationResponse } from "../schemas/recommendation.schema";
import type { RecommendationInput } from "../schemas/input.schema";
import {
  prescriptionResponseSchema,
  type PrescriptionResponse,
} from "../schemas/prescription.schema";
import type { WellnessScores } from "../schemas/wellness.schema";

export type N8nWebhookPayload = RecommendationInput & {
  session_id: string;
  user_region: string;
  requested_at: string;
};

export type N8nClientConfig = {
  webhookUrl: string;
  webhookSecret: string;
  timeoutMs?: number;
};

export class N8nWebhookError extends Error {
  constructor(
    message: string,
    readonly code: "TIMEOUT" | "NETWORK" | "INVALID_RESPONSE" | "HTTP",
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "N8nWebhookError";
  }
}

export async function callRecommendationWebhook(
  payload: N8nWebhookPayload,
  config: N8nClientConfig,
): Promise<RecommendationResponse> {
  const controller = new AbortController();
  const timeoutMs = config.timeoutMs ?? 15000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": config.webhookSecret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new N8nWebhookError(
        `n8n webhook returned ${response.status}`,
        "HTTP",
      );
    }

    const json = await response.json();
    const parsed = recommendationResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new N8nWebhookError(
        "n8n response failed schema validation",
        "INVALID_RESPONSE",
        parsed.error.flatten(),
      );
    }
    return parsed.data;
  } catch (err) {
    if (err instanceof N8nWebhookError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new N8nWebhookError("n8n webhook timed out", "TIMEOUT", err);
    }
    throw new N8nWebhookError("n8n network failure", "NETWORK", err);
  } finally {
    clearTimeout(timer);
  }
}

export type PrescriptionWebhookPayload = {
  journey_token: string;
  wellness: WellnessScores;
  months_since_treatment: number | null;
  recommendation_input: RecommendationInput;
  requested_at: string;
};

/**
 * 처방 생성 webhook (PRESCRIPTION_MODE=n8n). n8n 워크플로우가 환경데이터 매칭 +
 * OpenAI(prescription-plan) 처방 생성 + Supabase 기록(prescriptions/citations/journey)을
 * 수행한다. 앱은 fire-and-forget 으로 호출하고 처방 페이지는 폴링한다.
 */
export async function callPrescriptionWebhook(
  payload: PrescriptionWebhookPayload,
  config: N8nClientConfig,
): Promise<PrescriptionResponse> {
  const controller = new AbortController();
  const timeoutMs = config.timeoutMs ?? 20000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": config.webhookSecret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new N8nWebhookError(
        `n8n prescribe webhook returned ${response.status}`,
        "HTTP",
      );
    }

    const json = await response.json();
    const parsed = prescriptionResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new N8nWebhookError(
        "n8n prescribe response failed schema validation",
        "INVALID_RESPONSE",
        parsed.error.flatten(),
      );
    }
    return parsed.data;
  } catch (err) {
    if (err instanceof N8nWebhookError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new N8nWebhookError("n8n prescribe webhook timed out", "TIMEOUT", err);
    }
    throw new N8nWebhookError("n8n prescribe network failure", "NETWORK", err);
  } finally {
    clearTimeout(timer);
  }
}
