import { describe, expect, it } from "vitest";

import { CONSENT_VERSION, consentSchema } from "../schemas/consent.schema";

describe("consentSchema", () => {
  it("should_accept_agreement_with_email", () => {
    const result = consentSchema.safeParse({
      email: "user@example.com",
      consent_agreed: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.consent_version).toBe(CONSENT_VERSION);
    }
  });

  it("should_accept_agreement_without_email_for_no_email_demo", () => {
    const result = consentSchema.safeParse({
      email: "",
      consent_agreed: true,
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_when_not_agreed", () => {
    const result = consentSchema.safeParse({
      email: "user@example.com",
      consent_agreed: false,
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_invalid_email", () => {
    const result = consentSchema.safeParse({
      email: "not-an-email",
      consent_agreed: true,
    });
    expect(result.success).toBe(false);
  });
});
