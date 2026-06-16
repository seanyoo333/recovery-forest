import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { loadRankableForests } from "../services/healing-forest.repository";

type Row = {
  seq: number;
  name: string;
  region: string | null;
  lat: number | null;
  lon: number | null;
  species: string | null;
};

/** PostgREST 빌더 흉내: from().select().not().not() 가 thenable 로 resolve. */
function mockClient(rows: Row[]): SupabaseClient {
  const builder = {
    select: () => builder,
    not: () => builder,
    then: (resolve: (v: { data: Row[]; error: null }) => void) =>
      resolve({ data: rows, error: null }),
  };
  return { from: () => builder } as unknown as SupabaseClient;
}

describe("healing-forest repository", () => {
  it("healing_forests 행을 RankableForest 로 매핑한다", async () => {
    const client = mockClient([
      { seq: 3, name: "잣향기 푸른숲", region: "경기도", lat: 37.77, lon: 127.33, species: "잣나무" },
    ]);
    const forests = await loadRankableForests(client);
    expect(forests).toHaveLength(1);
    expect(forests[0]).toMatchObject({
      name: "잣향기 푸른숲",
      latitude: 37.77,
      longitude: 127.33,
      treeSpecies: ["잣나무"],
    });
  });

  it("수종 미상은 빈 treeSpecies 로 둔다(엔진이 폴백)", async () => {
    const client = mockClient([
      { seq: 1, name: "산음 치유의숲", region: "경기도", lat: 37.6, lon: 127.5, species: null },
    ]);
    const forests = await loadRankableForests(client);
    expect(forests[0].treeSpecies).toEqual([]);
  });
});
