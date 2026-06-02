import type { SupabaseClient } from "@supabase/supabase-js";

import type { Citation } from "../schemas/evidence.schema";
import type {
  DeltaItem,
  HitMissItem,
  ReportResponse,
} from "../schemas/report.schema";

export type ReportRow = {
  journey_id: string;
  status: "pending" | "completed" | "failed";
  delta_summary: unknown;
  hit_miss: unknown;
  narrative: string | null;
  citations_snapshot: unknown;
  last_error: string | null;
};

const REPORT_COLUMNS =
  "journey_id, status, delta_summary, hit_miss, narrative, citations_snapshot, last_error";

/** 리포트 행 → 리포트 응답(폴링용) */
export function rowToReportResponse(
  row: ReportRow,
  journeyToken: string,
): ReportResponse {
  const deltas = (row.delta_summary as DeltaItem[] | null) ?? [];
  const hitMiss = (row.hit_miss as HitMissItem[] | null) ?? [];
  const hits = hitMiss.filter((h) => h.hit).length;
  return {
    journey_token: journeyToken,
    status: row.status,
    deltas,
    hit_miss: hitMiss,
    hit_rate: hitMiss.length > 0 ? hits / hitMiss.length : null,
    narrative: row.narrative,
    citations: (row.citations_snapshot as Citation[] | null) ?? [],
    last_error: row.last_error,
  };
}

export type SaveReportArgs = {
  journeyId: string;
  deltas: DeltaItem[];
  hitMiss: HitMissItem[];
  narrative: string;
  citations: Citation[];
  llmModel?: string | null;
};

/** 리포트 저장(완성). 여정당 1건이므로 upsert(journey_id 충돌 시 갱신). */
export async function saveCompletedReport(
  client: SupabaseClient,
  args: SaveReportArgs,
): Promise<void> {
  const { error } = await client.from("reports").upsert(
    {
      journey_id: args.journeyId,
      status: "completed",
      delta_summary: args.deltas,
      hit_miss: args.hitMiss,
      narrative: args.narrative,
      citations_snapshot: args.citations,
      llm_model: args.llmModel ?? null,
    },
    { onConflict: "journey_id" },
  );
  if (error) throw error;
}

export async function getReportByJourneyId(
  client: SupabaseClient,
  journeyId: string,
): Promise<ReportRow | null> {
  const { data, error } = await client
    .from("reports")
    .select(REPORT_COLUMNS)
    .eq("journey_id", journeyId)
    .maybeSingle();
  if (error) throw error;
  return (data as ReportRow | null) ?? null;
}

/**
 * 완료된 리포트들의 delta/hit_miss 를 모은다 (insights 코호트 집계용).
 */
export async function getCompletedReportSignals(
  client: SupabaseClient,
): Promise<{
  count: number;
  deltas: DeltaItem[][];
  hitMiss: HitMissItem[][];
}> {
  const { data, error } = await client
    .from("reports")
    .select("delta_summary, hit_miss")
    .eq("status", "completed");
  if (error) throw error;
  const rows =
    (data as { delta_summary: unknown; hit_miss: unknown }[] | null) ?? [];
  return {
    count: rows.length,
    deltas: rows.map((r) => (r.delta_summary as DeltaItem[] | null) ?? []),
    hitMiss: rows.map((r) => (r.hit_miss as HitMissItem[] | null) ?? []),
  };
}
