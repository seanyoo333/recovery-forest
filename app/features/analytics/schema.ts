import { sql } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { profiles } from "~/features/users/schema";

export const eventTypes = pgEnum("event_type", [
  "product_view",
  "product_visit",
  "profile_view",
]);

export const events = pgTable(
  "events",
  {
    event_id: uuid("event_id").primaryKey().defaultRandom(),
    event_type: eventTypes("event_type"),
    event_data: jsonb("event_data"),
    profile_id: uuid("profile_id").references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
    created_at: timestamp("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')`),
  },
  (table) => [
    // 모든 사용자는 이벤트를 조회할 수 있음
    pgPolicy("events-select-policy", {
      for: "select",
      to: ["public"],
      as: "permissive",
      using: sql`true`,
    }),
    // 인증된 사용자만 자신의 이벤트를 생성할 수 있음
    pgPolicy("events-insert-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // 인증된 사용자만 자신의 이벤트를 수정할 수 있음
    pgPolicy("events-update-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    // 관리자만 이벤트를 삭제할 수 있음
    pgPolicy("events-delete-policy", {
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
    // 이벤트는 불변이므로 UPDATE 정책은 추가하지 않음
    // 이벤트는 감사 목적으로 삭제 불가하므로 DELETE 정책도 추가하지 않음
  ],
);
