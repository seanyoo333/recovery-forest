import type { SupabaseClient } from "@supabase/supabase-js";

import {
  assertTransition,
  type JourneyStatus,
} from "./journey-state";

export type JourneyRow = {
  id: string;
  journey_token: string;
  email: string | null;
  status: JourneyStatus;
  consent_version: string | null;
  consented_at: string | null;
  program_started_at: string | null;
  program_ended_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

const JOURNEY_COLUMNS =
  "id, journey_token, email, status, consent_version, consented_at, program_started_at, program_ended_at, last_error, created_at, updated_at";

export type CreateJourneyArgs = {
  token: string;
  email?: string | null;
  consentVersion: string;
  consentTextHash?: string | null;
};

/** 동의 + 토큰 발급 = 여정 생성 (status: consented) */
export async function createJourney(
  client: SupabaseClient,
  args: CreateJourneyArgs,
): Promise<JourneyRow> {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("journeys")
    .insert({
      journey_token: args.token,
      email: args.email ?? null,
      status: "consented",
      consent_version: args.consentVersion,
      consented_at: now,
    })
    .select(JOURNEY_COLUMNS)
    .single();
  if (error) throw error;

  const journey = data as JourneyRow;
  // 동의 감사 로그 (실패해도 여정 진행은 막지 않음)
  await client.from("journey_consents").insert({
    journey_id: journey.id,
    consent_version: args.consentVersion,
    text_hash: args.consentTextHash ?? null,
  });
  return journey;
}

export async function getJourneyByToken(
  client: SupabaseClient,
  token: string,
): Promise<JourneyRow | null> {
  const { data, error } = await client
    .from("journeys")
    .select(JOURNEY_COLUMNS)
    .eq("journey_token", token)
    .maybeSingle();
  if (error) throw error;
  return (data as JourneyRow | null) ?? null;
}

/**
 * 상태 전이 — 현재 상태를 읽어 가드 통과 후에만 갱신한다.
 * 불법 전이는 InvalidJourneyTransitionError 로 거부.
 */
export async function transitionJourney(
  client: SupabaseClient,
  token: string,
  to: JourneyStatus,
  patch: Partial<
    Pick<JourneyRow, "program_started_at" | "program_ended_at">
  > = {},
): Promise<void> {
  const current = await getJourneyByToken(client, token);
  if (!current) throw new Error(`journey not found: ${token}`);
  assertTransition(current.status, to);
  const { error } = await client
    .from("journeys")
    .update({ status: to, updated_at: new Date().toISOString(), ...patch })
    .eq("journey_token", token);
  if (error) throw error;
}

export async function markJourneyFailed(
  client: SupabaseClient,
  token: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await client
    .from("journeys")
    .update({
      status: "failed",
      last_error: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("journey_token", token);
  if (error) throw error;
}
