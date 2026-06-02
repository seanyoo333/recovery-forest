import { z } from "zod";

/**
 * 근거 논문 출처. forest_evidence_sources 행과 시드 데이터의 형태.
 * Evidence Base 의 ites(ingredient_target_evidence_sources)로 대체될 수 있도록
 * external_ites_id seam 을 둔다.
 */
export const evidenceSourceSchema = z.object({
  mechanism: z.string().min(1),
  title: z.string().min(1),
  authors: z.string().nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  summary: z.string().nullable().optional(),
  external_ites_id: z.string().nullable().optional(),
});

export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;

/**
 * 처방/리포트에 실리는 인용 형태(출처 + 관련성 메모).
 */
export const citationSchema = z.object({
  mechanism: z.string().min(1),
  title: z.string().min(1),
  authors: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  relevance_note: z.string().nullable().optional(),
});

export type Citation = z.infer<typeof citationSchema>;
