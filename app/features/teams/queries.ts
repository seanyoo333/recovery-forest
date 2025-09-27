import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

export const getTeams = async (
  client: SupabaseClient<Database>,
  { limit }: { limit: number },
) => {
  const { data, error } = await client
    .from("teams")
    .select(
      `
    team_id,
    team_name,
    team_size,
    cost,
    team_position,
    target,
    team_description,
    team_leader_id,
    team_leader:profiles(
      name,
      avatar,
      role,
      username
    )
    `,
    )
    .limit(limit)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

export const getTeamById = async (
  client: SupabaseClient<Database>,
  { teamId }: { teamId: string },
) => {
  const { data, error } = await client
    .from("teams")
    .select(
      `
      *,
      team_leader:profiles(
        name,
        avatar,
        role,
        username
      )
      `,
    )
    .eq("team_id", Number(teamId))
    .single();
  if (error) throw error;
  return data;
};

export const getPrograms = async (
  client: SupabaseClient<Database>,
  { limit }: { limit: number },
) => {
  const { data, error } = await client
    .from("programs")
    .select("*")
    .limit(limit)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

export const getProgramById = async (
  client: SupabaseClient<Database>,
  { programId }: { programId: string },
) => {
  const { data, error } = await client
    .from("programs")
    .select("*")
    .eq("program_id", Number(programId))
    .single();
  if (error) throw error;
  return data;
};
