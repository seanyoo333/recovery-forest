CREATE TABLE IF NOT EXISTS "evidence_figures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_source_id" uuid,
	"doi_norm" text,
	"pmid_norm" text,
	"figure_no" text NOT NULL,
	"source_url" text,
	"license" text DEFAULT 'unknown',
	"image_path" text NOT NULL,
	"image_sha256" text NOT NULL,
	"caption_raw" text,
	"figure_type" text,
	"axes" jsonb,
	"groups" jsonb,
	"key_numbers" jsonb,
	"key_results" jsonb,
	"limitations" jsonb,
	"figure_summary_kr" text,
	"figure_interpretation_kr" text,
	"practical_takeaways_kr" jsonb,
	"alt_text_kr" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evidence_figures" ADD CONSTRAINT "evidence_figures_evidence_source_id_evidence_sources_id_fk" FOREIGN KEY ("evidence_source_id") REFERENCES "public"."evidence_sources"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "evidence_figures_unique_idx" ON "evidence_figures" USING btree ("doi_norm","figure_no","image_sha256");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_figures_doi_idx" ON "evidence_figures" USING btree ("doi_norm");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_figures_pmid_idx" ON "evidence_figures" USING btree ("pmid_norm");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_figures_evidence_source_id_idx" ON "evidence_figures" USING btree ("evidence_source_id");
--> statement-breakpoint
ALTER TABLE "evidence_figures" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "evidence-figures-select-policy" ON "evidence_figures" AS PERMISSIVE FOR SELECT TO public USING (true);
--> statement-breakpoint
CREATE POLICY "evidence-figures-insert-policy" ON "evidence_figures" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));
--> statement-breakpoint
CREATE POLICY "evidence-figures-update-policy" ON "evidence_figures" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
)) WITH CHECK (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));
--> statement-breakpoint
CREATE POLICY "evidence-figures-delete-policy" ON "evidence_figures" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM admin_permissions
  WHERE admin_id = (select auth.uid())
  AND admin_role IN ('super_admin', 'content_admin')
  AND is_active = true
));
