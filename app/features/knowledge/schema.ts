/**
 * Knowledge Schema
 *
 * RAG/지식 검색용 테이블
 * - knowledge_documents: 문서 원본 등록
 * - section_map: section 구조 기준표
 * - knowledge_sections: 분할된 section 텍스트
 * - knowledge_vectors: 벡터 임베딩 저장 (pgvector)
 *
 * RLS: super_admin, content_admin만 모든 작업 가능
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

const adminCheck = sql`EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = ${authUid}
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
)`;

/** 문서 원본 등록 */
export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    doc_id: text().notNull().unique(),
    book_code: text().notNull(),
    book_title: text().notNull(),
    file_name: text(),
    source_type: text()
      .notNull()
      .default("pdf")
      .$type<"pdf" | "doc" | "html" | "other">(),
    language: text().default("ko"),
    version: integer().notNull().default(1),
    is_active: boolean().notNull().default(true),
    ingest_status: text()
      .notNull()
      .default("pending")
      .$type<"pending" | "processing" | "done" | "failed">(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("knowledge_documents_book_code_idx").on(table.book_code),
    pgPolicy("knowledge-documents-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
    }),
    pgPolicy("knowledge-documents-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: adminCheck,
    }),
    pgPolicy("knowledge-documents-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
      withCheck: adminCheck,
    }),
    pgPolicy("knowledge-documents-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
    }),
  ],
);

/** section map 기준표 */
export const sectionMap = pgTable(
  "section_map",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    book_code: text().notNull(),
    book_title: text().notNull(),
    version: integer().notNull().default(1),
    chapter_no: integer(),
    level: integer().notNull(),
    chapter_root: text(),
    parent_title: text(),
    section_title: text().notNull(),
    bucket: text().notNull(),
    axis_tags: text(),
    tags: text(),
    active: boolean().notNull().default(true),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("section_map_book_code_idx").on(table.book_code),
    index("section_map_book_code_active_idx").on(table.book_code, table.active),
    index("section_map_section_title_idx").on(table.section_title),
    pgPolicy("section-map-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
    }),
    pgPolicy("section-map-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: adminCheck,
    }),
    pgPolicy("section-map-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
      withCheck: adminCheck,
    }),
    pgPolicy("section-map-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
    }),
  ],
);

/** 실제 분할된 section 저장 */
export const knowledgeSections = pgTable(
  "knowledge_sections",
  {
    id: uuid().primaryKey().defaultRandom(),
    doc_id: text()
      .notNull()
      .references(() => knowledgeDocuments.doc_id, { onDelete: "cascade" }),
    book_code: text().notNull(),
    book_title: text().notNull(),
    version: integer().notNull().default(1),
    chapter_no: integer(),
    level: integer(),
    chapter_root: text(),
    parent_title: text(),
    section_title: text().notNull(),
    section_text: text().notNull(),
    bucket: text().notNull(),
    axis_tags: text(),
    tags: text(),
    tags_enriched: text(),
    is_active: boolean().notNull().default(true),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("knowledge_sections_doc_id_idx").on(table.doc_id),
    index("knowledge_sections_book_code_idx").on(table.book_code),
    index("knowledge_sections_bucket_idx").on(table.bucket),
    index("knowledge_sections_section_title_idx").on(table.section_title),
    uniqueIndex("knowledge_sections_doc_id_section_title_uidx").on(
      table.doc_id,
      table.section_title,
    ),
    pgPolicy("knowledge-sections-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
    }),
    pgPolicy("knowledge-sections-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: adminCheck,
    }),
    pgPolicy("knowledge-sections-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
      withCheck: adminCheck,
    }),
    pgPolicy("knowledge-sections-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
    }),
  ],
);

/** 벡터 저장 (pgvector) */
export const knowledgeVectors = pgTable(
  "knowledge_vectors",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    content: text().notNull(),
    metadata: jsonb(),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [
    index("knowledge_vectors_metadata_gin_idx").using(
      "gin",
      table.metadata,
    ),
    index("knowledge_vectors_embedding_cosine_idx")
      .using("ivfflat", table.embedding.op("vector_cosine_ops"))
      .with({ lists: 100 }),
    pgPolicy("knowledge-vectors-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
    }),
    pgPolicy("knowledge-vectors-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: adminCheck,
    }),
    pgPolicy("knowledge-vectors-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
      withCheck: adminCheck,
    }),
    pgPolicy("knowledge-vectors-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: adminCheck,
    }),
  ],
);
