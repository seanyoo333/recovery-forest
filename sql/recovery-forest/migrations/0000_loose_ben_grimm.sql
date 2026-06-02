CREATE TABLE "external_api_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text,
	"provider" text NOT NULL,
	"endpoint" text,
	"request_payload" jsonb,
	"response_status" integer,
	"response_summary" jsonb,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forest_evidence_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mechanism" text NOT NULL,
	"title" text NOT NULL,
	"authors" text,
	"year" integer,
	"source_url" text,
	"summary" text,
	"external_ites_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forest_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"region" text NOT NULL,
	"sido" text NOT NULL,
	"sigungu" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"altitude_m" integer,
	"area_ha" numeric,
	"tree_species" text[] DEFAULT '{}' NOT NULL,
	"trail_length_km" numeric,
	"trail_difficulty" text,
	"exercise_intensity_met" numeric,
	"accessibility_score" integer,
	"baseline_phytoncide_pptv" numeric,
	"description" text,
	"image_url" text,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "healing_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forest_place_id" uuid,
	"name" text NOT NULL,
	"target_group" text,
	"duration_min" integer,
	"schedule_text" text,
	"fee_krw" integer,
	"description" text,
	"contact" text,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"consent_version" text NOT NULL,
	"text_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_token" text NOT NULL,
	"email" text,
	"status" text DEFAULT 'consented' NOT NULL,
	"consent_version" text,
	"consented_at" timestamp with time zone,
	"program_started_at" timestamp with time zone,
	"program_ended_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journeys_journey_token_unique" UNIQUE("journey_token")
);
--> statement-breakpoint
CREATE TABLE "post_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"sleep_score" integer,
	"fatigue_score" integer,
	"mood_score" integer,
	"stress_score" integer,
	"impression" text,
	"self_report_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_surveys_journey_id_unique" UNIQUE("journey_id")
);
--> statement-breakpoint
CREATE TABLE "pre_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"sleep_score" integer,
	"fatigue_score" integer,
	"mood_score" integer,
	"stress_score" integer,
	"months_since_treatment" integer,
	"self_report_payload" jsonb,
	"recommendation_input" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pre_surveys_journey_id_unique" UNIQUE("journey_id")
);
--> statement-breakpoint
CREATE TABLE "prescription_citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
	"evidence_source_id" uuid,
	"mechanism" text,
	"relevance_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"forest_place_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"weather_snapshot" jsonb,
	"air_quality_snapshot" jsonb,
	"action_plan" jsonb,
	"target_outcome" jsonb,
	"post_measurement_plan" jsonb,
	"ai_summary" text,
	"caution" text,
	"llm_model" text,
	"llm_prompt_version" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recommendation_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text,
	"forest_place_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"input_payload" jsonb NOT NULL,
	"user_priorities" text[] NOT NULL,
	"user_region" text,
	"user_fitness_level" text,
	"user_travel_time_min" integer,
	"weather_snapshot" jsonb,
	"air_quality_snapshot" jsonb,
	"results" jsonb,
	"ai_summary" text,
	"llm_model" text,
	"llm_prompt_version" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "recommendation_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"delta_summary" jsonb,
	"hit_miss" jsonb,
	"narrative" text,
	"citations_snapshot" jsonb,
	"llm_model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_journey_id_unique" UNIQUE("journey_id")
);
--> statement-breakpoint
ALTER TABLE "healing_programs" ADD CONSTRAINT "healing_programs_forest_place_id_forest_places_id_fk" FOREIGN KEY ("forest_place_id") REFERENCES "public"."forest_places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_consents" ADD CONSTRAINT "journey_consents_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_surveys" ADD CONSTRAINT "post_surveys_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_surveys" ADD CONSTRAINT "pre_surveys_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_citations" ADD CONSTRAINT "prescription_citations_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_citations" ADD CONSTRAINT "prescription_citations_evidence_source_id_forest_evidence_sources_id_fk" FOREIGN KEY ("evidence_source_id") REFERENCES "public"."forest_evidence_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_forest_place_id_forest_places_id_fk" FOREIGN KEY ("forest_place_id") REFERENCES "public"."forest_places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_forest_place_id_forest_places_id_fk" FOREIGN KEY ("forest_place_id") REFERENCES "public"."forest_places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_logs_session" ON "external_api_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_api_logs_provider" ON "external_api_logs" USING btree ("provider","created_at");--> statement-breakpoint
CREATE INDEX "idx_forest_evidence_mechanism" ON "forest_evidence_sources" USING btree ("mechanism");--> statement-breakpoint
CREATE INDEX "idx_forest_places_region" ON "forest_places" USING btree ("sido","sigungu");--> statement-breakpoint
CREATE INDEX "idx_forest_places_type" ON "forest_places" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_healing_programs_forest" ON "healing_programs" USING btree ("forest_place_id");--> statement-breakpoint
CREATE INDEX "idx_journey_consents_journey" ON "journey_consents" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "idx_journeys_token" ON "journeys" USING btree ("journey_token");--> statement-breakpoint
CREATE INDEX "idx_journeys_status" ON "journeys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_post_surveys_journey" ON "post_surveys" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "idx_pre_surveys_journey" ON "pre_surveys" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "idx_prescription_citations_prescription" ON "prescription_citations" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_journey" ON "prescriptions" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_status" ON "prescriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_feedback_session" ON "recommendation_feedback" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_rec_sessions_session_id" ON "recommendation_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_rec_sessions_status" ON "recommendation_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reports_journey" ON "reports" USING btree ("journey_id");