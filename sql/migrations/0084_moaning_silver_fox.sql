CREATE TABLE "clinic_reviews" (
	"review_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "clinic_reviews_review_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"clinic_id" bigint NOT NULL,
	"profile_id" uuid NOT NULL,
	"rating" bigint NOT NULL,
	"review" text NOT NULL,
	"patient_friendliness" bigint DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinic_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clinic_reviews" ADD CONSTRAINT "clinic_reviews_clinic_id_clinics_clinic_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("clinic_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_reviews" ADD CONSTRAINT "clinic_reviews_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP VIEW IF EXISTS "public"."clinics_view";--> statement-breakpoint
ALTER TABLE "public"."clinics" ALTER COLUMN "location" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."location";--> statement-breakpoint
CREATE TYPE "public"."location" AS ENUM('seoul', 'busan', 'daegu', 'incheon', 'gwangju', 'daejeon', 'ulsan', 'sejong', 'gyeonggi', 'gangwon', 'chungbuk', 'chungnam', 'jeonbuk', 'jeonnam', 'gyeongbuk', 'gyeongnam', 'jeju');--> statement-breakpoint
ALTER TABLE "public"."clinics" ALTER COLUMN "location" SET DATA TYPE "public"."location" USING "location"::"public"."location";--> statement-breakpoint
CREATE OR REPLACE VIEW "public"."clinics_view"
with (security_invoker=on)
AS
SELECT
    c.clinic_id,
    c.clinic_boss,
    c.clinic_name,
    c.clinic_logo,
    c.clinic_location,
    c.clinic_type,
    c.location,
    c.level,
    c.position,
    c.overview,
    c.responsibilities,
    c.qualifications,
    c.benefits,
    c.skills,
    c.apply_url,
    c.created_at,
    c.updated_at,
    cp_primary.photo_url AS primary_photo_url,
    cp_primary.photo_title AS primary_photo_title,
    cp_primary.photo_description AS primary_photo_description,
    cp_primary.photo_type AS primary_photo_type,
    (SELECT COUNT(*) FROM clinic_photos WHERE clinic_id = c.clinic_id) AS photo_count
FROM clinics c
LEFT JOIN clinic_photos cp_primary ON c.clinic_id = cp_primary.clinic_id AND cp_primary.is_primary = true;--> statement-breakpoint
CREATE POLICY "clinic-reviews-select-policy" ON "clinic_reviews" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "clinic-reviews-insert-policy" ON "clinic_reviews" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = profile_id);--> statement-breakpoint
CREATE POLICY "clinic-reviews-update-policy" ON "clinic_reviews" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = profile_id) WITH CHECK ((select auth.uid()) = profile_id);--> statement-breakpoint
CREATE POLICY "clinic-reviews-delete-policy" ON "clinic_reviews" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = profile_id);