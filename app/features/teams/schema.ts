import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { topics } from "../community/schema";
import { profiles } from "../users/schema";
import { TEAM_POSITIONS } from "./constants";

export const teamPosition = pgEnum(
  "team_position",
  TEAM_POSITIONS.map((position) => position.value) as [string, ...string[]],
);

export const team = pgTable(
  "teams",
  {
    team_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    team_name: text().notNull(),
    team_size: integer().notNull(),
    cost: integer().notNull(),
    team_position: teamPosition().notNull(),
    target: text().notNull(),
    team_description: text().notNull(),
    team_leader_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
    updated_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    check("team_size_check", sql`${table.team_size} BETWEEN 1 AND 100`),
    check(
      "team_description_check",
      sql`LENGTH(${table.team_description}) <= 200`,
    ),
    // 모든 사용자가 팀 정보를 조회할 수 있음
    pgPolicy("teams-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 인증된 사용자만 팀을 생성할 수 있음 (자신이 팀 리더가 되도록)
    pgPolicy("teams-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.team_leader_id}`,
    }),
    // 팀 리더만 자신의 팀을 수정할 수 있음
    pgPolicy("teams-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.team_leader_id}`,
      withCheck: sql`${authUid} = ${table.team_leader_id}`,
    }),
    // 팀 리더만 자신의 팀을 삭제할 수 있음
    pgPolicy("teams-delete-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.team_leader_id}`,
    }),
  ],
);

export const program = pgTable(
  "programs",
  {
    program_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    program_name: text().notNull(),
    program_location: text().notNull(),
    program_address: text().notNull(),
    program_description: text().notNull(),
    topic_id: bigint({ mode: "number" })
      .references(() => topics.topic_id, {
        onDelete: "cascade",
      })
      .notNull(),
    program_notice: text().notNull(),
    program_image: text().notNull(),
    is_free: boolean().notNull(),
    program_url: text().notNull(),
    program_date_start: timestamp().notNull(),
    program_time_start: text().notNull(),
    program_time_end: text().notNull(),
    program_recruitment_start: text().notNull(),
    program_recruitment_end: text().notNull(),
    created_at: timestamp()
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    check("program_name_check", sql`LENGTH(${table.program_name}) > 0`),
    check(
      "program_description_check",
      sql`LENGTH(${table.program_description}) > 0`,
    ),
    // 모든 사용자가 프로그램 정보를 조회할 수 있음
    pgPolicy("programs-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 관리자만 프로그램을 생성할 수 있음
    pgPolicy("programs-insert-policy", {
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
    // 관리자만 프로그램을 수정할 수 있음
    pgPolicy("programs-update-policy", {
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
    // 관리자만 프로그램을 삭제할 수 있음
    pgPolicy("programs-delete-policy", {
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
