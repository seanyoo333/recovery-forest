-- Remove unused target_tags table and target_tag_category enum
-- These were never used in the codebase and target_to_meta_axis serves the same purpose

-- Step 1: Drop the target_tags table
DROP TABLE IF EXISTS "target_tags";
--> statement-breakpoint

-- Step 2: Drop the target_tag_category enum type
DROP TYPE IF EXISTS "target_tag_category";
--> statement-breakpoint

