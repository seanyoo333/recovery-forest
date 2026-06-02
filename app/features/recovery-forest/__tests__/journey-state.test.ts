import { describe, expect, it } from "vitest";

import {
  assertTransition,
  canTransition,
  InvalidJourneyTransitionError,
  isTerminal,
  stepForStatus,
} from "../services/journey-state";

describe("canTransition", () => {
  it("should_allow_forward_path", () => {
    expect(canTransition("consented", "pre_surveyed")).toBe(true);
    expect(canTransition("pre_surveyed", "prescribed")).toBe(true);
    expect(canTransition("prescribed", "post_surveyed")).toBe(true);
    expect(canTransition("post_surveyed", "reported")).toBe(true);
  });

  it("should_allow_failed_from_any_active_state", () => {
    expect(canTransition("consented", "failed")).toBe(true);
    expect(canTransition("pre_surveyed", "failed")).toBe(true);
    expect(canTransition("prescribed", "failed")).toBe(true);
  });

  it("should_reject_skipping_states", () => {
    expect(canTransition("consented", "prescribed")).toBe(false);
    expect(canTransition("pre_surveyed", "reported")).toBe(false);
  });

  it("should_reject_transition_from_terminal", () => {
    expect(canTransition("reported", "pre_surveyed")).toBe(false);
    expect(canTransition("failed", "prescribed")).toBe(false);
  });
});

describe("assertTransition", () => {
  it("should_throw_on_illegal_transition", () => {
    expect(() => assertTransition("consented", "reported")).toThrow(
      InvalidJourneyTransitionError,
    );
  });

  it("should_not_throw_on_legal_transition", () => {
    expect(() => assertTransition("consented", "pre_surveyed")).not.toThrow();
  });
});

describe("isTerminal", () => {
  it("should_flag_reported_and_failed_terminal", () => {
    expect(isTerminal("reported")).toBe(true);
    expect(isTerminal("failed")).toBe(true);
    expect(isTerminal("consented")).toBe(false);
  });
});

describe("stepForStatus", () => {
  it("should_map_status_to_current_step", () => {
    expect(stepForStatus("consented")).toBe("pre-survey");
    expect(stepForStatus("pre_surveyed")).toBe("prescription");
    expect(stepForStatus("prescribed")).toBe("prescription");
    expect(stepForStatus("in_program")).toBe("post-survey");
    expect(stepForStatus("post_surveyed")).toBe("report");
    expect(stepForStatus("reported")).toBe("report");
  });
});
