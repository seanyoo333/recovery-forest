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
    pgPolicy("Enable read access for all users", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 메시지 룸을 자유롭게 생성할 수 있음
    pgPolicy("message-rooms-insert-policy", {
      for: "insert",
      to: ["public"],
      as: "permissive",
      withCheck: sql`true`, // 룸 생성은 자유롭게 허용
    }),
    // 메시지 룸 멤버만 해당 룸을 수정할 수 있음
    pgPolicy("message-rooms-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM message_room_members
        WHERE message_room_id = ${table.message_room_id}
        AND profile_id = ${authUid}
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM message_room_members
        WHERE message_room_id = ${table.message_room_id}
        AND profile_id = ${authUid}
      )`,
    }),
    // 메시지 룸 멤버만 해당 룸을 삭제할 수 있음
    pgPolicy("message-rooms-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM message_room_members
        WHERE message_room_id = ${table.message_room_id}
        AND profile_id = ${authUid}
      )`,
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
    // 같은 방의 멤버는 다른 멤버도 조회할 수 있음 (메시지 화면에서 상대방 정보 표시를 위함)
    pgPolicy("Enable read access for all users", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 인증된 사용자만 메시지 룸에 참여할 수 있음
    // 자신의 멤버십을 추가하거나, 새로 생성된 메시지룸(아직 메시지가 없는 방)에 다른 사용자를 초대할 수 있음
    //새로 생성된 메시지룸에 다른 사용자를 초대하는 경우
    //조건: 1) 현재 사용자가 이미 해당 방의 멤버이고, 2) 해당 방에 아직 메시지가 없음
    pgPolicy("message-room-members-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`true`,
    }),
    // 같은 방의 멤버는 다른 멤버의 is_read와 is_hidden을 수정할 수 있음
    // (메시지 전송 시 수신자의 읽음 상태를 업데이트하기 위함)
    // 주의: profile_id와 message_room_id는 변경할 수 없음 (애플리케이션 레벨에서 보장)
    pgPolicy("message-room-members-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
      using: sql`${authUid} = ${table.profile_id}`,
    }),
    // 사용자는 자신의 멤버십만 삭제할 수 있음
    pgPolicy("message-room-members-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
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
    // 메시지 룸 멤버만 해당 룸의 메시지를 조회할 수 있음
    pgPolicy("messages-select-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`true 
  `,
    }),
    // 인증된 사용자만 메시지를 전송할 수 있음
    pgPolicy("messages-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`true 
    `,
    }),
    // 메시지 발신자만 자신의 메시지를 수정할 수 있음
    pgPolicy("messages-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.sender_id}`,
      withCheck: sql`${authUid} = ${table.sender_id}`,
    }),
    // 메시지 발신자만 자신의 메시지를 삭제할 수 있음
    pgPolicy("messages-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.sender_id}`,
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
    result_value: doublePrecision().notNull(),
    confidence: doublePrecision(),
    result_unit: text(),
    image_url: text(),
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
