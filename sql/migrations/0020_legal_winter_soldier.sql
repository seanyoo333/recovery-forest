-- Add points column to profiles table
ALTER TABLE "profiles" ADD COLUMN "points" bigint DEFAULT 0 NOT NULL;

-- Add points_updated_at column to track when points were last updated
ALTER TABLE "profiles" ADD COLUMN "points_updated_at" timestamp DEFAULT now() NOT NULL;
