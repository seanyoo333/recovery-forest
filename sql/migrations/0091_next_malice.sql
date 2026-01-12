-- Create streaks table if not exists (table may already exist in database)
CREATE TABLE IF NOT EXISTS "streaks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_log_date" date,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "streaks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "routine-grid-option-ingredients-select" ON "routine_grid_option_ingredients" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "routine-grid-option-ingredients-insert" ON "routine_grid_option_ingredients" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "routine-grid-option-ingredients-update" ON "routine_grid_option_ingredients" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "routine-grid-option-ingredients-delete" ON "routine_grid_option_ingredients" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "routine_grid_option_ingredients" CASCADE;--> statement-breakpoint
-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'streaks_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
-- Create RLS policies if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'streaks' AND policyname = 'streaks-select'
  ) THEN
    CREATE POLICY "streaks-select" ON "streaks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "streaks"."user_id");
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'streaks' AND policyname = 'streaks-insert'
  ) THEN
    CREATE POLICY "streaks-insert" ON "streaks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "streaks"."user_id");
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'streaks' AND policyname = 'streaks-update'
  ) THEN
    CREATE POLICY "streaks-update" ON "streaks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "streaks"."user_id") WITH CHECK ((select auth.uid()) = "streaks"."user_id");
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'streaks' AND policyname = 'streaks-delete'
  ) THEN
    CREATE POLICY "streaks-delete" ON "streaks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "streaks"."user_id");
  END IF;
END $$;