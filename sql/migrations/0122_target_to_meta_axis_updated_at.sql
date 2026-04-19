ALTER TABLE "target_to_meta_axis"
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
