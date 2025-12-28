CREATE TABLE "health_bookmarks" (
	"bookmark_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "health_bookmarks_bookmark_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"profile_id" uuid NOT NULL,
	"bot_message_id" bigint,
	"bot_message_room_id" bigint NOT NULL,
	"content" jsonb NOT NULL,
	"title" text,
	"notes" text,
	"created_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL,
	"updated_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health_bookmarks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "health_bookmarks" ADD CONSTRAINT "health_bookmarks_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_bookmarks" ADD CONSTRAINT "health_bookmarks_bot_message_room_id_bot_message_rooms_bot_message_room_id_fk" FOREIGN KEY ("bot_message_room_id") REFERENCES "public"."bot_message_rooms"("bot_message_room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "health-bookmarks-select" ON "health_bookmarks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("health_bookmarks"."profile_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "health-bookmarks-insert" ON "health_bookmarks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("health_bookmarks"."profile_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "health-bookmarks-update" ON "health_bookmarks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("health_bookmarks"."profile_id" = (select auth.uid())) WITH CHECK ("health_bookmarks"."profile_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "health-bookmarks-delete" ON "health_bookmarks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("health_bookmarks"."profile_id" = (select auth.uid()));