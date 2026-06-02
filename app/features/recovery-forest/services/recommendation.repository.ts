import type { SupabaseClient } from "@supabase/supabase-js";

import type { RecommendationInput } from "../schemas/input.schema";
import type { RecommendationResponse } from "../schemas/recommendation.schema";

export type CreateSessionArgs = {
  sessionId: string;
  userRegion: string;
  input: RecommendationInput;
};

export type SupabaseSessionRow = {
  session_id: string;
  status: "pending" | "completed" | "failed";
  input_payload: unknown;
  user_priorities: string[];
  user_region: string | null;
  user_fitness_level: string | null;
  user_travel_time_min: number | null;
  results: unknown;
  ai_summary: string | null;
  last_error: string | null;
  created_at: string;
  completed_at: string | null;
};

export async function createPendingSession(
  client: SupabaseClient,
  args: CreateSessionArgs,
) {
  const { error } = await client.from("recommendation_sessions").insert({
    session_id: args.sessionId,
    status: "pending",
    input_payload: args.input,
    user_priorities: args.input.user_priorities,
    user_region: args.userRegion,
    user_fitness_level: args.input.user_fitness_level,
    user_travel_time_min: args.input.user_travel_time_min,
  });
  if (error) throw error;
}

export async function getSessionById(
  client: SupabaseClient,
  sessionId: string,
): Promise<SupabaseSessionRow | null> {
  const { data, error } = await client
    .from("recommendation_sessions")
    .select(
      "session_id, status, input_payload, user_priorities, user_region, user_fitness_level, user_travel_time_min, results, ai_summary, last_error, created_at, completed_at",
    )
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return (data as SupabaseSessionRow | null) ?? null;
}

export async function markSessionFailed(
  client: SupabaseClient,
  sessionId: string,
  errorMessage: string,
) {
  const { error } = await client
    .from("recommendation_sessions")
    .update({
      status: "failed",
      last_error: errorMessage,
    })
    .eq("session_id", sessionId);
  if (error) throw error;
}

export function rowToResponse(
  row: SupabaseSessionRow,
): RecommendationResponse {
  return {
    session_id: row.session_id,
    status: row.status,
    recommended_at: row.completed_at,
    ai_summary: row.ai_summary,
    last_error: row.last_error,
    results: Array.isArray(row.results)
      ? (row.results as RecommendationResponse["results"])
      : [],
  };
}
