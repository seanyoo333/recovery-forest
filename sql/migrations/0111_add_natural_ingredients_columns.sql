-- Add content columns to natural_ingredients for public-facing detail pages
ALTER TABLE "natural_ingredients" ADD COLUMN IF NOT EXISTS "tagline" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "natural_ingredients" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "natural_ingredients" ADD COLUMN IF NOT EXISTS "mechanism" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "natural_ingredients" ADD COLUMN IF NOT EXISTS "safety_notes" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "natural_ingredients" ADD COLUMN IF NOT EXISTS "picture" text DEFAULT '';
