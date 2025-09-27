CREATE TABLE "point_payments" (
	"payment_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "point_payments_payment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"payment_key" text NOT NULL,
	"order_id" text NOT NULL,
	"order_name" text NOT NULL,
	"total_amount" double precision NOT NULL,
	"metadata" jsonb NOT NULL,
	"raw_data" jsonb NOT NULL,
	"receipt_url" text NOT NULL,
	"status" text NOT NULL,
	"profile_id" uuid NOT NULL,
	"approved_at" timestamp NOT NULL,
	"requested_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "point_payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "point_payments" ADD CONSTRAINT "point_payments_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "select-payment-policy" ON "point_payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "point_payments"."profile_id");