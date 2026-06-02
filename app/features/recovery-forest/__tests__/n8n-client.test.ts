import { afterEach, describe, expect, it, vi } from "vitest";

import {
  callPrescriptionWebhook,
  N8nWebhookError,
  type PrescriptionWebhookPayload,
} from "../services/n8n-client";

const payload: PrescriptionWebhookPayload = {
  journey_token: "tok-1",
  wellness: { sleep: 4, fatigue: 7, mood: 5, stress: 6 },
  months_since_treatment: 12,
  recommendation_input: {
    user_sido: "서울",
    user_sigungu: "강북구",
    user_priorities: ["stress"],
    user_fitness_level: "low",
    user_travel_time_min: 60,
    user_preferred_activity: "walking",
  },
  requested_at: "2026-06-02T00:00:00Z",
};

const config = { webhookUrl: "https://n8n.test/prescribe", webhookSecret: "s3cret" };

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockFetch(
  impl: (...args: unknown[]) => Promise<Response> | Response,
) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("callPrescriptionWebhook", () => {
  it("should_post_with_secret_header_and_parse_response", async () => {
    const fetchFn = mockFetch(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            journey_token: "tok-1",
            status: "completed",
            target_outcome: [],
            citations: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const result = await callPrescriptionWebhook(payload, config);
    expect(result.status).toBe("completed");
    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(config.webhookUrl);
    expect(init.headers).toMatchObject({ "X-Webhook-Secret": "s3cret" });
  });

  it("should_throw_HTTP_on_non_ok", async () => {
    mockFetch(() => new Response("nope", { status: 500 }));
    await expect(callPrescriptionWebhook(payload, config)).rejects.toMatchObject({
      code: "HTTP",
    });
  });

  it("should_throw_INVALID_RESPONSE_on_bad_shape", async () => {
    mockFetch(() =>
      new Response(JSON.stringify({ unexpected: true }), { status: 200 }),
    );
    await expect(
      callPrescriptionWebhook(payload, config),
    ).rejects.toBeInstanceOf(N8nWebhookError);
    await expect(
      callPrescriptionWebhook(payload, config),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
});
