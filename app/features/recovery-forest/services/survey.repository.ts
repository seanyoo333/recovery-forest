import type { SupabaseClient } from "@supabase/supabase-js";

import type { PostSurveyInput } from "../schemas/post-survey.schema";
import type { PreSurveyInput } from "../schemas/pre-survey.schema";
import type { WellnessScores } from "../schemas/wellness.schema";

type WellnessRow = {
  sleep_score: number | null;
  fatigue_score: number | null;
  mood_score: number | null;
  stress_score: number | null;
};

export type PreSurveyRow = WellnessRow & {
  journey_id: string;
  months_since_treatment: number | null;
  recommendation_input: unknown;
};

export type PostSurveyRow = WellnessRow & {
  journey_id: string;
  impression: string | null;
};

/** 웰니스 점수 행 → WellnessScores (누락 시 기본 5) */
export function rowToWellnessScores(row: WellnessRow): WellnessScores {
  return {
    sleep: row.sleep_score ?? 5,
    fatigue: row.fatigue_score ?? 5,
    mood: row.mood_score ?? 5,
    stress: row.stress_score ?? 5,
  };
}

export async function insertPreSurvey(
  client: SupabaseClient,
  journeyId: string,
  input: PreSurveyInput,
): Promise<void> {
  const { months_since_treatment, ...recommendationInput } = input;
  const { error } = await client.from("pre_surveys").insert({
    journey_id: journeyId,
    sleep_score: input.sleep_score,
    fatigue_score: input.fatigue_score,
    mood_score: input.mood_score,
    stress_score: input.stress_score,
    months_since_treatment: months_since_treatment ?? null,
    self_report_payload: {
      sleep: input.sleep_score,
      fatigue: input.fatigue_score,
      mood: input.mood_score,
      stress: input.stress_score,
    },
    recommendation_input: recommendationInput,
  });
  if (error) throw error;
}

export async function getPreSurvey(
  client: SupabaseClient,
  journeyId: string,
): Promise<PreSurveyRow | null> {
  const { data, error } = await client
    .from("pre_surveys")
    .select(
      "journey_id, sleep_score, fatigue_score, mood_score, stress_score, months_since_treatment, recommendation_input",
    )
    .eq("journey_id", journeyId)
    .maybeSingle();
  if (error) throw error;
  return (data as PreSurveyRow | null) ?? null;
}

export async function insertPostSurvey(
  client: SupabaseClient,
  journeyId: string,
  input: PostSurveyInput,
): Promise<void> {
  const { error } = await client.from("post_surveys").insert({
    journey_id: journeyId,
    sleep_score: input.sleep_score,
    fatigue_score: input.fatigue_score,
    mood_score: input.mood_score,
    stress_score: input.stress_score,
    impression: input.impression || null,
  });
  if (error) throw error;
}

export async function getPostSurvey(
  client: SupabaseClient,
  journeyId: string,
): Promise<PostSurveyRow | null> {
  const { data, error } = await client
    .from("post_surveys")
    .select(
      "journey_id, sleep_score, fatigue_score, mood_score, stress_score, impression",
    )
    .eq("journey_id", journeyId)
    .maybeSingle();
  if (error) throw error;
  return (data as PostSurveyRow | null) ?? null;
}
