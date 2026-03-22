import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

import { PAGE_SIZE } from "./constants";
import type { NaturalTargetWithMappings } from "./group-targets-by-meta-axis";

/** natural_ingredients 목록 (display_name 순) - 마이그레이션 0111 후 tagline, description, picture 사용 가능 */
export async function getNaturalIngredients(
  client: SupabaseClient<Database>,
  { page = 1, limit = PAGE_SIZE }: { page?: number; limit?: number } = {},
) {
  // 마이그레이션 0111 후: tagline, description, picture 컬럼 추가됨
  const columns = "id, slug, display_name, tagline, picture, synonyms";
  const { data, error } = await client
    .from("natural_ingredients")
    .select(columns)
    .order("display_name", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    slug: string;
    display_name: string;
    tagline?: string | null;
    description?: string | null;
    picture?: string | null;
    synonyms?: string[] | null;
  }>;
}

/** natural_ingredients 총 페이지 수 */
export async function getNaturalIngredientsPages(
  client: SupabaseClient<Database>,
  limit = PAGE_SIZE,
) {
  const { count, error } = await client
    .from("natural_ingredients")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  if (!count) return 1;
  return Math.ceil(count / limit);
}

/** slug로 단일 성분 조회 */
export async function getNaturalIngredientBySlug(
  client: SupabaseClient<Database>,
  { slug }: { slug: string },
) {
  const { data, error } = await client
    .from("natural_ingredients")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

/** natural_targets 목록 (매핑 없이 평면 목록) */
export async function getNaturalTargets(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from("natural_targets")
    .select("id, slug, display_name, description")
    .order("display_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * natural_targets + `target_to_meta_axis` (표적별 모음 5축 그룹용, DB와 정합)
 */
export async function getNaturalTargetsWithMetaAxis(
  client: SupabaseClient<Database>,
): Promise<NaturalTargetWithMappings[]> {
  const { data, error } = await client
    .from("natural_targets")
    .select(
      `id, slug, display_name, description,
      target_to_meta_axis ( meta_axis, axis_weight )`,
    )
    .order("display_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as NaturalTargetWithMappings[];
}

/** 특정 표적에 연결된 성분 목록 (ingredient_target_evidence 기반) */
export async function getIngredientsByTargetSlug(
  client: SupabaseClient<Database>,
  {
    targetSlug,
    page = 1,
    limit = PAGE_SIZE,
  }: { targetSlug: string; page?: number; limit?: number },
) {
  const { data: target, error: targetError } = await client
    .from("natural_targets")
    .select("id")
    .eq("slug", targetSlug)
    .single();
  if (targetError || !target) {
    return { target: null, ingredients: [], totalPages: 1 };
  }

  const targetId = target.id;

  const { data: evidenceRows, error: evError } = await client
    .from("ingredient_target_evidence")
    .select("ingredient_id")
    .eq("target_id", targetId);

  if (evError || !evidenceRows?.length) {
    const { data: targetData } = await client
      .from("natural_targets")
      .select("id, slug, display_name, description")
      .eq("id", targetId)
      .single();
    return {
      target: targetData ?? null,
      ingredients: [],
      totalPages: 1,
    };
  }

  const ingredientIds = [...new Set(evidenceRows.map((r) => r.ingredient_id))];
  const start = (page - 1) * limit;
  const paginatedIds = ingredientIds.slice(start, start + limit);

  const { data: ingredients, error: ingError } = await client
    .from("natural_ingredients")
    .select("id, slug, display_name, tagline, picture, synonyms")
    .in("id", paginatedIds);

  if (ingError) throw ingError;

  const { data: targetData } = await client
    .from("natural_targets")
    .select("id, slug, display_name, description")
    .eq("id", targetId)
    .single();

  const totalPages = Math.ceil(ingredientIds.length / limit) || 1;

  return {
    target: targetData ?? null,
    ingredients: ingredients ?? [],
    totalPages,
  };
}

/** 표적 slug로 target 정보만 조회 */
export async function getNaturalTargetBySlug(
  client: SupabaseClient<Database>,
  { slug }: { slug: string },
) {
  const { data, error } = await client
    .from("natural_targets")
    .select("id, slug, display_name, description")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

/** 검색 (display_name, synonyms, tagline, description, mechanism) */
export async function searchNaturalIngredients(
  client: SupabaseClient<Database>,
  {
    query,
    page = 1,
    limit = PAGE_SIZE,
  }: { query: string; page?: number; limit?: number },
) {
  const q = query.trim().toLowerCase();
  if (!q) return { ingredients: [], totalPages: 1 };

  const { data: all, error } = await client
    .from("natural_ingredients")
    .select("id, slug, display_name, tagline, description, mechanism, interaction_notes, picture, synonyms");

  if (error) throw error;
  const rows = (all ?? []) as Array<{
    id: string;
    slug: string;
    display_name: string;
    tagline?: string | null;
    description?: string | null;
    mechanism?: string | null;
    interaction_notes?: string | null;
    synonyms?: string[] | null;
  }>;

  const matches = rows.filter((row) => {
    const displayName = (row.display_name ?? "").toLowerCase();
    const tagline = (row.tagline ?? "").toLowerCase();
    const description = (row.description ?? "").toLowerCase();
    const mechanism = (row.mechanism ?? "").toLowerCase();
    const interactionNotes = (row.interaction_notes ?? "").toLowerCase();
    const synonyms = (row.synonyms ?? []).join(" ").toLowerCase();
    const searchable = `${displayName} ${tagline} ${description} ${mechanism} ${interactionNotes} ${synonyms}`;
    return searchable.includes(q);
  });

  const totalPages = Math.ceil(matches.length / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = matches.slice(start, start + limit);

  return {
    ingredients: paginated,
    totalPages,
  };
}

// 페이지용 alias (기존 import 호환)
export const getIngredients = getNaturalIngredients;
export const getIngredientPages = getNaturalIngredientsPages;
export const getIngredientBySlug = getNaturalIngredientBySlug;
/** 표적별 모음 페이지: 5축 매핑 포함 */
export const getTargets = getNaturalTargetsWithMetaAxis;
export const searchIngredients = searchNaturalIngredients;
