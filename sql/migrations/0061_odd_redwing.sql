CREATE TYPE "public"."patient_medication_status" AS ENUM('none', 'active');--> statement-breakpoint
CREATE TYPE "public"."patient_treatment_status" AS ENUM('ongoing', 'completed', 'follow_up');--> statement-breakpoint
CREATE TABLE "blood_test_results" (
	"result_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blood_test_results_result_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"patient_id" uuid NOT NULL,
	"test_id" bigint NOT NULL,
	"result_value" double precision NOT NULL,
	"confidence" double precision,
	"result_unit" text,
	"image_url" text,
	"test_date" date NOT NULL,
	"notes" text,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blood_test_results" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blood_test_types" (
	"test_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blood_test_types_test_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"standard_name" text NOT NULL,
	"variations" jsonb DEFAULT '{}'::jsonb,
	"unit" text NOT NULL,
	"reference_min" double precision,
	"reference_max" double precision,
	"clinical_significance" text,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blood_test_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "patient_health_profiles" (
	"patient_id" uuid PRIMARY KEY NOT NULL,
	"age" integer NOT NULL,
	"gender" text NOT NULL,
	"disease" text NOT NULL,
	"disease_status" text,
	"treatment_status" "patient_treatment_status" NOT NULL,
	"medication_status" "patient_medication_status" DEFAULT 'none' NOT NULL,
	"medication_name" text,
	"height_cm" double precision NOT NULL,
	"weight_kg" double precision NOT NULL,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_health_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blood_test_results" ADD CONSTRAINT "blood_test_results_patient_id_patient_health_profiles_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_health_profiles"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blood_test_results" ADD CONSTRAINT "blood_test_results_test_id_blood_test_types_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."blood_test_types"("test_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_health_profiles" ADD CONSTRAINT "patient_health_profiles_patient_id_profiles_profile_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "blood-test-results-select" ON "blood_test_results" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "blood_test_results"."patient_id");--> statement-breakpoint
CREATE POLICY "blood-test-results-insert" ON "blood_test_results" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "blood_test_results"."patient_id");--> statement-breakpoint
CREATE POLICY "blood-test-results-update" ON "blood_test_results" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "blood_test_results"."patient_id") WITH CHECK ((select auth.uid()) = "blood_test_results"."patient_id");--> statement-breakpoint
CREATE POLICY "blood-test-results-delete" ON "blood_test_results" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "blood_test_results"."patient_id");--> statement-breakpoint
CREATE POLICY "blood-test-types-select" ON "blood_test_types" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "patient-health-profiles-select" ON "patient_health_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "patient_health_profiles"."patient_id");--> statement-breakpoint
CREATE POLICY "patient-health-profiles-insert" ON "patient_health_profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "patient_health_profiles"."patient_id");--> statement-breakpoint
CREATE POLICY "patient-health-profiles-update" ON "patient_health_profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "patient_health_profiles"."patient_id") WITH CHECK ((select auth.uid()) = "patient_health_profiles"."patient_id");--> statement-breakpoint
CREATE POLICY "patient-health-profiles-delete" ON "patient_health_profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "patient_health_profiles"."patient_id");