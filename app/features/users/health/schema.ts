/**
 * Health Dashboard Schema
 *
 * 건강 대시보드 관련 데이터베이스 스키마 정의
 * 생활습관 기록, 천연물 표적 프로필 등 건강 관련 기능을 위한 테이블들
 */
import { sql, type SQL } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  date,
  doublePrecision,
  index,
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
import { profiles } from "~/features/users/schema";

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
    pgPolicy("routine-templates-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-templates-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-templates-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-templates-delete-policy", {
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
    pgPolicy("routine-grid-options-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-grid-options-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-grid-options-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-grid-options-delete-policy", {
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
    pgPolicy("routine-items-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM routine_templates
        WHERE routine_templates.id = ${table.template_id}
        AND routine_templates.user_id = ${authUid}
      )`,
    }),
    pgPolicy("routine-items-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM routine_templates
        WHERE routine_templates.id = ${table.template_id}
        AND routine_templates.user_id = ${authUid}
      )`,
    }),
    pgPolicy("routine-items-update-policy", {
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
    pgPolicy("routine-items-delete-policy", {
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
    pgPolicy("routine-daily-grid-logs-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-daily-grid-logs-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-daily-grid-logs-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("routine-daily-grid-logs-delete-policy", {
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
 * 공개 읽기 전용: 모든 사용자가 읽을 수 있음, 관리자만 수정 가능
 *
 * safety_notes: 이 성분 단독 사용 시 주의사항 (임산부, 혈압약 등)
 * interaction_notes: 다른 성분·약물과의 상호작용 (시너지, 상쇄, 주의)
 */
export const naturalIngredients = pgTable(
  "natural_ingredients",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    display_name: text().notNull(),
    synonyms: text().array().default([]),
    tagline: text().default(""),
    description: text().default(""),
    mechanism: text().default(""),
    safety_notes: text().default(""),
    interaction_notes: text().default(""), // 다른 성분·약물과의 상호작용 (시너지, 상쇄 등)
    picture: text().default(""),
    ...timestamps,
  },
  (table) => [
    pgPolicy("natural-ingredients-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("natural-ingredients-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("natural-ingredients-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("natural-ingredients-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
  ],
);

/**
 * Ingredient Experiences Table
 *
 * 천연물질 상세 페이지의 "사용 경험" 탭 전용 댓글형 데이터
 * - 성분별 다건 작성 허용 (1인 제한 없음)
 * - 공개 읽기 가능, 작성/수정/삭제는 작성자 본인만 가능
 */
export const ingredientExperiences = pgTable(
  "ingredient_experiences",
  {
    experience_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    ingredient_id: uuid()
      .references(() => naturalIngredients.id, { onDelete: "cascade" })
      .notNull(),
    profile_id: uuid()
      .references(() => profiles.profile_id, { onDelete: "cascade" })
      .notNull(),
    content: text().notNull(),
    usage_goal: text(),
    usage_goal_other: text(),
    duration_label: text(),
    form_factor: text(),
    summary_label: text(),
    ...timestamps,
  },
  (table) => [
    index("ingredient-experiences-ingredient-created-at-idx").on(
      table.ingredient_id,
      table.created_at,
    ),
    pgPolicy("ingredient-experiences-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("ingredient-experiences-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    pgPolicy("ingredient-experiences-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    pgPolicy("ingredient-experiences-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
  ],
);

/**
 * Ingredient Experience Replies Table
 *
 * 사용 경험에 달리는 댓글
 * - 공개 읽기 가능
 * - 작성/수정/삭제는 작성자 본인만 가능
 */
export const ingredientExperienceReplies = pgTable(
  "ingredient_experience_replies",
  {
    experience_reply_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    experience_id: bigint({ mode: "number" })
      .references(() => ingredientExperiences.experience_id, {
        onDelete: "cascade",
      })
      .notNull(),
    parent_id: bigint({ mode: "number" }).references(
      (): AnyPgColumn => ingredientExperienceReplies.experience_reply_id,
      {
        onDelete: "cascade",
      },
    ),
    profile_id: uuid()
      .references(() => profiles.profile_id, { onDelete: "cascade" })
      .notNull(),
    reply: text().notNull(),
    ...timestamps,
  },
  (table) => [
    index("ingredient-experience-replies-experience-created-at-idx").on(
      table.experience_id,
      table.created_at,
    ),
    pgPolicy("ingredient-experience-replies-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("ingredient-experience-replies-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    pgPolicy("ingredient-experience-replies-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    pgPolicy("ingredient-experience-replies-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
  ],
);

/**
 * Natural Targets Table
 *
 * 표적 (GLUT, NF-kB 등)
 * 공개 읽기 전용: 모든 사용자가 읽을 수 있음, 관리자만 수정 가능
 */
export const naturalTargets = pgTable(
  "natural_targets",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    display_name: text().notNull(),
    description: text(),
    ...timestamps,
  },
  (table) => [
    pgPolicy("natural-targets-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("natural-targets-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("natural-targets-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("natural-targets-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
  ],
);

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
    target_slug: text("target_slug"), // natural_targets.slug 디노말라이즈 (JOIN 없이 조회용)
    meta_axis: text()
      .notNull()
      .$type<
        | "metabolic_stability"
        | "immune_balance"
        | "abnormal_signals"
        | "neuro_stress"
        | "recovery"
      >(),
    axis_weight: doublePrecision().notNull().default(1),
    axis_label: text("axis_label").generatedAlwaysAs(
      (): SQL =>
        sql`CASE ${targetToMetaAxis.meta_axis}
          WHEN 'metabolic_stability' THEN '대사 안정화'
          WHEN 'immune_balance' THEN '면역 균형'
          WHEN 'abnormal_signals' THEN '비정상 신호조절'
          WHEN 'neuro_stress' THEN '신경·스트레스 개입'
          WHEN 'recovery' THEN '회복증진'
          ELSE NULL
        END`
    ),
    axis_description: text("axis_description").generatedAlwaysAs(
      (): SQL =>
        sql`CASE ${targetToMetaAxis.meta_axis}
          WHEN 'metabolic_stability' THEN '암세포의 포도당, 단백질, 지방 대사 억제'
          WHEN 'immune_balance' THEN '면역비율(th1/th2), 면역관문, 순환종양세포(CTC), 종양미세환경, 염증신호, 마이크로 바이옴'
          WHEN 'abnormal_signals' THEN '성장인자, 침윤 및 전이 인자, 호르몬'
          WHEN 'neuro_stress' THEN '자율신경+면역대사, 세포자멸사+치료민감도'
          WHEN 'recovery' THEN '후성유전, 미토콘드리아 회복, 인체회복, 디톡스'
          ELSE NULL
        END`
    ),
    axis_llm_description: text("axis_llm_description").generatedAlwaysAs(
      (): SQL =>
        sql`CASE ${targetToMetaAxis.meta_axis}
          WHEN 'metabolic_stability' THEN '이 축은 단순한 혈당 관리나 체중 관리가 아니라, 암세포와 정상세포가 사용하는 연료 흐름과 에너지 생산 환경을 해석하기 위한 축이다. 여기에는 포도당, 글루타민, 지방산과 같은 연료의 유입과 사용, 그리고 Acetyl-CoA를 중심으로 한 에너지 생산 및 세포 구성물질 생합성 환경이 포함된다. 주요하게는 GLUT1, insulin, IGF-1, AMPK, mTOR, PPP pathway, aerobic glycolysis, OXPHOS, glutaminolysis, fatty acid synthesis/oxidation, mevalonate pathway, macropinocytosis, nucleoside salvage 등과 같은 대사 표적과 경로를 내부 논리로 사용한다. 이 축의 목적은 특정 대사 경로를 진단하는 것이 아니라, 대상자의 현재 몸이 암세포에게 연속적이고 유리한 에너지 공급 환경인지, 아니면 상대적으로 제한되고 안정된 환경인지를 설명하는 데 있다. 이 축에서는 설명을 혈당 변동성이 큰 상태, 인슐린 자극이 잦은 상태, 한쪽 대사 경로에 과도하게 의존하거나 보상적 전환이 일어날 가능성이 있는 상태, 에너지 공급이 비교적 차분한 상태와 같은 생활-생리 언어로 풀어야 한다.'
          WHEN 'immune_balance' THEN '이 축은 단순히 면역력이 강하다/약하다를 판단하는 축이 아니라, 암과 면역계가 상호작용하는 면역 미세환경의 균형 상태를 해석하기 위한 축이다. 여기에는 장내 미생물군, 종양 관련 대식세포(TAMs), T 조절세포(Treg), 골수유래 억제세포(MDSC), 면역 억제 사이토카인(TGF-β, IL-10, IL-6 등), 면역 자극 사이토카인, 면역관문(PD-1, PD-L1, CTLA-4), 산성 종양미세환경, 면역사막/뜨거운 종양 개념이 포함된다. 이 축의 목적은 면역을 올린다가 아니라, 대상자의 현재 상태가 효율적인 항암 면역이 작동하기 어려운 환경인지, 혹은 면역세포가 더 잘 인식하고 반응할 수 있는 방향인지를 설명하는 데 있다. 이 축에서는 특정 면역세포 수치 하나로 면역 상태를 단정하지 않고, 장내 환경, 염증 패턴, 치료 이력, 수면, 스트레스, 혈액검사 등 다양한 단서를 종합해 면역 억제 신호가 상대적으로 강한 환경인지, 장내 미생물 다양성과 면역 훈련 환경이 유지되고 있는지를 해석해야 한다.'
          WHEN 'abnormal_signals' THEN '이 축은 암의 성장, 증식, 침윤, 전이와 관련된 상위 세포 신호와 성장 자극을 해석하기 위한 축이다. 여기서 말하는 비정상 신호는 특정 유전자 변이 하나가 아니라, 만성적 자극에 의해 반복적으로 켜지는 성장·침윤·호르몬·혈관신생 관련 스위치를 의미한다. 주요하게는 NF-kB, JAK/STAT, Hedgehog, Wnt/beta-catenin, Notch, EGFR, estrogen receptor, VEGF, PDGF, TGF-β, integrins, MMPs 등의 경로를 내부 논리로 사용한다. 이 축의 목적은 대상자의 상태가 성장 신호가 자주 켜지는 방향인지, 전이와 침윤을 밀어주는 자극이 누적되고 있는지를 설명하는 데 있다. 설명은 성장인자 자극이 반복되는 환경, 염증과 성장 신호가 겹쳐 종양에 유리한 방향으로 기울어진 상태, 전이와 조직 침윤을 돕는 신호가 열려 있을 수 있는 환경과 같은 방향성 중심 언어로 풀어야 한다.'
          WHEN 'neuro_stress' THEN '이 축은 자율신경계(교감/부교감), 스트레스 호르몬 축(SAM/HPA), 일주기 리듬, 그리고 이들이 면역·대사·세포자멸사에 미치는 조절 효과를 해석하기 위한 축이다. 이 축의 목적은 단순히 스트레스가 많다/적다를 말하는 것이 아니라, 만성적인 교감신경 항진과 아드레날린·노르에피네프린·코티솔 노출이 대상자의 몸을 종양 친화적 환경으로 밀고 있는지, 혹은 회복과 치료 반응에 유리한 쪽으로 유지되고 있는지를 설명하는 데 있다. 여기에는 HRV, 수면, 일주기 리듬, 멜라토닌-코티솔 패턴, 베타 아드레날린 신호, 스트레스에 따른 면역 억제와 치료 민감도 변화가 포함된다. 즉 이 축은 독립적인 결과 축이라기보다 다른 축들을 위에서 흔드는 조절 레이어이며, 설명은 교감신경 항진의 만성화, 수면과 일주기 리듬 붕괴, 신경-면역-대사 시스템의 불균형 여부를 중심으로 풀어야 한다.'
          WHEN 'recovery' THEN '이 축은 단순한 피로 회복이나 일반적 건강 증진을 설명하는 축이 아니라, 후성유전 조절, 미토콘드리아 기능, 산화환원 상태, 활성산소종(ROS), 세포자멸사 민감도, 인체의 회복·배출 기능을 통합적으로 해석하기 위한 축이다. 이 축의 목적은 몸을 보한다가 아니라, 손상된 정상 조직은 회복시키되 암세포는 더 이상 쉽게 버티지 못하도록 하는 내부 복구 환경과 제거 능력을 설명하는 데 있다. 후성유전 측면에서는 DNA 메틸화, 히스톤 아세틸화, RNA 간섭과 같은 조절을 통해 어떤 유전자가 켜지고 꺼지는지가 중요하며, 미토콘드리아와 ROS 조절은 정상 회복과 비정상 세포 제거의 균형에 직접 연결된다. 이 축은 항산화를 무조건 늘리는 축이 아니며, 회복·후성유전·미토콘드리아·apoptosis·해독을 통합한 내부 복구층으로 해석되어야 한다.'
          ELSE NULL
        END`
    ),
  },
  (table) => [
    primaryKey({ columns: [table.target_id, table.meta_axis] }),
    check("axis_weight_check", sql`axis_weight >= 0 AND axis_weight <= 2`),
    pgPolicy("target-to-meta-axis-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("target-to-meta-axis-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("target-to-meta-axis-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("target-to-meta-axis-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
  ],
);

/**
 * Diseases Table (정규화된 암/질병 유형)
 *
 * disease_slug 텍스트 산재 방지 (breast cancer, breast_cancer, HER2+ 등 통일)
 * - slug: diseases.slug에 매핑 (candidates.disease_slug, ites.disease_id)
 * - synonyms: 동의어 배열 (breast cancer, mammary carcinoma, 유방암 등) - 검색/매칭용
 * - parent_id: 계층 구조 (예: breast_cancer → her2_positive_breast_cancer)
 * - disease_group: solid_tumor, carcinoma 등 분류
 */
export const diseases = pgTable(
  "diseases",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    display_name: text().notNull(),
    synonyms: text().array().default([]), // 동의어 (breast cancer, mammary carcinoma, 유방암 등)
    parent_id: uuid().references((): any => diseases.id, { onDelete: "set null" }),
    disease_group: text(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("diseases_slug_idx").on(table.slug),
    index("diseases_parent_id_idx").on(table.parent_id),
    index("diseases_disease_group_idx").on(table.disease_group),
    pgPolicy("diseases-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("diseases-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("diseases-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("diseases-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
  ],
);

/**
 * Dose Info: 용량/투여 정보 (dose_info_candidates, ites.dose_info 공통)
 * MVP: species(동물→인간 해석), form(생체이용률) 필수
 */
export type DoseInfo = {
  amount?: number;
  unit?: string; // mg, mg/kg, g 등
  route?: string; // oral, iv, ip, topical 등
  frequency?: string; // daily, bid, weekly 등
  duration?: string; // 4 weeks, 12 weeks 등
  species?: string; // human, mouse, rat, dog 등
  form?: string; // powder, extract, capsule, nanoparticle 등
  notes?: string; // "with piperine", "95% curcuminoids" 등
  [key: string]: unknown;
};

/**
 * Evidence Sources Table
 *
 * 논문 단위 정보를 저장하는 테이블
 * PubMed, Crossref 등에서 가져온 논문 정보를 중앙 관리
 *
 * n8n 추출 흐름: 논문 → candidates(예상 성분·표적) → 인간 검수 → ite/ites 연결
 * candidates.disease_slug → diseases.slug 매핑 (ites.disease_id로 저장)
 *
 * 한 논문이 여러 ingredient-target 조합에 재사용될 수 있음
 */
export const evidenceSources = pgTable(
  "evidence_sources",
  {
    id: uuid().primaryKey().defaultRandom(),
    pmid: text(),
    doi: text(),
    doi_norm: text(),
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
        /** 예상 성분 slug (natural_ingredients.slug). n8n 추출 → 인간 검수 후 ite/ites 연결 */
        ingredient_slug: string;
        target_slug: string;
        note?: string;
        effect?: "inhibit" | "activate" | "unclear";
        outcome_direction?: "positive" | "negative" | "neutral";
        /** 질병 slug (diseases.slug). 정규화용 - 인간 검수 시 disease_id로 매핑 */
        disease_slug?: string;
        outcome_text?: string;
        confidence?: number;
        extraction_note?: string;
      }>
    >(),
    /** 용량 정보 (candidates와 분리). dose_info_candidates[i] ↔ candidates[i] 또는 candidate_index로 매칭 */
    dose_info_candidates: jsonb().$type<
      Array<DoseInfo & { candidate_index?: number }>
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
    // plain UNIQUE indexes (Supabase REST on_conflict 매칭용), title_year_key(generated) - SQL migration
    // See: sql/migrations/0099_evidence_sources_unique_refactor.sql
    // Postgres UNIQUE는 NULL 자동 중복 허용 → WHERE 없이 plain UNIQUE 사용
    check(
      "evidence_sources_identifier_check",
      sql`(("pmid" IS NOT NULL) OR ("doi_norm" IS NOT NULL AND "doi_norm" != '') OR ("title" IS NOT NULL AND "title" != '' AND "year" IS NOT NULL))`,
    ),
    check(
      "evidence_sources_strength_check",
      sql`strength >= 0 AND strength <= 2`,
    ),
    pgPolicy("evidence-sources-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("evidence-sources-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("evidence-sources-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("evidence-sources-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
  ],
);

/**
 * Evidence Figures Table
 *
 * 증거(논문) 내 도표/이미지 정보를 저장하는 테이블
 * Storage에 저장된 도표 이미지 경로 및 메타데이터를 관리
 * evidence_sources와 연결되어 논문 단위로 도표를 참조
 */
export const evidenceFigures = pgTable(
  "evidence_figures",
  {
    id: uuid().primaryKey().defaultRandom(),
    evidence_source_id: uuid().references(() => evidenceSources.id, {
      onDelete: "cascade",
    }),
    doi_norm: text(),
    pmid_norm: text(),
    figure_no: text().notNull(),
    source_url: text(),
    license: text().default("unknown"),
    image_path: text().notNull(),
    image_sha256: text().notNull(),
    caption_raw: text(),
    figure_type: text(),
    axes: jsonb().$type<Record<string, unknown>>(),
    groups: jsonb().$type<Record<string, unknown>>(),
    key_numbers: jsonb().$type<Record<string, unknown>>(),
    key_results: jsonb().$type<Record<string, unknown>>(),
    limitations: jsonb().$type<Record<string, unknown>>(),
    figure_summary_kr: text(),
    figure_interpretation_kr: text(),
    practical_takeaways_kr: jsonb().$type<Record<string, unknown>[]>(),
    alt_text_kr: text(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("evidence_figures_unique_idx").on(
      table.doi_norm,
      table.figure_no,
      table.image_sha256,
    ),
    index("evidence_figures_doi_idx").on(table.doi_norm),
    index("evidence_figures_pmid_idx").on(table.pmid_norm),
    index("evidence_figures_evidence_source_id_idx").on(
      table.evidence_source_id,
    ),
    pgPolicy("evidence-figures-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("evidence-figures-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("evidence-figures-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("evidence-figures-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
  ],
);

/**
 * Ingredient-Target Effect: inhibit(억제) vs activate(활성화) vs unclear(불명)
 */
export const ingredientTargetEffectEnum = pgEnum(
  "ingredient_target_evidence_effect",
  ["inhibit", "activate", "unclear"],
);

/**
 * Outcome Direction: 논문/매핑별 결과 방향
 * positive=유리, negative=불리, neutral=중립(불명 포함)
 */
export const outcomeDirectionEnum = pgEnum("outcome_direction_enum", [
  "positive",
  "negative",
  "neutral",
]);

/**
 * Ingredient Target Evidence Table (Aggregate)
 *
 * 성분 → 표적 매핑의 요약 정보
 * 실제 논문 정보는 evidence_sources와 ingredient_target_evidence_sources를 통해 관리
 *
 * - 성분-표적 조합은 1행만 유지 (ingredient_id + target_id unique)
 * - strength는 연결된 논문들의 max(strength)로 자동 계산 (트리거 사용 권장)
 * - study_type은 연결된 논문들의 최고 study_type으로 자동 계산 (트리거 사용 권장)
 * - effect: 해당 성분이 표적을 inhibit(억제)/activate(활성화)/unclear(불명) 구분
 * - outcome_direction: 결과 방향 (positive/negative/neutral)
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
    effect: ingredientTargetEffectEnum(),
    outcome_direction: outcomeDirectionEnum(),
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
    pgPolicy("ingredient-target-evidence-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("ingredient-target-evidence-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("ingredient-target-evidence-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("ingredient-target-evidence-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
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
 *
 * 흐름: n8n 추출 → evidence_sources.candidates → 인간 검수 → ite/ites 연결
 * disease_id: diseases 테이블 FK (candidates.disease_slug로 매칭 후 저장)
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
    disease_id: uuid().references(() => diseases.id, { onDelete: "set null" }), // 정규화된 질병/적응증 (diseases.slug와 candidates.disease_slug 매칭)
    outcome_text: text(), // 논문별 결과 요약
    dose_info: jsonb().$type<DoseInfo>(), // 용량/투여 정보 (dose_info_candidates와 동일 구조)
    created_at: timestamp().notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ingredient_target_evidence_sources_unique_idx").on(
      table.ingredient_target_evidence_id,
      table.evidence_source_id,
    ),
    // is_primary = true인 행은 각 ingredient_target_evidence_id당 딱 1개만 존재
    // Drizzle ORM에서는 partial unique index를 직접 지원하지 않으므로 마이그레이션에서 추가
    check(
      "extracted_strength_override_check",
      sql`("extracted_strength_override" IS NULL) OR ("extracted_strength_override" >= 0 AND "extracted_strength_override" <= 2)`,
    ),
    pgPolicy("ingredient-target-evidence-sources-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("ingredient-target-evidence-sources-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("ingredient-target-evidence-sources-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("ingredient-target-evidence-sources-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )`,
    }),
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
    pgPolicy("product-ingredients-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("product-ingredients-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("product-ingredients-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      )`,
    }),
    pgPolicy("product-ingredients-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      )`,
    }),
  ],
);

/**
 * Report Requests Table
 *
 * 건강 리포트 요청 (CTA → n8n webhook → 워크플로우)
 * 사용자 입력 + 생성 시점 스냅샷(혈액검사, 생활습관, 개인 프로필) 저장
 */
export const reportRequestStatusEnum = pgEnum("report_request_status", [
  "requested",
  "draft_ready",
  "under_review",
  "completed",
  "failed",
]);

/** health_reports.pdf_status: PDF 생성 상태 */
export const healthReportPdfStatusEnum = pgEnum("health_report_pdf_status", [
  "pdf_generating",
  "pdf_ready",
]);

export const reportRequests = pgTable(
  "report_requests",
  {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    status: reportRequestStatusEnum().notNull().default("requested"),
    /** 메인 워크플로에서만 갱신: requested 시 sub1_health·sub2_health, draft_ready 시 sub3_health 등 */
    current_step: text(),
    /** 실패 시 운영 복구용 (n8n/자동화에서 기록) */
    last_error_message: text(),
    /** 재시도 횟수 (선택 운영 지표) */
    retry_count: integer().notNull().default(0),
    input_json: jsonb().$type<Record<string, unknown>>().notNull(),
    sub1_input_json: jsonb().$type<Record<string, unknown>>(),
    snapshot_json: jsonb().$type<Record<string, unknown>>(),
    report_type: text().default("v1"),
    paid_status: text().$type<"paid" | "free">().default("free"),
    ...timestamps,
  },
  (table) => [
    index("report_requests_user_id_idx").on(table.user_id),
    index("report_requests_status_idx").on(table.status),
    pgPolicy("report-requests-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("report-requests-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("report-requests-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("report-requests-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Health Reports Table
 *
 * 생성된 건강 리포트 (n8n 워크플로우 결과)
 * report_requests와 1:1 연결
 */
export const healthReports = pgTable(
  "health_reports",
  {
    id: uuid().primaryKey().defaultRandom(),
    request_id: uuid()
      .notNull()
      .references(() => reportRequests.id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    version: integer().notNull().default(1),
    report_json: jsonb().$type<Record<string, unknown>>(),
    report_html: text(),
    pdf_url: text(),
    pdf_path: text(),
    pdf_status: healthReportPdfStatusEnum(),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    uniqueIndex("health_reports_request_id_unique").on(table.request_id),
    index("health_reports_user_id_idx").on(table.user_id),
    pgPolicy("health-reports-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("health-reports-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("health-reports-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("health-reports-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
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
    pgPolicy("streaks-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("streaks-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("streaks-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("streaks-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);
