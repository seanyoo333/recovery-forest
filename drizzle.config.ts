import type { Config } from "drizzle-kit";

export default {
  out: "./sql/recovery-forest/migrations",
  schema: "./app/features/recovery-forest/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
