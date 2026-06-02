import type { SupabaseClient } from "@supabase/supabase-js";

import type { Citation, EvidenceSource } from "../schemas/evidence.schema";
import type {
  ActionPlan,
  PostMeasurementPlan,
  PrescriptionResponse,
  TargetOutcome,
} from "../schemas/prescription.schema";

export type PrescriptionRow = {
  id: string;
  journey_id: string;
  forest_place_id: string | null;
  status: "pending" | "completed" | "failed";
  action_plan: unknown;
  target_outcome: unknown;
  post_measurement_plan: unknown;
  ai_summary: string | null;
  caution: string | null;
  last_error: string | null;
  created_at: string;
  completed_at: string | null;
};

export type PrescribedPlace = {
  id: string;
  name: string;
  type: string;
  region: string;
};

const PRESCRIPTION_COLUMNS =
  "id, journey_id, forest_place_id, status, action_plan, target_outcome, post_measurement_plan, ai_summary, caution, last_error, created_at, completed_at";

/** 처방 행 → 처방 응답(폴링용). jsonb 필드는 그대로 통과시킨다. */
export function rowToPrescriptionResponse(
  row: PrescriptionRow,
  journeyToken: string,
  opts: { place?: PrescribedPlace | null; citations?: Citation[] } = {},
): PrescriptionResponse {
  return {
    journey_token: journeyToken,
    status: row.status,
    place: opts.place ?? null,
    ai_summary: row.ai_summary,
    caution: row.caution,
    action_plan: (row.action_plan as ActionPlan | null) ?? null,
    target_outcome: (row.target_outcome as TargetOutcome | null) ?? [],
    post_measurement_plan:
      (row.post_measurement_plan as PostMeasurementPlan | null) ?? null,
    citations: opts.citations ?? [],
    last_error: row.last_error,
  };
}

/**
 * STUB 처방용 장소 1곳 선택. 같은 시·도 우선, 없으면 아무 곳이나.
 * forest_places 가 비어 있으면 null.
 */
export async function pickForestPlace(
  client: SupabaseClient,
  sido?: string,
): Promise<PrescribedPlace | null> {
  let query = client
    .from("forest_places")
    .select("id, name, type, region")
    .limit(1);
  if (sido) query = query.eq("sido", sido);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (data) return data as PrescribedPlace;
  if (sido) return pickForestPlace(client); // 시·도 매칭 실패 시 폴백
  return null;
}

export type CreatePrescriptionArgs = {
  journeyId: string;
  forestPlaceId?: string | null;
  status?: "pending" | "completed";
  actionPlan?: ActionPlan | null;
  targetOutcome?: TargetOutcome | null;
  postMeasurementPlan?: PostMeasurementPlan | null;
  aiSummary?: string | null;
  caution?: string | null;
  llmModel?: string | null;
  llmPromptVersion?: string | null;
};

export async function createPrescription(
  client: SupabaseClient,
  args: CreatePrescriptionArgs,
): Promise<PrescriptionRow> {
  const status = args.status ?? "pending";
  const { data, error } = await client
    .from("prescriptions")
    .insert({
      journey_id: args.journeyId,
      forest_place_id: args.forestPlaceId ?? null,
      status,
      action_plan: args.actionPlan ?? null,
      target_outcome: args.targetOutcome ?? null,
      post_measurement_plan: args.postMeasurementPlan ?? null,
      ai_summary: args.aiSummary ?? null,
      caution: args.caution ?? null,
      llm_model: args.llmModel ?? null,
      llm_prompt_version: args.llmPromptVersion ?? null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .select(PRESCRIPTION_COLUMNS)
    .single();
  if (error) throw error;
  return data as PrescriptionRow;
}

export async function getPrescriptionByJourneyId(
  client: SupabaseClient,
  journeyId: string,
): Promise<PrescriptionRow | null> {
  const { data, error } = await client
    .from("prescriptions")
    .select(PRESCRIPTION_COLUMNS)
    .eq("journey_id", journeyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as PrescriptionRow | null) ?? null;
}

/** 메커니즘 목록으로 근거 논문 조회 (Evidence Chain stand-in) */
export async function listEvidenceByMechanisms(
  client: SupabaseClient,
  mechanisms: string[],
): Promise<(EvidenceSource & { id: string })[]> {
  if (mechanisms.length === 0) return [];
  const { data, error } = await client
    .from("forest_evidence_sources")
    .select(
      "id, mechanism, title, authors, year, source_url, summary, external_ites_id",
    )
    .in("mechanism", mechanisms);
  if (error) throw error;
  return (data as (EvidenceSource & { id: string })[]) ?? [];
}

export async function insertCitations(
  client: SupabaseClient,
  prescriptionId: string,
  citations: { evidenceSourceId?: string | null; mechanism: string; relevanceNote?: string | null }[],
): Promise<void> {
  if (citations.length === 0) return;
  const { error } = await client.from("prescription_citations").insert(
    citations.map((c) => ({
      prescription_id: prescriptionId,
      evidence_source_id: c.evidenceSourceId ?? null,
      mechanism: c.mechanism,
      relevance_note: c.relevanceNote ?? null,
    })),
  );
  if (error) throw error;
}

export type CitationRow = {
  mechanism: string | null;
  relevance_note: string | null;
  forest_evidence_sources: {
    title: string;
    authors: string | null;
    year: number | null;
    source_url: string | null;
  } | null;
};

/** 인용 행 → Citation[] (처방/리포트 표시용) */
export function citationRowsToCitations(rows: CitationRow[]): Citation[] {
  return rows.map((r) => ({
    mechanism: r.mechanism ?? "",
    title: r.forest_evidence_sources?.title ?? "",
    authors: r.forest_evidence_sources?.authors ?? null,
    year: r.forest_evidence_sources?.year ?? null,
    source_url: r.forest_evidence_sources?.source_url ?? null,
    relevance_note: r.relevance_note ?? null,
  }));
}

export async function getCitations(
  client: SupabaseClient,
  prescriptionId: string,
): Promise<Citation[]> {
  const { data, error } = await client
    .from("prescription_citations")
    .select(
      "mechanism, relevance_note, forest_evidence_sources(title, authors, year, source_url)",
    )
    .eq("prescription_id", prescriptionId);
  if (error) throw error;
  return citationRowsToCitations((data as unknown as CitationRow[]) ?? []);
}
