import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
  },
  (table) => [
    check("team_size_check", sql`${table.team_size} BETWEEN 1 AND 100`),
    check(
      "team_description_check",
      sql`LENGTH(${table.team_description}) <= 200`,
    ),
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
    created_at: timestamp().notNull().defaultNow(),
  },
  (table) => [
    check("program_name_check", sql`LENGTH(${table.program_name}) > 0`),
    check(
      "program_description_check",
      sql`LENGTH(${table.program_description}) > 0`,
    ),
  ],
);
