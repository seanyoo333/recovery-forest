/**
 * Health Dashboard Schema
 *
 * 건강 대시보드 관련 데이터베이스 스키마 정의
 * 생활습관 기록, 천연물 표적 프로필 등 건강 관련 기능을 위한 테이블들
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";
import { products } from "~/features/products/schema";

/**
 * Health Habit Enums
 */
export const habitCategoryEnum = pgEnum("habit_category", [
  "exercise",
  "sleep",
  "supplement",
  "diet",
  "therapy",
]);

export const habitTimeBlockEnum = pgEnum("habit_time_block", [
  "am",
  "noon",
  "pm",
  "bed",
]);

export const gridOptionKindEnum = pgEnum("grid_option_kind", [
  "preset",
  "template",
]);

/**
 * Routine Templates Table
 *
 * 상세 설정 템플릿 (아침 루틴1, 저강도 등)
 */
export const routineTemplates = pgTable(
  "routine_templates",
  {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    section_type: habitCategoryEnum().notNull(),
    name: text().notNull(),
    notes: text(),
    sort_order: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    pgPolicy("routine-templates-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-templates-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-templates-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-templates-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Routine Grid Options Table
 *
 * 그리드 셀에서 선택할 수 있는 옵션들 (저강도, 루틴1, 숙면 등)
 */
export const routineGridOptions = pgTable(
  "routine_grid_options",
  {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    category: habitCategoryEnum().notNull(),
    label: text().notNull(),
    kind: gridOptionKindEnum().notNull(),
    template_id: uuid().references(() => routineTemplates.id, {
      onDelete: "set null",
    }),
    sort_order: integer().notNull().default(0),
    is_active: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [
    // Note: Partial unique indexes are created via SQL migration
    // See: sql/migrations/0086_fix_grid_options_unique_constraint.sql
    // - routine_grid_options_user_category_template_uidx (template_id IS NOT NULL)
    // - routine_grid_options_user_category_label_uidx (template_id IS NULL)
    pgPolicy("routine-grid-options-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-grid-options-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-grid-options-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-grid-options-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Routine Items Table
 *
 * 템플릿의 세부 아이템들 (버버린 500mg, 커큐민 1000mg 등)
 *
 * label: 사용자가 입력한 표시명 (예: "MCS 버버린")
 * ingredient_id: 전역 성분과의 연결 (선택적, 레이더 차트 계산용)
 */
export const routineItems = pgTable(
  "routine_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    template_id: uuid()
      .notNull()
      .references(() => routineTemplates.id, { onDelete: "cascade" }),
    sort_order: integer().notNull().default(0),
    label: text().notNull(),
    ingredient_id: uuid().references(() => naturalIngredients.id, {
      onDelete: "set null",
    }),
    amount_num: doublePrecision(),
    amount_unit: text(),
    meta: jsonb().$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    pgPolicy("routine-items-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM routine_templates
        WHERE routine_templates.id = ${table.template_id}
        AND routine_templates.user_id = ${authUid}
      )`,
    }),
    pgPolicy("routine-items-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM routine_templates
        WHERE routine_templates.id = ${table.template_id}
        AND routine_templates.user_id = ${authUid}
      )`,
    }),
    pgPolicy("routine-items-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM routine_templates
        WHERE routine_templates.id = ${table.template_id}
        AND routine_templates.user_id = ${authUid}
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM routine_templates
        WHERE routine_templates.id = ${table.template_id}
        AND routine_templates.user_id = ${authUid}
      )`,
    }),
    pgPolicy("routine-items-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM routine_templates
        WHERE routine_templates.id = ${table.template_id}
        AND routine_templates.user_id = ${authUid}
      )`,
    }),
  ],
);

/**
 * Routine Daily Grid Logs Table
 *
 * 오늘 입력한 그리드 로그 (가볍게 저장)
 */
export const routineDailyGridLogs = pgTable(
  "routine_daily_grid_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    log_date: date().notNull(),
    time_block: habitTimeBlockEnum().notNull(),
    category: habitCategoryEnum().notNull(),
    option_id: uuid().references(() => routineGridOptions.id, {
      onDelete: "set null",
    }),
    template_id: uuid().references(() => routineTemplates.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("routine_daily_grid_logs_unique_idx").on(
      table.user_id,
      table.log_date,
      table.time_block,
      table.category,
    ),
    pgPolicy("routine-daily-grid-logs-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-daily-grid-logs-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-daily-grid-logs-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-daily-grid-logs-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Natural Ingredients Table
 *
 * 천연물 성분 (커큐민, 퀘르세틴 등)
 */
export const naturalIngredients = pgTable("natural_ingredients", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  display_name: text().notNull(),
  synonyms: text().array().default([]),
  ...timestamps,
});

/**
 * Natural Targets Table
 *
 * 표적 (GLUT, NF-kB 등)
 */
export const naturalTargets = pgTable("natural_targets", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  display_name: text().notNull(),
  description: text(),
  ...timestamps,
});

/**
 * Target to Meta Axis Table
 *
 * 표적 → 메타축 매핑 (표적이 어떤 메타축에 기여하는지)
 * 레이더 차트용 메인 분류
 *
 * 예시:
 * - HDAC → hormone (후성유전은 호르몬·신호 축)
 * - EMT/MMP → recovery (전이/침윤은 회복·보호 축)
 */
export const targetToMetaAxis = pgTable(
  "target_to_meta_axis",
  {
    target_id: uuid()
      .notNull()
      .references(() => naturalTargets.id, { onDelete: "cascade" }),
    meta_axis: text()
      .notNull()
      .$type<
        | "metabolic"
        | "inflammation"
        | "immune"
        | "hormone"
        | "neuro"
        | "recovery"
      >(),
    axis_weight: doublePrecision().notNull().default(1),
  },
  (table) => [
    primaryKey({ columns: [table.target_id, table.meta_axis] }),
    check("axis_weight_check", sql`axis_weight >= 0 AND axis_weight <= 2`),
  ],
);

/**
 * Evidence Sources Table
 *
 * 논문 단위 정보를 저장하는 테이블
 * PubMed, Crossref 등에서 가져온 논문 정보를 중앙 관리
 *
 * 한 논문이 여러 ingredient-target 조합에 재사용될 수 있음
 */
export const evidenceSources = pgTable(
  "evidence_sources",
  {
    id: uuid().primaryKey().defaultRandom(),
    pmid: text(),
    doi: text(),
    url: text(),
    title: text(),
    journal: text(),
    year: integer(),
    authors: text(),
    summary: text(),
    source: text(),
    cited: integer(),
    snippet: text(),
    candidates: jsonb().$type<
      Array<{
        ingredient_slug: string;
        target_slug: string;
        note: string;
      }>
    >(),
    status: text(),
    study_type: text()
      .notNull()
      .default("mechanistic")
      .$type<
        | "systematic_review"
        | "rct"
        | "human_observational"
        | "case_report"
        | "animal"
        | "cell"
        | "mechanistic"
      >(),
    strength: doublePrecision().notNull().default(1),
    retrieved_at: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Partial unique indexes are created via SQL migration
    // See: sql/migrations/0095_fix_evidence_sources_unique_indexes.sql
    // - evidence_sources_pmid_unique_idx (WHERE pmid IS NOT NULL AND pmid != '')
    // - evidence_sources_doi_unique_idx (WHERE doi IS NOT NULL AND doi != '')
    check(
      "evidence_sources_pmid_or_doi_check",
      sql`(("pmid" IS NOT NULL AND "pmid" != '') OR ("doi" IS NOT NULL AND "doi" != ''))`,
    ),
    check("evidence_sources_strength_check", sql`strength >= 0 AND strength <= 2`),
  ],
);

/**
 * Ingredient Target Evidence Table (Aggregate)
 *
 * 성분 → 표적 매핑의 요약 정보
 * 실제 논문 정보는 evidence_sources와 ingredient_target_evidence_sources를 통해 관리
 *
 * - 성분-표적 조합은 1행만 유지 (ingredient_id + target_id unique)
 * - strength는 연결된 논문들의 max(strength)로 자동 계산 (트리거 사용 권장)
 * - study_type은 연결된 논문들의 최고 study_type으로 자동 계산 (트리거 사용 권장)
 *
 * 사용 예시:
 * - 커큐민 → NF-κB (여러 논문이 연결될 수 있음)
 */
export const ingredientTargetEvidence = pgTable(
  "ingredient_target_evidence",
  {
    id: uuid().primaryKey().defaultRandom(),
    ingredient_id: uuid()
      .notNull()
      .references(() => naturalIngredients.id, { onDelete: "cascade" }),
    target_id: uuid()
      .notNull()
      .references(() => naturalTargets.id, { onDelete: "cascade" }),
    strength: doublePrecision().notNull().default(1),
    study_type: text()
      .notNull()
      .default("mechanistic")
      .$type<
        | "systematic_review"
        | "rct"
        | "human_observational"
        | "case_report"
        | "animal"
        | "cell"
        | "mechanistic"
      >(),
    notes: text(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // 성분-표적 조합은 1행만 유지 (study_type은 여러 논문 중 최고값으로 자동 계산)
    uniqueIndex("ingredient_target_evidence_ing_target_uidx").on(
      table.ingredient_id,
      table.target_id,
    ),
    check("strength_check", sql`strength >= 0 AND strength <= 2`),
  ],
);

/**
 * Ingredient Target Evidence Sources Mapping Table
 *
 * ingredient_target_evidence와 evidence_sources를 연결하는 매핑 테이블
 * 한 논문이 여러 ingredient-target 조합에 사용될 수 있음
 *
 * 제약사항:
 * - is_primary = true인 행은 각 ingredient_target_evidence_id당 딱 1개만 존재 가능
 * - 같은 ingredient_target_evidence_id와 evidence_source_id 조합은 중복 불가
 */
export const ingredientTargetEvidenceSources = pgTable(
  "ingredient_target_evidence_sources",
  {
    id: uuid().primaryKey().defaultRandom(),
    ingredient_target_evidence_id: uuid()
      .notNull()
      .references(() => ingredientTargetEvidence.id, { onDelete: "cascade" }),
    evidence_source_id: uuid()
      .notNull()
      .references(() => evidenceSources.id, { onDelete: "cascade" }),
    is_primary: boolean().notNull().default(false), // 주요 근거인지 여부
    extracted_strength_override: doublePrecision(), // 이 매핑에서만 사용하는 strength 오버라이드 (null이면 evidence_sources.strength 사용)
    note: text(), // 이 매핑에 대한 추가 설명
    created_at: timestamp().notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "ingredient_target_evidence_sources_unique_idx",
    ).on(table.ingredient_target_evidence_id, table.evidence_source_id),
    // is_primary = true인 행은 각 ingredient_target_evidence_id당 딱 1개만 존재
    // Drizzle ORM에서는 partial unique index를 직접 지원하지 않으므로 마이그레이션에서 추가
    check(
      "extracted_strength_override_check",
      sql`("extracted_strength_override" IS NULL) OR ("extracted_strength_override" >= 0 AND "extracted_strength_override" <= 2)`,
    ),
  ],
);

/**
 * Product Ingredients Table
 *
 * Products와 Natural Ingredients 연결
 */
export const productIngredients = pgTable(
  "product_ingredients",
  {
    id: uuid().primaryKey().defaultRandom(),
    product_id: bigint({ mode: "number" })
      .notNull()
      .references(() => products.product_id, { onDelete: "cascade" }),
    ingredient_id: uuid()
      .notNull()
      .references(() => naturalIngredients.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_ingredients_unique_idx").on(
      table.product_id,
      table.ingredient_id,
    ),
  ],
);

/**
 * Streaks Table
 *
 * 사용자의 건강습관 기록 연속 일수(스트릭) 정보
 * current_streak: 현재 연속 기록 일수
 * longest_streak: 최장 연속 기록 일수
 * last_log_date: 마지막 기록 날짜
 */
export const streaks = pgTable(
  "streaks",
  {
    user_id: uuid()
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    current_streak: integer().notNull().default(0),
    longest_streak: integer().notNull().default(0),
    last_log_date: date(),
    updated_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    pgPolicy("streaks-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("streaks-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("streaks-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("streaks-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);
