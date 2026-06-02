import { z } from "zod";

import { FOREST_TYPES } from "./recommendation.schema";

export const forestDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(FOREST_TYPES),
  region: z.string(),
  sido: z.string(),
  sigungu: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  altitude_m: z.number().int().nullable(),
  area_ha: z.number().nullable(),
  tree_species: z.array(z.string()).default([]),
  trail_length_km: z.number().nullable(),
  trail_difficulty: z.enum(["easy", "moderate", "hard"]).nullable(),
  exercise_intensity_met: z.number().nullable(),
  accessibility_score: z.number().int().min(0).max(100).nullable(),
  baseline_phytoncide_pptv: z.number().nullable(),
  description: z.string().nullable(),
  image_url: z.string().url().nullable(),
  source_url: z.string().url().nullable(),
});

export type ForestDetail = z.infer<typeof forestDetailSchema>;

export const healingProgramSchema = z.object({
  id: z.string().uuid(),
  forest_place_id: z.string().uuid(),
  name: z.string(),
  target_group: z.string().nullable(),
  duration_min: z.number().int().nullable(),
  schedule_text: z.string().nullable(),
  fee_krw: z.number().int().nullable(),
  description: z.string().nullable(),
  contact: z.string().nullable(),
  source_url: z.string().url().nullable(),
});

export type HealingProgram = z.infer<typeof healingProgramSchema>;
