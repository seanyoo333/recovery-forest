import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildJourneyLinkEmail,
  buildReportReadyEmail,
  resolveEmailConfig,
  sendResendEmail,
} from "../services/email.service";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("resolveEmailConfig", () => {
  it("should_return_null_when_no_email_mode", () => {
    expect(resolveEmailConfig({})).toBeNull();
    expect(resolveEmailConfig({ RESEND_API_KEY: "k" })).toBeNull();
  });

  it("should_return_config_when_both_present", () => {
    const c = resolveEmailConfig({
      RESEND_API_KEY: "k",
      RESEND_FROM_EMAIL: "no-reply@x.com",
    });
    expect(c).toEqual({ apiKey: "k", from: "no-reply@x.com" });
  });
});

describe("email builders", () => {
  it("should_build_journey_link_to_prescription", () => {
    const e = buildJourneyLinkEmail("https://app.test", "tok-1");
    expect(e.html).toContain("https://app.test/journey/tok-1/prescription");
    expect(e.subject).toContain("처방");
    expect(e.html).not.toMatch(/완치|치료 효과/);
  });

  it("should_build_report_link_to_report", () => {
    const e = buildReportReadyEmail("https://app.test", "tok-1");
    expect(e.html).toContain("https://app.test/journey/tok-1/report");
  });
});

describe("sendResendEmail", () => {
  it("should_post_with_bearer_and_return_true_on_ok", async () => {
    const fn = vi.fn((..._args: unknown[]) => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fn);
    const ok = await sendResendEmail(
      "user@x.com",
      { subject: "s", html: "<p>h</p>" },
      { apiKey: "k", from: "no-reply@x.com" },
    );
    expect(ok).toBe(true);
    const [url, init] = fn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers).toMatchObject({ Authorization: "Bearer k" });
  });

  it("should_return_false_on_network_error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network");
      }),
    );
    const ok = await sendResendEmail(
      "user@x.com",
      { subject: "s", html: "h" },
      { apiKey: "k", from: "f@x.com" },
    );
    expect(ok).toBe(false);
  });
});
