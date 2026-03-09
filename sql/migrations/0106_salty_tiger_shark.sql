CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."ingredient_target_evidence_effect" AS ENUM('inhibit', 'activate');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doc_id" text NOT NULL,
	"book_code" text NOT NULL,
	"book_title" text NOT NULL,
	"file_name" text,
	"source_type" text DEFAULT 'pdf' NOT NULL,
	"language" text DEFAULT 'ko',
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"ingest_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_documents_doc_id_unique" UNIQUE("doc_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doc_id" text NOT NULL,
	"book_code" text NOT NULL,
	"book_title" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"chapter_no" integer,
	"level" integer,
	"chapter_root" text,
	"parent_title" text,
	"section_title" text NOT NULL,
	"section_text" text NOT NULL,
	"bucket" text NOT NULL,
	"axis_tags" text,
	"tags" text,
	"tags_enriched" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_vectors" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "knowledge_vectors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"content" text NOT NULL,
	"metadata" jsonb,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "section_map" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "section_map_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"book_code" text NOT NULL,
	"book_title" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"chapter_no" integer,
	"level" integer NOT NULL,
	"chapter_root" text,
	"parent_title" text,
	"section_title" text NOT NULL,
	"bucket" text NOT NULL,
	"axis_tags" text,
	"tags" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ingredient_target_evidence" ADD COLUMN IF NOT EXISTS "effect" "ingredient_target_evidence_effect";--> statement-breakpoint
ALTER TABLE "report_requests" ADD COLUMN IF NOT EXISTS "sub1_input_json" jsonb;--> statement-breakpoint
ALTER TABLE "target_to_meta_axis" ADD COLUMN IF NOT EXISTS "target_slug" text;--> statement-breakpoint
UPDATE "target_to_meta_axis" SET "meta_axis" = 'metabolic_stability' WHERE "meta_axis" = 'metabolic_pressure';--> statement-breakpoint
UPDATE "target_to_meta_axis" tma SET "target_slug" = nt.slug FROM "natural_targets" nt WHERE tma.target_id = nt.id;--> statement-breakpoint
ALTER TABLE "target_to_meta_axis" DROP COLUMN IF EXISTS "axis_label";--> statement-breakpoint
ALTER TABLE "target_to_meta_axis" DROP COLUMN IF EXISTS "axis_description";--> statement-breakpoint
ALTER TABLE "target_to_meta_axis" ADD COLUMN "axis_label" text GENERATED ALWAYS AS (CASE "target_to_meta_axis"."meta_axis"
          WHEN 'metabolic_stability' THEN '대사 안정화'
          WHEN 'immune_balance' THEN '면역 균형'
          WHEN 'abnormal_signals' THEN '비정상 신호조절'
          WHEN 'neuro_stress' THEN '신경·스트레스 개입'
          WHEN 'recovery' THEN '회복증진'
          ELSE NULL
        END) STORED;--> statement-breakpoint
ALTER TABLE "target_to_meta_axis" ADD COLUMN "axis_description" text GENERATED ALWAYS AS (CASE "target_to_meta_axis"."meta_axis"
          WHEN 'metabolic_stability' THEN '암세포의 포도당, 단백질, 지방 대사 억제'
          WHEN 'immune_balance' THEN '면역비율(th1/th2), 면역관문, 순환종양세포(CTC), 종양미세환경, 염증신호, 마이크로 바이옴'
          WHEN 'abnormal_signals' THEN '성장인자, 침윤 및 전이 인자, 호르몬'
          WHEN 'neuro_stress' THEN '자율신경+면역대사, 세포자멸사+치료민감도'
          WHEN 'recovery' THEN '후성유전, 미토콘드리아 회복, 인체회복, 디톡스'
          ELSE NULL
        END) STORED;--> statement-breakpoint
ALTER TABLE "patient_health_profiles" ADD COLUMN IF NOT EXISTS "medical_record_transcripts" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "knowledge_sections" ADD CONSTRAINT "knowledge_sections_doc_id_knowledge_documents_doc_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."knowledge_documents"("doc_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_documents_book_code_idx" ON "knowledge_documents" USING btree ("book_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_sections_doc_id_idx" ON "knowledge_sections" USING btree ("doc_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_sections_book_code_idx" ON "knowledge_sections" USING btree ("book_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_sections_bucket_idx" ON "knowledge_sections" USING btree ("bucket");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_sections_section_title_idx" ON "knowledge_sections" USING btree ("section_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_vectors_metadata_gin_idx" ON "knowledge_vectors" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_vectors_embedding_cosine_idx" ON "knowledge_vectors" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "section_map_book_code_idx" ON "section_map" USING btree ("book_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "section_map_book_code_active_idx" ON "section_map" USING btree ("book_code","active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "section_map_section_title_idx" ON "section_map" USING btree ("section_title");--> statement-breakpoint
DROP VIEW IF EXISTS ingredient_target_evidence_full_view;--> statement-breakpoint
CREATE VIEW ingredient_target_evidence_full_view
WITH (security_invoker = ON) AS
SELECT
  ite.id AS evidence_id,
  ite.ingredient_id,
  ni.display_name AS ingredient_name,
  ni.slug AS ingredient_slug,
  ite.target_id,
  nt.slug AS target_slug,
  nt.display_name AS target_name,
  nt.description AS target_description,
  ite.effect,
  ite.strength,
  ite.study_type,
  ite.notes AS evidence_notes,
  tma.meta_axis,
  tma.axis_weight,
  COUNT(DISTINCT ites.evidence_source_id) AS evidence_count,
  COUNT(DISTINCT CASE WHEN ites.is_primary = true THEN ites.evidence_source_id END) AS primary_evidence_count,
  ite.created_at AS evidence_created_at,
  ite.updated_at AS evidence_updated_at
FROM ingredient_target_evidence ite
INNER JOIN natural_ingredients ni ON ite.ingredient_id = ni.id
INNER JOIN natural_targets nt ON ite.target_id = nt.id
INNER JOIN target_to_meta_axis tma ON nt.id = tma.target_id
LEFT JOIN ingredient_target_evidence_sources ites ON ite.id = ites.ingredient_target_evidence_id
GROUP BY
  ite.id,
  ite.ingredient_id,
  ni.display_name,
  ni.slug,
  ite.target_id,
  nt.slug,
  nt.display_name,
  nt.description,
  ite.effect,
  ite.strength,
  ite.study_type,
  ite.notes,
  tma.meta_axis,
  tma.axis_weight,
  ite.created_at,
  ite.updated_at;