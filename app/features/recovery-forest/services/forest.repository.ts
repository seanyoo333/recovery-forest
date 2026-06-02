import type { SupabaseClient } from "@supabase/supabase-js";

import { forestDetailSchema, healingProgramSchema } from "../schemas/forest.schema";
import type { ForestDetail, HealingProgram } from "../schemas/forest.schema";

export async function getForestById(
  client: SupabaseClient,
  forestId: string,
): Promise<ForestDetail | null> {
  const { data, error } = await client
    .from("forest_places")
    .select("*")
    .eq("id", forestId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const parsed = forestDetailSchema.safeParse(data);
  if (!parsed.success) return null;
  return parsed.data;
}

export async function getProgramsByForestId(
  client: SupabaseClient,
  forestId: string,
): Promise<HealingProgram[]> {
  const { data, error } = await client
    .from("healing_programs")
    .select("*")
    .eq("forest_place_id", forestId);
  if (error) throw error;
  if (!data) return [];
  return data
    .map((row) => healingProgramSchema.safeParse(row))
    .filter((res) => res.success)
    .map((res) => res.data);
}
