import {
  bigint,
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";

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

export const clinics = pgTable("clinics", {
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
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

export const clinicPhotos = pgTable("clinic_photos", {
  photo_id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
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
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});
