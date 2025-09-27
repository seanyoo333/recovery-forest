CREATE TABLE "bot_message_room_members" (
	"bot_message_room_id" bigint NOT NULL,
	"profile_id" uuid NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_message_rooms" (
	"bot_message_room_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bot_message_rooms_bot_message_room_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"room_name" text DEFAULT 'AI Chat Room' NOT NULL,
	"room_description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_messages" (
	"bot_message_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bot_messages_bot_message_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"bot_message_room_id" bigint NOT NULL,
	"sender_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP POLICY "chat-messages-select-policy" ON "chat_messages" CASCADE;--> statement-breakpoint
DROP POLICY "chat-messages-insert-policy" ON "chat_messages" CASCADE;--> statement-breakpoint
DROP TABLE "chat_messages" CASCADE;--> statement-breakpoint
DROP POLICY "chat-sessions-select-policy" ON "chat_sessions" CASCADE;--> statement-breakpoint
DROP POLICY "chat-sessions-insert-policy" ON "chat_sessions" CASCADE;--> statement-breakpoint
DROP POLICY "chat-sessions-update-policy" ON "chat_sessions" CASCADE;--> statement-breakpoint
DROP POLICY "chat-sessions-delete-policy" ON "chat_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "chat_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "bot_message_room_members" ADD CONSTRAINT "bot_message_room_members_bot_message_room_id_bot_message_rooms_bot_message_room_id_fk" FOREIGN KEY ("bot_message_room_id") REFERENCES "public"."bot_message_rooms"("bot_message_room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_message_room_members" ADD CONSTRAINT "bot_message_room_members_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_message_rooms" ADD CONSTRAINT "bot_message_rooms_created_by_profiles_profile_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_messages" ADD CONSTRAINT "bot_messages_bot_message_room_id_bot_message_rooms_bot_message_room_id_fk" FOREIGN KEY ("bot_message_room_id") REFERENCES "public"."bot_message_rooms"("bot_message_room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_messages" ADD CONSTRAINT "bot_messages_sender_id_profiles_profile_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."message_role";