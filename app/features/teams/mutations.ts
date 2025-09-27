import type { SupabaseClient } from "@supabase/supabase-js";

import { z } from "zod";

import type { Database } from "~/core/lib/supa-client.server";

import { formSchema } from "./pages/submit-team-page";

export const createTeam = async (
  client: SupabaseClient<Database>,
  userId: string,
  team: z.infer<typeof formSchema>,
) => {
  const { data, error } = await client
    .from("teams")
    .insert({
      team_leader_id: userId,
      team_name: team.name,
      team_size: team.size,
      cost: team.cost,
      target: team.target,
      team_description: team.description,
      team_position: team.specialty as
        | "doctor"
        | "nurse"
        | "nutritionist"
        | "foresttherapist",
    })
    .select("team_id")
    .single();

  if (error) {
    throw error;
  }

  return data;
};
