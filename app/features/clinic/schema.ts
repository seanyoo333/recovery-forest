import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { profiles } from "../users/schema";
import { CLINIC_TYPES, LEVELS, LOCATION_TYPES } from "./constants";

export const clinicTypes = pgEnum(
  "clinic_type",
  CLINIC_TYPES.map((type) => type.value) as [string, ...string[]],
);

export const locations = pgEnum(
  "location",
  LOCATION_TYPES.map((type) => type.value) as [string, ...string[]],
);

export const levels = pgEnum("level", LEVELS);

export const photoTypes = pgEnum("photo_type", [
  "exterior",
  "interior",
  "equipment",
  "staff",
  "other",
]);

export const clinics = pgTable(
  "clinics",
  {
    clinic_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    position: text().notNull(),
    overview: text().notNull(),
    responsibilities: text().notNull(),
    qualifications: text().notNull(),
    benefits: text().notNull(),
    skills: text().notNull(),
    clinic_name: text().notNull(),
    clinic_boss: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
    clinic_logo: text().notNull(),
    clinic_location: text().notNull(),
    apply_url: text().notNull(),
    clinic_type: clinicTypes().notNull(),
    location: locations().notNull(),
    level: levels().notNull(),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    updated_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    // 모든 사용자가 병원 정보를 조회할 수 있음
    pgPolicy("clinics-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 병원 소유자 또는 관리자만 병원을 생성할 수 있음
    pgPolicy("clinics-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.clinic_boss} OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      )`,
    }),
    // 병원 소유자 또는 관리자만 병원을 수정할 수 있음
    pgPolicy("clinics-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.clinic_boss} OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      )`,
      withCheck: sql`${authUid} = ${table.clinic_boss} OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      )`,
    }),
    // 병원 소유자 또는 관리자만 병원을 삭제할 수 있음
    pgPolicy("clinics-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.clinic_boss} OR EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = ${authUid}
        AND admin_role IN ('super_admin', 'clinic_admin')
        AND is_active = true
      )`,
    }),
  ],
);

export const clinicPhotos = pgTable(
  "clinic_photos",
  {
    photo_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    clinic_id: bigint({ mode: "number" })
      .notNull()
      .references(() => clinics.clinic_id, { onDelete: "cascade" }),
    photo_url: text().notNull(),
    photo_type: photoTypes().notNull(),
    photo_title: text(),
    photo_description: text(),
    file_name: text().notNull(),
    file_size: bigint({ mode: "number" }).notNull(),
    mime_type: text().notNull(),
    is_primary: boolean().notNull().default(false),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    updated_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    // 모든 사용자가 병원 사진을 조회할 수 있음
    pgPolicy("clinic-photos-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 병원 소유자 또는 관리자만 병원 사진을 생성할 수 있음
    pgPolicy("clinic-photos-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = ${table.clinic_id}
        AND (
          clinic_boss = ${authUid}
          OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = ${authUid}
            AND admin_role IN ('super_admin', 'clinic_admin')
            AND is_active = true
          )
        )
      )`,
    }),
    // 병원 소유자 또는 관리자만 병원 사진을 수정할 수 있음
    pgPolicy("clinic-photos-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = ${table.clinic_id}
        AND (
          clinic_boss = ${authUid}
          OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = ${authUid}
            AND admin_role IN ('super_admin', 'clinic_admin')
            AND is_active = true
          )
        )
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = ${table.clinic_id}
        AND (
          clinic_boss = ${authUid}
          OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = ${authUid}
            AND admin_role IN ('super_admin', 'clinic_admin')
            AND is_active = true
          )
        )
      )`,
    }),
    // 병원 소유자 또는 관리자만 병원 사진을 삭제할 수 있음
    pgPolicy("clinic-photos-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM clinics
        WHERE clinic_id = ${table.clinic_id}
        AND (
          clinic_boss = ${authUid}
          OR EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE admin_id = ${authUid}
            AND admin_role IN ('super_admin', 'clinic_admin')
            AND is_active = true
          )
        )
      )`,
    }),
  ],
);
