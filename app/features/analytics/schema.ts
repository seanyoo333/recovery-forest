import { jsonb, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { profiles } from "~/features/users/schema";

export const eventTypes = pgEnum("event_type", [
  "product_view",
  "product_visit",
  "profile_view",
]);

export const events = pgTable("events", {
  event_id: uuid("event_id").primaryKey().defaultRandom(),
  event_type: eventTypes("event_type"),
  event_data: jsonb("event_data"),
  profile_id: uuid("profile_id").references(() => profiles.profile_id, {
    onDelete: "cascade",
  }),
  created_at: timestamp("created_at").defaultNow(),
});
