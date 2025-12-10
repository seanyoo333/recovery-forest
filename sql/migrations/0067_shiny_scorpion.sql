CREATE TABLE "blood_test_images" (
	"image_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blood_test_images_image_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"patient_id" uuid NOT NULL,
	"image_hash" text NOT NULL,
	"image_url" text NOT NULL,
	"test_date" date NOT NULL,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blood_test_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blood_test_results" ADD COLUMN "image_id" bigint;--> statement-breakpoint
ALTER TABLE "blood_test_images" ADD CONSTRAINT "blood_test_images_patient_id_patient_health_profiles_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_health_profiles"("patient_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blood_test_images_hash_unique" ON "blood_test_images" USING btree ("image_hash");--> statement-breakpoint
ALTER TABLE "blood_test_results" ADD CONSTRAINT "blood_test_results_image_id_blood_test_images_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."blood_test_images"("image_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blood_test_results" DROP COLUMN "image_url";--> statement-breakpoint
CREATE POLICY "blood-test-images-select" ON "blood_test_images" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "blood_test_images"."patient_id");--> statement-breakpoint
CREATE POLICY "blood-test-images-insert" ON "blood_test_images" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "blood_test_images"."patient_id");--> statement-breakpoint
CREATE POLICY "blood-test-images-update" ON "blood_test_images" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "blood_test_images"."patient_id") WITH CHECK ((select auth.uid()) = "blood_test_images"."patient_id");--> statement-breakpoint
CREATE POLICY "blood-test-images-delete" ON "blood_test_images" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "blood_test_images"."patient_id");