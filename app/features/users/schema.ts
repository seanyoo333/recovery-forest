/**
 * User Profile Schema
 *
 * This file defines the database schema for user profiles and sets up
 * Supabase Row Level Security (RLS) policies to control data access.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { makeIdentityColumn, timestamps } from "~/core/db/helpers.server";

import { posts } from "../community/schema";
import { team } from "../teams/schema";

/**
 * Profiles Table
 *
 * Stores additional user profile information beyond the core auth data.
 * Links to Supabase auth.users table via profile_id foreign key.
 *
 * Includes Row Level Security (RLS) policies to ensure users can only
 * access and modify their own profile data.
 */

// Use Drizzle ORM's built-in authUsers schema instead of manual definition
// import { authUsers } from "drizzle-orm/supabase";

// 사용자 역할 (실제 데이터베이스 구조와 일치)
export const userRoles = pgEnum("user_role", [
  "healthy",
  "patient",
  "caregiver",
  "doctor",
  "health_exp",
  "other",
]);

// 관리자 권한 (시스템에서만 설정 가능)
export const adminRoles = pgEnum("admin_role", [
  "super_admin", // 모든 권한
  "content_admin", // 콘텐츠 관리
  "user_admin", // 사용자 관리
  "product_admin", // 제품 관리
  "clinic_admin", // 병원 관리
]);

export const profiles = pgTable(
  "profiles",
  {
    // Primary key that references the Supabase auth.users id
    // Using CASCADE ensures profile is deleted when user is deleted
    profile_id: uuid()
      .primaryKey()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),
    name: text().notNull(),
    avatar: text(),
    username: text().notNull(),
    email: text(),
    headline: text(),
    bio: text(),
    role: userRoles().notNull().default("patient"), // 고객이 선택하는 역할
    stats: jsonb()
      .$type<{
        followers: number;
        following: number;
      }>()
      .default({ followers: 0, following: 0 }),
    post_count: bigint({ mode: "number" }).notNull().default(0),
    views: jsonb(),
    marketing_consent: boolean("marketing_consent").notNull().default(false),
    // 포인트 시스템 관련 필드
    points: bigint({ mode: "number" }).notNull().default(0),
    points_updated_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    // Adds created_at and updated_at timestamp columns
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    updated_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    // RLS Policy: Users can only update their own profile
    pgPolicy("User can only update their own profiles", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
      using: sql`${authUid} = ${table.profile_id}`,
    }),
    // RLS Policy: Users can only delete their own profile
    pgPolicy("User can only delete their own profile", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
    // RLS Policy: All users can view all profiles
    pgPolicy("Enable read access for all users", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("Enable insert for authenticated users only", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`true`,
    }),
  ],
);

export const adminPermissions = pgTable(
  "admin_permissions",
  {
    admin_id: uuid()
      .primaryKey()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      }),
    admin_role: adminRoles().notNull(),
    is_active: boolean().notNull().default(true),
    created_by: uuid().references(() => profiles.profile_id),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    updated_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    pgPolicy("admin-permissions-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.admin_id}`,
    }),
    // super_admin만 새로운 관리자를 생성할 수 있음
    pgPolicy("admin-permissions-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role = 'super_admin'
        AND is_active = true
      )`,
    }),
    // super_admin만 관리자 권한을 수정할 수 있음
    pgPolicy("admin-permissions-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role = 'super_admin'
        AND is_active = true
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role = 'super_admin'
        AND is_active = true
      )`,
    }),
    // super_admin만 관리자 권한을 삭제할 수 있음
    pgPolicy("admin-permissions-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role = 'super_admin'
        AND is_active = true
      )`,
    }),
  ],
);

export const follows = pgTable(
  "follows",
  {
    follower_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    following_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.follower_id, table.following_id] }),
    // 모든 사용자가 팔로우 관계를 조회할 수 있음
    pgPolicy("follows-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 인증된 사용자만 팔로우를 생성할 수 있음 (자신이 팔로워여야 함)
    pgPolicy("follows-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.follower_id}`,
    }),
    // 인증된 사용자만 자신의 팔로우를 수정할 수 있음
    pgPolicy("follows-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.follower_id}`,
      withCheck: sql`${authUid} = ${table.follower_id}`,
    }),
    // 인증된 사용자만 자신의 팔로우를 삭제할 수 있음
    pgPolicy("follows-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.follower_id}`,
    }),
  ],
);

export const notificationType = pgEnum("notification_type", [
  "follow",
  "review",
  "reply",
]);

export const notifications = pgTable(
  "notifications",
  {
    notification_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    source_id: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
    team_id: bigint({ mode: "number" }).references(() => team.team_id, {
      onDelete: "cascade",
    }),
    post_id: bigint({ mode: "number" }).references(() => posts.post_id, {
      onDelete: "cascade",
    }),
    target_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    seen: boolean().default(false).notNull(),
    type: notificationType().notNull(),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    // 모든 알림을 조회할 수 있음
    pgPolicy("notifications-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 시스템에서만 알림을 생성할 수 있음 (인증된 사용자)
    pgPolicy("notifications-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`true`, // 시스템에서 생성하므로 제한 없음
    }),
    // 사용자는 자신의 알림만 수정할 수 있음 (읽음 상태 변경 등)
    pgPolicy("notifications-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.target_id}`,
      withCheck: sql`${authUid} = ${table.target_id}`,
    }),
    // 사용자는 자신의 알림만 삭제할 수 있음
    pgPolicy("notifications-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.target_id}`,
    }),
  ],
);

export const messageRooms = pgTable(
  "message_rooms",
  {
    message_room_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    // SELECT: public에게 모든 접근 허용 (Realtime 작동을 위해)
    pgPolicy("message-rooms select", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // ALL: authenticated에게 is_user_member를 사용한 접근 제어
    pgPolicy("message-rooms policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_user_member(${table.message_room_id}, ${authUid})`,
      withCheck: sql`public.is_user_member(${table.message_room_id}, ${authUid})`,
    }),
  ],
);

export const messageRoomMembers = pgTable(
  "message_room_members",
  {
    message_room_id: bigint({ mode: "number" }).references(
      () => messageRooms.message_room_id,
      {
        onDelete: "cascade",
      },
    ),
    profile_id: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
    is_hidden: boolean().default(false).notNull(),
    is_read: boolean().default(false).notNull(),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    primaryKey({ columns: [table.message_room_id, table.profile_id] }),
    // SELECT: public에게 모든 접근 허용 (Realtime 작동을 위해)
    pgPolicy("message-room-members select", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // ALL: authenticated에게 is_user_member를 사용한 접근 제어
    pgPolicy("message-room-members policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_user_member(${table.message_room_id}, ${authUid})`,
      withCheck: sql`public.is_user_member(${table.message_room_id}, ${authUid})`,
    }),
  ],
);

export const messages = pgTable(
  "messages",
  {
    message_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    message_room_id: bigint({ mode: "number" })
      .references(() => messageRooms.message_room_id, {
        onDelete: "cascade",
      })
      .notNull(),
    sender_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    content: text().notNull(),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    is_read: boolean().default(false).notNull(),
  },
  (table) => [
    // SELECT: public에게 모든 접근 허용 (Realtime 작동을 위해)
    pgPolicy("messages select", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // ALL: authenticated에게 is_user_member를 사용한 접근 제어
    pgPolicy("messages policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_user_member(${table.message_room_id}, ${authUid})`,
      withCheck: sql`public.is_user_member(${table.message_room_id}, ${authUid})`,
    }),
  ],
);

/**
 * Patient Health Profiles
 *
 * Extends the base profile with clinical context that is only applicable
 * to patients undergoing treatment or monitoring.
 */

export const patientTreatmentStatusEnum = pgEnum("patient_treatment_status", [
  "ongoing",
  "completed",
  "follow_up",
]);

export const medicationStatusEnum = pgEnum("patient_medication_status", [
  "none",
  "active",
]);

export const patientHealthProfiles = pgTable(
  "patient_health_profiles",
  {
    patient_id: uuid()
      .primaryKey()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      }),
    age: integer().notNull(),
    gender: text().$type<"M" | "F">().notNull(),
    disease: text().notNull(),
    disease_status: text(),
    treatment_status: patientTreatmentStatusEnum().notNull(),
    medication_status: medicationStatusEnum().notNull().default("none"),
    medication_name: text(),
    height_cm: doublePrecision().notNull(),
    weight_kg: doublePrecision().notNull(),
    ...timestamps,
  },
  (table) => [
    pgPolicy("patient-health-profiles-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.patient_id}`,
    }),
    pgPolicy("patient-health-profiles-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.patient_id}`,
    }),
    pgPolicy("patient-health-profiles-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.patient_id}`,
      withCheck: sql`${authUid} = ${table.patient_id}`,
    }),
    pgPolicy("patient-health-profiles-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.patient_id}`,
    }),
  ],
);

/**
 * Laboratory Test Metadata
 *
 * Defines supported blood test items and their canonical naming.
 */

export const bloodTestTypes = pgTable(
  "blood_test_types",
  {
    test_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    standard_name: text().notNull(),
    variations: jsonb().$type<Record<string, unknown>>().default({}),
    unit: text().notNull(),
    reference_min: doublePrecision(),
    reference_max: doublePrecision(),
    clinical_significance: text(),
    descriptions: jsonb()
      .$type<{
        description?: string;
        significance?: {
          up?: string[];
          down?: string[];
        };
      }>()
      .default({}),
    ...timestamps,
  },
  (table) => [
    pgPolicy("blood-test-types-select", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    pgPolicy("blood-test-types-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`true`,
    }),
  ],
);

/**
 * Blood Test Images
 *
 * Stores blood test image metadata to avoid duplication.
 * Each unique image (identified by SHA-256 hash) is stored once.
 */

export const bloodTestImages = pgTable(
  "blood_test_images",
  {
    image_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    patient_id: uuid()
      .references(() => patientHealthProfiles.patient_id, {
        onDelete: "cascade",
      })
      .notNull(),
    image_hash: text().notNull(), // SHA-256 해시로 중복 이미지 방지 (유니크)
    image_url: text().notNull(),
    test_date: date().notNull(),
    ...timestamps,
  },
  (table) => [
    // 유니크 제약: 같은 해시는 한 번만 저장
    uniqueIndex("blood_test_images_hash_unique").on(table.image_hash),
    pgPolicy("blood-test-images-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.patient_id}`,
    }),
    pgPolicy("blood-test-images-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.patient_id}`,
    }),
    pgPolicy("blood-test-images-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.patient_id}`,
      withCheck: sql`${authUid} = ${table.patient_id}`,
    }),
    pgPolicy("blood-test-images-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.patient_id}`,
    }),
  ],
);

/**
 * Laboratory Results
 *
 * Stores the actual lab measurements per patient and test type.
 */

export const bloodTestResults = pgTable(
  "blood_test_results",
  {
    result_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    patient_id: uuid()
      .references(() => patientHealthProfiles.patient_id, {
        onDelete: "cascade",
      })
      .notNull(),
    test_id: bigint({ mode: "number" })
      .references(() => bloodTestTypes.test_id, {
        onDelete: "restrict",
      })
      .notNull(),
    image_id: bigint({ mode: "number" }).references(
      () => bloodTestImages.image_id,
      {
        onDelete: "set null",
      },
    ),
    result_value: doublePrecision().notNull(),
    confidence: doublePrecision(),
    result_unit: text(),
    test_date: date().notNull(),
    notes: text(),
    ...timestamps,
  },
  (table) => [
    pgPolicy("blood-test-results-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.patient_id}`,
    }),
    pgPolicy("blood-test-results-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.patient_id}`,
    }),
    pgPolicy("blood-test-results-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.patient_id}`,
      withCheck: sql`${authUid} = ${table.patient_id}`,
    }),
    pgPolicy("blood-test-results-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.patient_id}`,
    }),
  ],
);

/**
 * Health Habits Grid System
 *
 * 가벼운 그리드 입력과 상세 템플릿 관리를 분리한 건강습관 기록 시스템
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
 * Grid Options Table
 *
 * 그리드 셀에서 선택할 수 있는 옵션들 (저강도, 루틴1, 숙면 등)
 */
export const gridOptions = pgTable(
  "grid_options",
  {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    category: habitCategoryEnum().notNull(),
    label: text().notNull(),
    kind: gridOptionKindEnum().notNull(),
    template_id: uuid().references(() => sectionTemplates.id, {
      onDelete: "set null",
    }),
    sort_order: integer().notNull().default(0),
    is_active: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [
    // Note: Partial unique indexes are created via SQL migration
    // See: sql/migrations/0086_fix_grid_options_unique_constraint.sql
    // - grid_options_user_category_template_uidx (template_id IS NOT NULL)
    // - grid_options_user_category_label_uidx (template_id IS NULL)
    pgPolicy("grid-options-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("grid-options-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("grid-options-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("grid-options-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Section Templates Table
 *
 * 상세 설정 템플릿 (아침 루틴1, 저강도 등)
 */
export const sectionTemplates = pgTable(
  "section_templates",
  {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    section_type: habitCategoryEnum().notNull(),
    name: text().notNull(),
    notes: text(),
    ...timestamps,
  },
  (table) => [
    pgPolicy("section-templates-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("section-templates-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("section-templates-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("section-templates-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Section Items Table
 *
 * 템플릿의 세부 아이템들 (버버린 500mg, 커큐민 1000mg 등)
 */
export const sectionItems = pgTable(
  "section_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    template_id: uuid()
      .notNull()
      .references(() => sectionTemplates.id, { onDelete: "cascade" }),
    sort_order: integer().notNull().default(0),
    label: text().notNull(),
    amount_num: doublePrecision(),
    amount_unit: text(),
    meta: jsonb().$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    pgPolicy("section-items-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM section_templates
        WHERE section_templates.id = ${table.template_id}
        AND section_templates.user_id = ${authUid}
      )`,
    }),
    pgPolicy("section-items-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM section_templates
        WHERE section_templates.id = ${table.template_id}
        AND section_templates.user_id = ${authUid}
      )`,
    }),
    pgPolicy("section-items-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM section_templates
        WHERE section_templates.id = ${table.template_id}
        AND section_templates.user_id = ${authUid}
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM section_templates
        WHERE section_templates.id = ${table.template_id}
        AND section_templates.user_id = ${authUid}
      )`,
    }),
    pgPolicy("section-items-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM section_templates
        WHERE section_templates.id = ${table.template_id}
        AND section_templates.user_id = ${authUid}
      )`,
    }),
  ],
);

/**
 * Daily Grid Logs Table
 *
 * 오늘 입력한 그리드 로그 (가볍게 저장)
 */
export const dailyGridLogs = pgTable(
  "daily_grid_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    log_date: date().notNull(),
    time_block: habitTimeBlockEnum().notNull(),
    category: habitCategoryEnum().notNull(),
    option_id: uuid().references(() => gridOptions.id, {
      onDelete: "set null",
    }),
    template_id: uuid().references(() => sectionTemplates.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("daily_grid_logs_unique_idx").on(
      table.user_id,
      table.log_date,
      table.time_block,
      table.category,
    ),
    pgPolicy("daily-grid-logs-select", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("daily-grid-logs-insert", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("daily-grid-logs-update", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("daily-grid-logs-delete", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);
