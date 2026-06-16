import type { SupabaseClient } from "@supabase/supabase-js";

import type { RankableForest } from "./forest-ranking";

/**
 * healing_forests(38개 실데이터: 카카오 지오코딩 좌표 + 수종)를 처방 엔진 입력
 * (RankableForest[])으로 읽어온다. anon 클라이언트로 충분(public read RLS).
 *
 * 미세먼지/기상(pm25·temp·humidity·wind)은 여기서 채우지 않는다 — Phase 2에서
 * air-quality/weather 서비스가 forest별로 주입하고, 없으면 엔진이 폴백한다.
 */

type HealingForestRow = {
  seq: number;
  name: string;
  region: string | null;
  lat: number | null;
  lon: number | null;
  dominant_species: string | null;
};

export async function loadRankableForests(
  client: SupabaseClient,
): Promise<RankableForest[]> {
  const { data, error } = await client
    .from("healing_forests")
    .select("seq, name, region, lat, lon, dominant_species")
    .not("lat", "is", null)
    .not("lon", "is", null);
  if (error) throw error;

  const rows = (data ?? []) as HealingForestRow[];
  return rows
    .filter((r) => r.lat != null && r.lon != null)
    .map((r) => ({
      id: String(r.seq),
      name: r.name,
      region: r.region ?? undefined,
      latitude: r.lat as number,
      longitude: r.lon as number,
      // 수종 미입력이면 빈 배열 → 엔진이 미상(중립)으로 폴백.
      treeSpecies: r.dominant_species ? [r.dominant_species] : [],
    }));
}
